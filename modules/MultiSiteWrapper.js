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
 * @param {boolean} needConfirmation
 * @return {jQuery.Promise}
 */
GlobalWatchlistMultiSiteWrapper.prototype.markAllSitesSeen = function ( needConfirmation ) {
	var that = this;

	return new Promise( function ( resolve, reject ) {
		var getConfirmation;
		if ( needConfirmation ) {
			getConfirmation = OO.ui.confirm(
				mw.msg( 'globalwatchlist-markseen-allconfirm' )
			);
		} else {
			getConfirmation = Promise.resolve( true );
		}

		getConfirmation.then(
			function ( confirmed ) {
				if ( confirmed ) {
					Promise.all(
						that.siteList.map( function ( site ) {
							return site.markAsSeen();
						} )
					).then( function () {
						resolve();
					} );
				} else {
					reject();
				}
			}
		);
	} );
};

module.exports = GlobalWatchlistMultiSiteWrapper;
