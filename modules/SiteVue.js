/*
 * Extended version of SiteBase.js for use in Vue version of Special:GlobalWatchlist
 */
( function () {
	'use strict';

	var GlobalWatchlistSiteVue = require( './SiteBase.js' );

	/**
	 * @class GlobalWatchlistSiteVue
	 * @extends GlobalWatchlistSiteBase
	 */

	/**
	 * Update this.entries for the latest entries to show
	 *
	 * @param {array} summary
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
		this.debug( 'afterMarkAsSeen', 'Finished for: ' + this.site, 1 );
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
			'processUpdateWatched',
			'Proccessing after ' + ( unwatched ? 'unwatching' : 'rewatching' ) + ': ' + pageTitle,
			1
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
