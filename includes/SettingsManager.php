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
use MediaWiki\User\UserIdentity;
use MediaWiki\User\UserOptionsManager;
use Psr\Log\LoggerInterface;

/**
 * @author DannyS712
 */
class SettingsManager {

	/**
	 * @var string
	 *
	 * Name for the user option in the database with the user's global watchlist settings
	 * @note This must be the same as the options name used in getSettings.js
	 */
	public const PREFERENCE_NAME = 'global-watchlist-options';

	/**
	 * @var int
	 * Latest version of the format the settings are in, in case it changes
	 */
	private const PREFERENCE_VERSION = 1;

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

	/** @var LoggerInterface */
	private $logger;

	/** @var UserOptionsManager */
	private $userOptionsManager;

	/**
	 * @param LoggerInterface $logger
	 * @param UserOptionsManager $userOptionsManager
	 */
	public function __construct(
		LoggerInterface $logger,
		UserOptionsManager $userOptionsManager
	) {
		$this->logger = $logger;
		$this->userOptionsManager = $userOptionsManager;
	}

	/**
	 * Save user settings
	 *
	 * @param UserIdentity $userIdentity
	 * @param array $options
	 *
	 * @return array
	 */
	public function saveUserOptions( UserIdentity $userIdentity, array $options ) : array {
		$errors = $this->validateSettings( $options );

		if ( $errors === [] ) {
			// Only save if settings are valid
			$options['version'] = self::PREFERENCE_VERSION;

			$optionsStr = FormatJson::encode( $options );
			$this->saveOptionsInternal( $userIdentity, $optionsStr );
		}

		return $errors;
	}

	/**
	 * Actually save user options in the database
	 *
	 * @param UserIdentity $userIdentity
	 * @param string $options
	 */
	private function saveOptionsInternal( UserIdentity $userIdentity, string $options ) {
		$this->logger->debug(
			"Saving options for {username}: {userOptions}",
			[
				'username' => $userIdentity->getName(),
				'userOptions' => $options
			]
		);

		$this->userOptionsManager->setOption(
			$userIdentity,
			self::PREFERENCE_NAME,
			$options
		);

		$this->userOptionsManager->saveOptions( $userIdentity );
	}

	/**
	 * Check if settings chosen are valid
	 *
	 * Array includes the following possible errors:
	 *   - anon-bot
	 *       caused by trying to filter for only anonymous bot edits
	 *   - anon-minor
	 *       caused by trying to filter for only anonymous minor edits
	 *   - no-sites
	 *       caused by trying to submit an empty list of sites
	 *   - no-types
	 *       caused by trying to choose no types to show
	 *
	 * @param array $options
	 * @return array
	 */
	private function validateSettings( array $options ) : array {
		$errors = [];

		$this->logger->debug( 'Validating user options' );

		if ( $options['sites'] === [] ) {
			$errors[] = 'no-sites';
			$this->logger->debug( 'No sites provided' );
		}

		if ( $options['showtypes'] === [] ) {
			$errors[] = 'no-types';
			$this->logger->debug( 'No types of changes chosen' );
		}

		if ( $options['anonfilter'] === self::FILTER_REQUIRE ) {
			if ( $options['botfilter'] === self::FILTER_REQUIRE ) {
				$errors[] = 'anon-bot';
				$this->logger->debug( 'Invalid combination: anon-bot edits' );
			}
			if ( $options['minorfilter'] === self::FILTER_REQUIRE ) {
				$errors[] = 'anon-minor';
				$this->logger->debug( 'Invalid combination: anon-minor edits' );
			}
		}

		if ( $errors === [] ) {
			$this->logger->debug( 'No issues found' );
		}

		return $errors;
	}

}
