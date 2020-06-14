<?php

/**
 * Backend for setting (and eventually retrieving) user settings
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * http://www.gnu.org/copyleft/gpl.html
 *
 * @file
 */

namespace MediaWiki\Extension\GlobalWatchlist;

use FormatJson;
use InvalidArgumentException;
use JavaScriptContent;
use JavaScriptContentHandler;
use Psr\Log\LoggerInterface;
use Status;
use User;
use WikiPage;

/**
 * @author DannyS712
 */
class SettingsManager {

	/**
	 * Make the code clearer by using constants instead of 0, 1, or 2 to represent the filter
	 * statuses. Used for anon filter, bot filter, and minor filter
	 */

	/** @var int Don't care, not filtered */
	private const FILTER_EITHER = 0;

	/** @var int Require that the condition (anon/bot/minor) be matched */
	private const FILTER_REQUIRE = 1;

	/** @var int Exclude edits that match the condition */
	private const FILTER_EXCLUDE = 2;

	/** @val LoggerInterface */
	private $logger;

	/**
	 * @var JavaScriptContentHandler
	 *
	 * Used for converting the options text to a Content object
	 */
	private $javaScriptContentHandler;

	/**
	 * @param LoggerInterface $logger
	 * @param JavaScriptContentHandler $javaScriptContentHandler
	 */
	public function __construct(
		LoggerInterface $logger,
		JavaScriptContentHandler $javaScriptContentHandler
	) {
		$this->logger = $logger;
		$this->javaScriptContentHandler = $javaScriptContentHandler;
	}

	/**
	 * Save user settings
	 *
	 * @param User $user
	 * @param array $options
	 */
	public function saveUserOptions( User $user, array $options ) {
		$userSubpage = $user->getUserPage()->getSubpage( 'global.js' );
		$wikiPage = WikiPage::factory( $userSubpage );

		$optionsStr = FormatJson::encode( $options, true );
		$this->saveOptionsInternal( $user, $wikiPage, $optionsStr );

		$wikiPage->doPurge();
	}

	/**
	 * Actually save user options
	 *
	 * Separate from the public interface to allow unit testing
	 *
	 * @param User $user
	 * @param WikiPage $wikiPage
	 * @param string $options
	 */
	private function saveOptionsInternal( User $user, WikiPage $wikiPage, string $options ) {
		$this->logger->debug(
			"Saving options for {username}: {userOptions}",
			[
				'username' => $user->getName(),
				'userOptions' => $options
			]
		);

		$currentContent = $wikiPage->getContent();

		if ( $currentContent ) {
			/** @var JavaScriptContent $currentContent */
			'@phan-var JavaScriptContent $currentContent';

			$currentText = $currentContent->getText();
			$startingText = preg_replace(
				"/window\.GlobalWatchlistSettings\s*=\s*{[^}]*\};\n?/s",
				'',
				$currentText
			);
		} else {
			$startingText = '';
		}

		$settingsStr = "window.GlobalWatchlistSettings = $options;\n";
		$newText = $settingsStr . $startingText;

		$newContent = $this->javaScriptContentHandler->unserializeContent( $newText );

		$wikiPage->doEditContent(
			$newContent,
			'Automatically updating GlobalWatchlist settings',
			0,
			false,
			$user
		);
	}

	/**
	 * Check if settings chosen are valid
	 *
	 * Status includes the following possible fatals:
	 *   - globalwatchlist-settings-empty-site
	 *       caused by trying to submit an empty or whitespace-only string
	 *   - globalwatchlist-settings-no-types
	 *       caused by trying to choose no types to show
	 *   - globalwatchlist-settings-anon-bot
	 *       caused by trying to filter for only anonymous bot edits
	 *   - globalwatchlist-settings-anon-minor
	 *       caused by trying to filter for only anonymous minor edits
	 *
	 * @param array $options
	 * @return Status
	 * @throws InvalidArgumentException
	 */
	private function validateSettings( array $options ) : Status {
		$status = Status::newGood();

		$this->logger->debug( 'Validating user options' );

		if ( $options['sites'] === [] ) {
			$this->logger->debug( 'Error - no sites provided' );
			throw new InvalidArgumentException(
				'Sites must be chosen, should have been enforced by API'
			);
		}

		foreach ( $options['sites'] as $site ) {
			if ( trim( $site ) === '' ) {
				$status->fatal( 'globalwatchlist-settings-empty-site' );
				$this->logger->debug( 'Empty site detected' );
				break;
			}
		}

		if ( $options['showtypes'] === [] ) {
			$status->fatal( 'globalwatchlist-settings-no-types' );
			$this->logger->debug( 'No types of changes chosen' );
		}

		if ( $options['anonfilter'] === self::FILTER_REQUIRE ) {
			if ( $options['botfilter'] === self::FILTER_REQUIRE ) {
				$status->fatal( 'globalwatchlist-settings-anon-bot' );
				$this->logger->debug( 'Invalid combination: anon-bot edits' );
			}
			if ( $options['minorfilter'] === self::FILTER_REQUIRE ) {
				$status->fatal( 'globalwatchlist-settings-anon-minor' );
				$this->logger->debug( 'Invalid combination: anon-minor edits' );
			}
		}

		if ( $status->isGood() ) {
			$this->logger->debug( 'No issues found' );
		}

		return $status;
	}

}
