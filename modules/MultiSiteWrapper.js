/**
 * Shared helper to reduce code duplication between Vue and non-Vue versions
 * of Special:GlobalWatchlist
 *
 * @class GlobalWatchlistMultiSiteWrapper
 * @constructor
 *
 * @param {Function} SiteClass either SiteDisplay or SiteVue
 * @param {Object} config
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug
 */
function GlobalWatchlistMultiSiteWrapper( SiteClass, config, globalWatchlistDebug ) {
	var GlobalWatchlistLinker = require( './ext.globalwatchlist.linker.js' );
	var watchlistUtils = require( './ext.globalwatchlist.watchlistUtils.js' );

	// Set the Api-User-Agent header - T262177
	var apiConfig = {
		ajax: {
			headers: {
				'Api-User-Agent': 'GlobalWatchlist-MediaWiki/' + mw.config.get( 'wgVersion' )
			}
		}
	};

	/**
	 * @property {Array}
	 * The individual sites
	 */
	this.siteList = config.siteList.map( function ( site ) {
		return new SiteClass(
			globalWatchlistDebug,
			new GlobalWatchlistLinker( site ),
			config,
			new mw.ForeignApi( '//' + site + mw.util.wikiScript( 'api' ), apiConfig ),
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
			// Reset in case it failed earlier
			site.apiError = false;

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

		/**
		 * If the user opted to require confirmation, getConfirmation is the Promise
		 * returned by OO.ui.confirm that resolves to the user's decision (boolean value,
		 * true means that the user confirmed the intention to mark all sites as seen,
		 * false means user cancelled). If the user didn't opt to require confirmation,
		 * we didn't check, but to avoid code duplication we just pretend we checked and
		 * that the answer was confirming the decision to mark all sites as seen, and so
		 * getConfirmatios in a Promise that just always resolves to true.
		 */
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
