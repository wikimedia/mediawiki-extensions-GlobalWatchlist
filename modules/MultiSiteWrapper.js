/**
 * Shared helper to reduce code duplication between Vue and non-Vue versions
 * of Special:GlobalWatchlist
 *
 * @class GlobalWatchlistMultiSiteWrapper
 * @constructor
 *
 * @param {Function} SiteClass
 * @param {Object} config
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug
 */
function GlobalWatchlistMultiSiteWrapper( SiteClass, config, globalWatchlistDebug ) {
	var watchlistUtils = require( './ext.globalwatchlist.watchlistUtils.js' );

	/**
	 * @property {Array}
	 * The individual sites
	 */
	this.siteList = config.siteList.map( function ( site ) {
		return new SiteClass(
			globalWatchlistDebug,
			config,
			new mw.ForeignApi( '//' + site + mw.util.wikiScript( 'api' ) ),
			watchlistUtils,
			site
		);
	} );
}

/**
 * Promise that all of the sites have retrieved their watchlists
 *
 * @param {Object} config
 * @return {jQuery.Promise}
 */
GlobalWatchlistMultiSiteWrapper.prototype.getAllWatchlists = function ( config ) {
	return Promise.all(
		this.siteList.map( function ( site ) {
			return site.getWatchlist( config );
		} )
	);
};

/**
 * Promise that all of the sites have called markAsSeen
 *
 * @return {jQuery.Promise}
 */
GlobalWatchlistMultiSiteWrapper.prototype.markAllSitesSeen = function () {
	return Promise.all(
		this.siteList.map( function ( site ) {
			return site.markAsSeen();
		} )
	);
};

module.exports = GlobalWatchlistMultiSiteWrapper;
