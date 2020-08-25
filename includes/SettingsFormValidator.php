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
 */
class SettingsFormValidator {

	/**
	 * For formatting the relevant errors
	 *
	 * @var MessageLocalizer
	 */
	private $messageLocalizer;

	/**
	 * @param MessageLocalizer $messageLocalizer
	 */
	public function __construct( MessageLocalizer $messageLocalizer ) {
		$this->messageLocalizer = $messageLocalizer;
	}

	/**
	 * Validation callback called from HTMLFormField::validate.
	 *
	 * Ensure that user doesn't try to filter for anonymous bot edits
	 *
	 * @see HTMLFormField::validate
	 *
	 * @param string|array $value for the specific field (bot edit filter)
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
	 * Validation callback called from HTMLFormField::validate.
	 *
	 * Ensure that user doesn't try to filter for anonymous minor edits
	 *
	 * @see HTMLFormField::validate
	 *
	 * @param string|array $value for the specific field (minor edit filter)
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
	 * Validation callback called from HTMLFormField::validate.
	 *
	 * Ensure that at least one site is chosen
	 *
	 * @see HTMLFormField::validate
	 *
	 * @param string|array $value for the specific field (the cloned site fields)
	 * @param array $allData values for all of the form fields
	 * @return bool|string|Message True on success, or string/Message error to display, or
	 *   false to fail validation without displaying an error.
	 */
	public function requireAtLeastOneSite( $value, $allData ) {
		foreach ( $value as $row ) {
			if ( trim( $row['site'] ) !== '' ) {
				return true;
			}
		}

		return $this->messageLocalizer->msg( 'globalwatchlist-settings-error-no-sites' );
	}

	/**
	 * Validation callback called from HTMLFormField::validate.
	 *
	 * Ensure that at least one type of change is shown
	 *
	 * @see HTMLFormField::validate
	 *
	 * @param string|array $value for the specific field (the checkboxes)
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