/*
 * Extended version of SiteBase.js for use in Vue version of Special:GlobalWatchlist
 */
( function () {
	'use strict';

	var GlobalWatchlistSiteBase = require( './SiteBase.js' );

	/**
	 * Represents a specific site, excluding the display (used in Vue display)
	 *
	 * @class GlobalWatchlistSiteVue
	 * @extends GlobalWatchlistSiteBase
	 *
	 * @constructor
	 * @param {GlobalWatchlistDebugger} globalWatchlistDebug
	 * @param {Object} config
	 * @param {Object} api
	 * @param {Object} watchlistUtils
	 * @param {string} urlFragment
	 */
	function GlobalWatchlistSiteVue( globalWatchlistDebug, config, api, watchlistUtils, urlFragment ) {
		GlobalWatchlistSiteVue.super.call(
			this,
			globalWatchlistDebug,
			config,
			api,
			watchlistUtils,
			urlFragment
		);

		// Entries to be used for EntryRow.vue
		this.entries = [];
	}

	OO.inheritClass( GlobalWatchlistSiteVue, GlobalWatchlistSiteBase );

	/**
	 * Update this.entries for the latest entries to show
	 *
	 * @param {Array} summary
	 */
	GlobalWatchlistSiteVue.prototype.renderWatchlist = function ( summary ) {
		this.entries = summary;
		this.entries.forEach( function ( entry ) {
			entry.pageWatched = true;
		} );
	};

	/**
	 * Update display after marking a site as seen
	 */
	GlobalWatchlistSiteVue.prototype.afterMarkAsSeen = function () {
		this.debug( 'afterMarkAsSeen - Finished for: ' + this.site );
		this.entries = [];
	};

	/**
	 * Update entry.pageWatched specific title
	 *
	 * @param {string} pageTitle
	 * @param {boolean} unwatched
	 */
	GlobalWatchlistSiteVue.prototype.processUpdateWatched = function ( pageTitle, unwatched ) {
		this.debug(
			'Processing after ' + ( unwatched ? 'unwatching' : 'rewatching' ) + ': ' + pageTitle
		);

		var pageWatched = !unwatched;

		this.entries.forEach( function ( entry ) {
			if ( entry.title === pageTitle ) {
				entry.pageWatched = pageWatched;
			}
		} );
	};

	module.exports = GlobalWatchlistSiteVue;

}() );
