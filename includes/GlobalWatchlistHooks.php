<?php

/**
 * Hook handler
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
 * @ingroup SpecialPage
 */

namespace MediaWiki\Extension\GlobalWatchlist;

use MediaWiki\HTMLForm\Field\HTMLInfoField;
use MediaWiki\Preferences\Hook\GetPreferencesHook;
use MediaWiki\Skin\Hook\SidebarBeforeOutputHook;
use MediaWiki\Skin\Skin;
use MediaWiki\SpecialPage\SpecialPageFactory;
use MediaWiki\Specials\Hook\LoginFormValidErrorMessagesHook;
use MediaWiki\User\User;

/**
 * @author DannyS712
 */
class GlobalWatchlistHooks implements
	GetPreferencesHook,
	LoginFormValidErrorMessagesHook,
	SidebarBeforeOutputHook
{

	public function __construct(
		private readonly SpecialPageFactory $specialPageFactory,
	) {
	}

	/**
	 * @param User $user
	 * @param array &$preferences
	 */
	public function onGetPreferences( $user, &$preferences ): void {
		$preferences[ SettingsManager::PREFERENCE_NAME ] = [
			'type' => 'api'
		];

		$preferences[ 'globalwatchlist-prefs' ] = [
			'class' => HTMLInfoField::class,
			'section' => 'watchlist/globalwatchlist',
			'label-message' => 'globalwatchlist-prefs-settings'
		];
	}

	/**
	 * Only logged-in users can use Special:GlobalWatchlist and Special:GlobalWatchlistSettings.
	 * Ensure that when anonymous users are redirected to Special:UserLogin, there is a note
	 * explaining why
	 *
	 * @param string[] &$messages
	 */
	public function onLoginFormValidErrorMessages( array &$messages ) {
		$messages[] = 'globalwatchlist-must-login';
		$messages[] = 'globalwatchlist-must-login-for-temp-user';
	}

	/**
	 * Add a link to Special:GlobalWatchlist when on Special:Watchlist
	 *
	 * @param Skin $skin
	 * @param array &$sidebar Sidebar content. Modify $sidebar to add or modify sidebar portlets.
	 */
	public function onSidebarBeforeOutput( $skin, &$sidebar ): void {
		if ( !$skin->getTitle()->isSpecial( 'Watchlist' ) ) {
			return;
		}

		$globalWatchlistTitle = $this->specialPageFactory
			->getPage( 'GlobalWatchlist' )
			->getPageTitle();

		$link = [
			'text' => $skin->msg( 'globalwatchlist-gotoglobal' )->text(),
			'href' => $globalWatchlistTitle->getLinkURL(),
			'title' => $skin->msg( 'globalwatchlist-gotoglobal-tooltip' )->text(),
		];
		$sidebar['navigation'][] = $link;
	}

}
