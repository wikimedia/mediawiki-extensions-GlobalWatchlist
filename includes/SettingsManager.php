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
use JavaScriptContent;
use JavaScriptContentHandler;
use Psr\Log\LoggerInterface;
use User;
use WikiPage;

/**
 * @author DannyS712
 */
class SettingsManager {

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

}
