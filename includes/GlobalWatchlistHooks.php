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

use ApiOptions;
use IBufferingStatsdDataFactory;
use MediaWiki\Api\Hook\ApiOptionsHook;
use MediaWiki\Hook\LoginFormValidErrorMessagesHook;
use MediaWiki\Hook\SkinBuildSidebarHook;
use MediaWiki\Preferences\Hook\GetPreferencesHook;
use MediaWiki\SpecialPage\SpecialPageFactory;
use Skin;
use User;

/**
 * @author DannyS712
 */
class GlobalWatchlistHooks implements
	ApiOptionsHook,
	GetPreferencesHook,
	LoginFormValidErrorMessagesHook,
	SkinBuildSidebarHook
{

	/** @var SpecialPageFactory */
	private $specialPageFactory;

	/** @var IBufferingStatsdDataFactory */
	private $statsdDataFactory;

	/**
	 * @param SpecialPageFactory $specialPageFactory
	 * @param IBufferingStatsdDataFactory $statsdDataFactory
	 */
	public function __construct(
		SpecialPageFactory $specialPageFactory,
		IBufferingStatsdDataFactory $statsdDataFactory
	) {
		$this->specialPageFactory = $specialPageFactory;
		$this->statsdDataFactory = $statsdDataFactory;
	}

	/**
	 * @param ApiOptions $apiModule
	 * @param User $user
	 * @param array $changes Associative array of preference name => value
	 * @param string[] $resetKinds
	 * @return bool|void True or no return value to continue or false to abort
	 */
	public function onApiOptions( $apiModule, $user, $changes, $resetKinds ) {
		if ( array_key_exists( SettingsManager::PREFERENCE_NAME, $changes ) ) {
			$this->statsdDataFactory->increment( 'globalwatchlist.settings.manualchange' );
		}
	}

	/**
	 * @param User $user
	 * @param array &$preferences
	 * @return bool|void True or no return value to continue or false to abort
	 */
	public function onGetPreferences( $user, &$preferences ) {
		$preferences[ SettingsManager::PREFERENCE_NAME ] = [
			'type' => 'api'
		];

		$preferences[ 'globalwatchlist-prefs' ] = [
			'class' => 'HTMLInfoField',
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
	 * @return void
	 */
	public function onLoginFormValidErrorMessages( array &$messages ) {
		$messages = array_merge(
			$messages,
			[ 'globalwatchlist-must-login' ]
		);
	}

	/**
	 * Add a link to Special:GlobalWatchlist when on Special:Watchlist
	 *
	 * @param Skin $skin
	 * @param array &$bar Sidebar contents. Modify $bar to add or modify sidebar portlets.
	 * @return bool|void True or no return value to continue or false to abort
	 */
	public function onSkinBuildSidebar( $skin, &$bar ) {
		$title = $skin->getTitle();
		$onWatchlist = $title->isSpecial( 'Watchlist' );
		if ( !$onWatchlist ) {
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
		$bar['navigation'][] = $link;
	}

}
