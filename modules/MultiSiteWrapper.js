/**
 * Shared helper to reduce code duplication between Vue and non-Vue versions
 * of Special:GlobalWatchlist
 *
 * @class GlobalWatchlistMultiSiteWrapper
 * @constructor
 *
 * @param {Function} SiteClass either {@link GlobalWatchlistSiteDisplay} or
 *    {@link GlobalWatchlistSiteVue}, used to create the individual site objects
 * @param {Object} config User configuration to use
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug Shared debugger instance
 */
function GlobalWatchlistMultiSiteWrapper( SiteClass, config, globalWatchlistDebug ) {
	var GlobalWatchlistLinker = require( './Linker.js' );
	var watchlistUtils = require( './watchlistUtils.js' );

	// Set the Access-Control-Max-Age header - T268267
	// Set the Api-User-Agent header - T262177
	var apiConfig = {
		ajax: {
			headers: {
				'Access-Control-Max-Age': 300,
				'Api-User-Agent': 'GlobalWatchlist-MediaWiki/' + mw.config.get( 'wgVersion' )
			}
		}
	};

	/**
	 * @property {Array} siteList The individual sites
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

	/**
	 * @property {boolean} whether to ask the user to confirm their decision when
	 * marking all sites as seen
	 */
	this.confirmMarkAllSitesSeen = config.confirmAllSites;
}

/**
 * Promise that all of the sites have retrieved their watchlists
 *
 * @param {Object} config User configuration to use. Needs to be passed rather
 *   than using the configuration we got in the constructor because some parts
 *   of it can change (specifically whether to group results by page, and the
 *   timestamp of the start of the call that is used when marking sites as seen).
 * @return {Promise} Promise that all watchlists were retrieved
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
 * @return {Promise} Promise that all sites were marked as seen
 */
GlobalWatchlistMultiSiteWrapper.prototype.markAllSitesSeen = function () {
	var that = this;

	return new Promise( function ( resolve, reject ) {
		var getConfirmation;

		if ( that.confirmMarkAllSitesSeen ) {
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
		 * getConfirmation is a Promise that just always resolves to true.
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
