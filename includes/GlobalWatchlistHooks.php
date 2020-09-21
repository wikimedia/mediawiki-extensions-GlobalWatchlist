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
use ExtensionRegistry;
use IBufferingStatsdDataFactory;
use MediaWiki\Api\Hook\ApiOptionsHook;
use MediaWiki\Hook\LoginFormValidErrorMessagesHook;
use MediaWiki\Hook\SkinBuildSidebarHook;
use MediaWiki\Preferences\Hook\GetPreferencesHook;
use MediaWiki\ResourceLoader\Hook\ResourceLoaderRegisterModulesHook;
use MediaWiki\SpecialPage\SpecialPageFactory;
use ResourceLoader;
use Skin;
use User;

/**
 * @author DannyS712
 */
class GlobalWatchlistHooks implements
	ApiOptionsHook,
	GetPreferencesHook,
	LoginFormValidErrorMessagesHook,
	ResourceLoaderRegisterModulesHook,
	SkinBuildSidebarHook
{

	/** @var ExtensionRegistry */
	private $extensionRegistry;

	/** @var SpecialPageFactory */
	private $specialPageFactory;

	/** @var IBufferingStatsdDataFactory */
	private $statsdDataFactory;

	/**
	 * @param ExtensionRegistry $extensionRegistry
	 * @param SpecialPageFactory $specialPageFactory
	 * @param IBufferingStatsdDataFactory $statsdDataFactory
	 */
	public function __construct(
		ExtensionRegistry $extensionRegistry,
		SpecialPageFactory $specialPageFactory,
		IBufferingStatsdDataFactory $statsdDataFactory
	) {
		$this->extensionRegistry = $extensionRegistry;
		$this->specialPageFactory = $specialPageFactory;
		$this->statsdDataFactory = $statsdDataFactory;
	}

	/**
	 * Need a factory method to inject ExtensionRegistry, which is not available from
	 * the service container
	 *
	 * @param SpecialPageFactory $specialPageFactory
	 * @param IBufferingStatsdDataFactory $statsdDataFactory
	 * @return GlobalWatchlistHooks
	 */
	public static function newFromGlobalState(
		SpecialPageFactory $specialPageFactory,
		IBufferingStatsdDataFactory $statsdDataFactory
	) {
		return new GlobalWatchlistHooks(
			ExtensionRegistry::getInstance(),
			$specialPageFactory,
			$statsdDataFactory
		);
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
	 * Register ResourceLoader modules with dynamic dependencies.
	 *
	 * @param ResourceLoader $resourceLoader
	 * @return void
	 */
	public function onResourceLoaderRegisterModules( ResourceLoader $resourceLoader ) : void {
		if ( !$this->extensionRegistry->isLoaded( 'GuidedTour' ) ) {
			return;
		}

		// Conditionally registered: only register the GuidedTour for
		// Special:GlobalWatchlistSettings if the GuidedTour extension
		// is available to rely upon
		$resourceLoaderModule = [
			'localBasePath' => __DIR__ . '/../modules',
			'remoteExtPath' => 'GlobalWatchlist/modules',
			'packageFiles' => [
				'SettingsTour.js'
			],
			'dependencies' => [
				'ext.guidedTour'
			],
			'messages' => [
				'globalwatchlist-tour-addsite',
				'globalwatchlist-tour-addsite-description',
				'globalwatchlist-tour-fastmode',
				'globalwatchlist-tour-fastmode-description',
				'globalwatchlist-tour-filters',
				'globalwatchlist-tour-filters-description',
				'globalwatchlist-tour-help',
				'globalwatchlist-tour-help-description',
				'globalwatchlist-tour-intro',
				'globalwatchlist-tour-intro-description',
				'globalwatchlist-tour-sitelist',
				'globalwatchlist-tour-sitelist-description',
				'globalwatchlist-tour-types',
				'globalwatchlist-tour-types-description',
			]
		];
		$resourceLoader->register(
			'ext.guidedTour.globalWatchlistSettings',
			$resourceLoaderModule
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
