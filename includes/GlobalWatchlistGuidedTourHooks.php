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

use ExtensionRegistry;
use MediaWiki\ResourceLoader\Hook\ResourceLoaderRegisterModulesHook;
use ResourceLoader;

/**
 * @author DannyS712
 */
class GlobalWatchlistGuidedTourHooks implements
	ResourceLoaderRegisterModulesHook
{

	/** @var ExtensionRegistry */
	private $extensionRegistry;

	/**
	 * @param ExtensionRegistry $extensionRegistry
	 */
	public function __construct(
		ExtensionRegistry $extensionRegistry
	) {
		$this->extensionRegistry = $extensionRegistry;
	}

	/**
	 * Need a factory method to inject ExtensionRegistry, which is not available from
	 * the service container
	 *
	 * @return GlobalWatchlistGuidedTourHooks
	 */
	public static function newFromGlobalState() {
		return new GlobalWatchlistGuidedTourHooks(
			ExtensionRegistry::getInstance()
		);
	}

	/**
	 * Register ResourceLoader modules with dynamic dependencies.
	 *
	 * @param ResourceLoader $resourceLoader
	 * @return void
	 */
	public function onResourceLoaderRegisterModules( ResourceLoader $resourceLoader ): void {
		$config = $resourceLoader->getConfig();
		if ( !$config->get( 'GlobalWatchlistEnableGuidedTour' ) ||
			!$this->extensionRegistry->isLoaded( 'GuidedTour' )
		) {
			return;
		}

		// Conditionally registered: only register the GuidedTour for
		// Special:GlobalWatchlistSettings if the GuidedTour extension
		// is available to rely upon and $wgGlobalWatchlistEnableGuidedTour
		// is true
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

}
