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

use MediaWiki\Json\FormatJson;
use MediaWiki\User\Options\UserOptionsManager;
use MediaWiki\User\UserIdentity;
use Psr\Log\LoggerInterface;
use Wikimedia\Stats\IBufferingStatsdDataFactory;

/**
 * @author DannyS712
 * @internal
 */
class SettingsManager {

	/**
	 * Name for the user option in the database with the user's global watchlist settings
	 * @note This must be the same as the options name used in getSettings.js
	 */
	public const PREFERENCE_NAME = 'global-watchlist-options';

	/**
	 * Latest version of the format the settings are in, in case it changes
	 */
	public const PREFERENCE_VERSION = 1;

	/**
	 * Make the code clearer by using constants instead of 0, 1, or 2 to represent the filter
	 * statuses. Used for anon filter, bot filter, and minor filter
	 */

	/** Don't care, not filtered */
	public const FILTER_EITHER = 0;
	/** Require that the condition (anon/bot/minor) be matched */
	public const FILTER_REQUIRE = 1;
	/** Exclude edits that match the condition */
	public const FILTER_EXCLUDE = 2;

	private LoggerInterface $logger;
	private UserOptionsManager $userOptionsManager;
	private IBufferingStatsdDataFactory $statsdDataFactory;

	public function __construct(
		LoggerInterface $logger,
		UserOptionsManager $userOptionsManager,
		IBufferingStatsdDataFactory $statsdDataFactory
	) {
		$this->logger = $logger;
		$this->userOptionsManager = $userOptionsManager;
		$this->statsdDataFactory = $statsdDataFactory;
	}

	/**
	 * Save user settings
	 */
	public function saveUserOptions( UserIdentity $userIdentity, array $options ): void {
		$this->logSettingsChange( $userIdentity );

		// When saving the options, make sure that `version` is at the start of the
		// serialized JSON. In case we ever need to make a breaking change to the
		// preferences and use a maintenance script to migrate existing settings,
		// we will need to be able to search for users that have the old version
		// number. Its a lot quicker to search for a substring at the start of
		// the blob than in the middle or at the end.
		$dbOptions = [ 'version' => self::PREFERENCE_VERSION ] + $options;

		$this->saveOptionsInternal( $userIdentity, FormatJson::encode( $dbOptions ) );
	}

	/**
	 * Log the user saving their settings
	 *
	 * Differentiate between users changing existing settings and users saving settings
	 * for the first time
	 */
	private function logSettingsChange( UserIdentity $userIdentity ): void {
		$currentOptions = $this->userOptionsManager->getOption(
			$userIdentity,
			self::PREFERENCE_NAME,
			false
		);

		// $currentOptions is `false` if the user is saving their settings for the
		// first time, or a string with the user's option otherwise
		if ( $currentOptions === false ) {
			$this->statsdDataFactory->increment( 'globalwatchlist.settings.new' );
		} else {
			$this->statsdDataFactory->increment( 'globalwatchlist.settings.change' );
		}
	}

	/**
	 * Actually save user options in the database
	 */
	private function saveOptionsInternal( UserIdentity $userIdentity, string $options ): void {
		$this->logger->info(
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

}
