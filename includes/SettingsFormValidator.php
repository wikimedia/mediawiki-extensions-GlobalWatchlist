<?php

/**
 * Implements validation for HTMLForm at Special:GlobalWatchlistSettings
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

use Message;
use MessageLocalizer;

/**
 * @author DannyS712
 * @internal
 */
class SettingsFormValidator {

	/**
	 * For formatting the relevant errors
	 *
	 * @var MessageLocalizer
	 */
	private $messageLocalizer;

	/**
	 * Reference to $wgGlobalWatchlistSiteLimit, limiting the number of sites a user can include
	 *
	 * @var int
	 */
	private $maxSites;

	/**
	 * Array of url forms of sites the user has attached accounts on (from CentralAuth),
	 * to check against, or null if CentralAuth is not available
	 *
	 * @var string[]|null
	 */
	private $validSites;

	/**
	 * @param MessageLocalizer $messageLocalizer
	 * @param int $maxSites
	 * @param string[]|null $validSites
	 */
	public function __construct(
		MessageLocalizer $messageLocalizer,
		int $maxSites,
		?array $validSites
	) {
		$this->messageLocalizer = $messageLocalizer;
		$this->maxSites = $maxSites;
		$this->validSites = $validSites;
	}

	/**
	 * Validation callback called from HTMLRadioField::validate.
	 *
	 * Ensure that user doesn't try to filter for anonymous bot edits
	 *
	 * @see HTMLRadioField::validate
	 *
	 * @param string $value for the specific field (bot edit filter)
	 * @param array $allData values for all of the form fields
	 * @return bool|string|Message True on success, or string/Message error to display, or
	 *   false to fail validation without displaying an error.
	 */
	public function validateAnonBot( $value, $allData ) {
		if ( (int)$value === SettingsManager::FILTER_REQUIRE &&
			(int)$allData['anon'] === SettingsManager::FILTER_REQUIRE
		) {
			return $this->messageLocalizer->msg( 'globalwatchlist-settings-error-anon-bot' );
		}
		return true;
	}

	/**
	 * Validation callback called from HTMLRadioField::validate.
	 *
	 * Ensure that user doesn't try to filter for anonymous minor edits
	 *
	 * @see HTMLRadioField::validate
	 *
	 * @param string $value for the specific field (minor edit filter)
	 * @param array $allData values for all of the form fields
	 * @return bool|string|Message True on success, or string/Message error to display, or
	 *   false to fail validation without displaying an error.
	 */
	public function validateAnonMinor( $value, $allData ) {
		if ( (int)$value === SettingsManager::FILTER_REQUIRE &&
			(int)$allData['anon'] === SettingsManager::FILTER_REQUIRE
		) {
			return $this->messageLocalizer->msg( 'globalwatchlist-settings-error-anon-minor' );
		}
		return true;
	}

	/**
	 * Validation callback called from HTMLFormFieldCloner::validate.
	 *
	 * Ensure that at least one site is chosen, that no site is chosen multiple times, and that
	 * the maximum number of sites is not exceeded.
	 *
	 * @see HTMLFormFieldCloner::validate
	 *
	 * @param array $value for the specific field (the cloned site fields)
	 *   should always be a multidimensional array since this is for an HTMLFormFieldCloner field
	 * @param array $allData values for all of the form fields
	 * @return bool|string|Message True on success, or string/Message error to display, or
	 *   false to fail validation without displaying an error.
	 */
	public function validateSitesChosen( $value, $allData ) {
		$sitesChosen = [];
		foreach ( $value as $row ) {
			$site = trim( $row['site'] ?? '' );
			// Since there isn't an easy way to reorder sites other than just deleting
			// the rows and adding them to the bottom manually, sometimes a field might
			// be blank - thats okay, skip it
			if ( $site === '' ) {
				continue;
			}

			// Accept and handle sites with a protocol, see T262762
			// normalize before checking for duplicates and invalid sites
			$site = preg_replace( '/^(?:https?:)?\/\//', '', $site );

			// Avoid duplicate sites, T273532
			if ( isset( $sitesChosen[$site] ) ) {
				return $this->messageLocalizer
					->msg( 'globalwatchlist-settings-error-duplicate-site' )
					->params( $site );
			}

			// Validate against CentralAuth, if available, T268210
			if ( $this->validSites !== null &&
				!in_array( $site, $this->validSites )
			) {
				return $this->messageLocalizer
					->msg( 'globalwatchlist-settings-error-invalid-site' )
					->params( $site );
			}

			$sitesChosen[$site] = true;
		}

		$siteCount = count( $sitesChosen );
		if ( $siteCount === 0 ) {
			return $this->messageLocalizer->msg(
				'globalwatchlist-settings-error-no-sites'
			);
		}

		if ( $this->maxSites && $siteCount > $this->maxSites ) {
			return $this->messageLocalizer
				->msg( 'globalwatchlist-settings-error-too-many-sites' )
				->numParams( $siteCount, $this->maxSites );
		}

		return true;
	}

	/**
	 * Validation callback called from HTMLMultiSelectField::validate.
	 *
	 * Ensure that at least one type of change is shown
	 *
	 * @see HTMLMultiSelectField::validate
	 *
	 * @param array $value for the specific field (the checkboxes)
	 * @param array $allData values for all of the form fields
	 * @return bool|string|Message True on success, or string/Message error to display, or
	 *   false to fail validation without displaying an error.
	 */
	public function requireShowingOneType( $value, $allData ) {
		if ( $value === [] ) {
			return $this->messageLocalizer->msg( 'globalwatchlist-settings-error-no-types' );
		}
		return true;
	}

}
