/* eslint-disable no-unused-vars */
/**
 * Represents a specific site
 *
 * @class GlobalWatchlistSiteBase
 *
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug Debugger instance to log to
 * @param {GlobalWatchlistLinker} linker Linker instance to use
 * @param {Object} config User configuration
 * @param {Object} api Instance of mw.ForeignApi to use
 * @param {Object} watchlistUtils Reference to {@link watchlistUtils}
 * @param {string} urlFragment string for which site this represents
 */
function GlobalWatchlistSiteBase( globalWatchlistDebug, linker, config, api, watchlistUtils, urlFragment ) {
	// Logger to send debug info to
	this.debugLogger = globalWatchlistDebug;

	// User config and other settings, retrieved from getSettings
	this.config = config;

	// The api object to interact with
	this.apiObject = api;

	// Utility methods
	this.watchlistUtils = watchlistUtils;

	// Site identifier in url format
	this.site = urlFragment;

	// Linker utility (GlobalWatchlistLinker)
	this.linker = linker;

	// Site identifier in format that can be used for element attributes
	this.siteID = encodeURIComponent( urlFragment.replace( /\./g, '_' ) );

	// Whether this site had any changes to show
	this.isEmpty = false;

	// Cached information about the tags of a site
	this.tags = {};

	// Whether there was an error when trying to use the API. To be able to use Promise.all,
	// API failures still resolve the Promise rather than rejecting it. If Promise.allSettled
	// becomes available for use, this should no longer be needed
	this.apiError = false;

	// Instance of GlobalWatchlistWikibaseHandler, only used for wikibase
	// Don't create it if it will never be needed
	if ( this.site === config.wikibaseSite ) {
		var GlobalWatchlistWikibaseHandler = require( './WikibaseHandler.js' );
		this.wikibaseHandler = new GlobalWatchlistWikibaseHandler(
			globalWatchlistDebug,
			api,
			config.lang
		);
	}
}

/**
 * Shortcut for sending information to the debug logger
 *
 * @param {string} msg Message for debug entry
 * @param {string} [extraInfo] Extra information for debug entry
 */
GlobalWatchlistSiteBase.prototype.debug = function ( msg, extraInfo ) {
	this.debugLogger.info( this.site + ':' + msg, extraInfo );
};

/**
 * Shortcut for sending errors to the debug logger
 *
 * @param {string} msg Message for error entry
 * @param {Object} data Extra information for error entry
 */
GlobalWatchlistSiteBase.prototype.error = function ( msg, data ) {
	this.debugLogger.error( this.site + ':' + msg, data );
};

/**
 * API handler for debugging and avoiding actual important actions when testing client-side
 *
 * @param {string} func Function name
 * @param {Object} content Content to send to the api
 * @param {string} name Name, for logging purposes
 * @return {jQuery.Promise} Result of the api call
 */
GlobalWatchlistSiteBase.prototype.api = function ( func, content, name ) {
	var that = this;

	return new Promise( function ( resolve, reject ) {
		that.debug( 'API.' + name + ' (called), with func & content:', [ func, content ] );
		that.apiObject[ func ]( content ).then( function ( response ) {
			that.debug(
				'API.' + name + ' (result); func, content, & response',
				[ func, content, response ]
			);
			resolve( response );
		} ).catch( function ( code, data ) {
			that.error( 'API.' + name + ' ' + code, data );
			that.apiError = true;

			var $userNotification = $( '<div>' )
				.append(
					mw.msg( 'globalwatchlist-api-error', that.site ),
					that.apiObject.getErrorMessage( data )
				);

			mw.notify(
				$userNotification,
				{
					type: 'error',
					autoHide: false
				}
			);

			// See above on apiError for why this resolves instead of rejecting
			// since we don't know what exactly the caller was expected, just
			// resolve "error" and leave the handling for the caller
			resolve( 'ERROR' );
		} );
	} );
};

/**
 * Get the changes on a user's watchlist
 *
 * This method calls itself recursively until there are no remaining changes to retrieve,
 * using the `continue` functionality.
 *
 * @param {number} iteration iteration count
 * @param {string} continueFrom value of wlcontinue in the previous call
 * @return {jQuery.Promise} Promise of api result
 */
GlobalWatchlistSiteBase.prototype.actuallyGetWatchlist = function ( iteration, continueFrom ) {
	var that = this;

	return new Promise( function ( resolve ) {
		var getter = {
			action: 'query',
			formatversion: 2,
			list: 'watchlist',
			wllimit: 'max',
			wlprop: that.config.watchlistQueryProps,
			wlshow: that.config.watchlistQueryShow,
			wltype: that.config.watchlistQueryTypes
		};
		if ( iteration > 1 ) {
			getter.wlcontinue = continueFrom;
		}
		if ( !that.config.fastMode ) {
			getter.wlallrev = true;
		}

		that.api( 'get', getter, 'actuallyGetWatchlist #' + iteration ).then( function ( response ) {
			if ( response === 'ERROR' ) {
				resolve( [] );
				return;
			}
			var wlraw = response.query.watchlist;
			if ( response.continue && response.continue.wlcontinue ) {
				that.actuallyGetWatchlist(
					iteration + 1,
					response.continue.wlcontinue
				).then( function ( innerResponse ) {
					// If there was an error in the recursive call, this just
					// adds an empty array. getWatchlist checks this.apiError
					// before assuming that an empty response means nothing to show
					resolve( wlraw.concat( innerResponse ) );
				} );
			} else {
				resolve( wlraw );
			}
		} );
	} );
};

/**
 * Update the strikethrough and text for entries being watched/unwatched
 *
 * Calls the API to actually unwatch/rewatch a page
 *
 * Calls `processUpdateWatched` to update the display (either add or remove the strikethrough,
 *   and update the text shown)
 *
 * If fast mode is not enabled, calls `getAssociatedTalkPage` to determine the talk/subject page
 *   associated with the one that was unwatched/rewatched, and then uses `processUpdateWatched`
 *   to update the display of any entries for the associated page
 *
 * @param {string} pageTitle Title of the page to watch or unwatch
 * @param {string} func Either 'watch' or 'unwatch'
 */
GlobalWatchlistSiteBase.prototype.changeWatched = function ( pageTitle, func ) {
	this.debug( 'changeWatched - Going to ' + func + ': ' + pageTitle );
	var that = this;
	this.api( func, pageTitle, 'updateWatched' );
	this.processUpdateWatched( pageTitle, func === 'unwatch' );
	if ( !this.config.fastMode ) {
		this.getAssociatedPageTitle( pageTitle ).then( function ( associatedTitle ) {
			that.processUpdateWatched( associatedTitle, func === 'unwatch' );
			// TODO re-add functionality for old checkChangesShown
		} );
	}
};

/**
 * Returns the talk/subject page associated with a given page, since entries for the associated page
 *   also need to have their text and strikethrough updated on unwatching/rewatching
 *
 * Note: this should be a part of the core info api, see T257014
 *
 * @param {string} pageTitle Title of the page for which to retrieve the associated page
 * @return {jQuery.Promise} Promise of api result
 */
GlobalWatchlistSiteBase.prototype.getAssociatedPageTitle = function ( pageTitle ) {
	var that = this;
	return new Promise( function ( resolve ) {
		var getter = {
			action: 'parse',
			contentmodel: 'wikitext',
			formatversion: 2,
			onlypst: true,
			text: '{{subst:TALKPAGENAME:' + pageTitle + '}}\n{{subst:SUBJECTPAGENAME:' + pageTitle + '}}'
		};
		that.api( 'get', getter, 'parseOnlyPST' ).then( function ( response ) {
			var titles = response.parse.text.split( '\n' );
			resolve( titles[ 1 ] === pageTitle ? titles[ 0 ] : titles[ 1 ] );
		} );
	} );
};

/**
 * Ensure that the tags are loaded for a wiki
 *
 * Once this is called once, the tag info is stored in this.tags and future calls with return early
 *
 * @return {jQuery.Promise} a promise that the tags where retrieved, not the tags themselves
 */
GlobalWatchlistSiteBase.prototype.getTagList = function () {
	var that = this;
	return new Promise( function ( resolve ) {
		if ( that.config.fastMode || Object.keys( that.tags ).length > 0 ) {
			resolve();
		} else {
			var getter = {
				action: 'query',
				list: 'tags',
				tglimit: 'max',
				tgprop: 'displayname'
			};
			that.api( 'get', getter, 'getTags' ).then( function ( response ) {
				var asObject = {};
				response.query.tags.forEach( function ( tag ) {
					asObject[ tag.name ] = ( tag.displayname || false ) ?
						that.linker.fixLocalLinks( tag.displayname ) :
						tag.name;
				} );
				that.debug( 'getTagList', asObject );
				that.tags = asObject;
				resolve();
			} );
		}
	} );
};

/**
 * Get the rendered changes for a user's watchlist
 *
 * @param {Object} latestConfig config, can change
 * @return {jQuery.Promise} Promise that the watchlist was retrieved
 */
GlobalWatchlistSiteBase.prototype.getWatchlist = function ( latestConfig ) {
	this.config = latestConfig;
	var that = this;
	return new Promise( function ( resolve ) {
		that.actuallyGetWatchlist( 1, 0 ).then( function ( wlraw ) {
			if ( !( wlraw && wlraw[ 0 ] ) ) {
				if ( that.apiError ) {
					that.debug( 'getWatchlist - error' );

					// Include in the normal display section
					that.isEmpty = false;

					that.renderApiFailure();
				} else {
					that.debug( 'getWatchlist - empty' );
					that.isEmpty = true;
				}

				resolve();
				return;
			}
			// In case it was previously set to true
			that.isEmpty = false;

			that.debug( 'getWatchlist wlraw', wlraw );

			var prelimSummary = that.watchlistUtils.rawToSummary(
				wlraw,
				that.site,
				that.config.groupPage,
				that.linker
			);
			that.debug( 'getWatchlist prelimSummary', prelimSummary );

			that.makeWikidataList( prelimSummary ).then( function ( summary ) {
				that.debug( 'getWatchlist summary', summary );
				that.getTagList().then( function () {
					that.renderWatchlist( summary );
					resolve();
				} );
			} );
		} );
	} );
};

/**
 * Display the watchlist
 *
 * Overriden in {@link GlobalWatchlistSiteDisplay} and {@link GlobalWatchlistSiteVue}
 *
 * @param {Array} summary What should be rendered
 */
GlobalWatchlistSiteBase.prototype.renderWatchlist = function ( summary ) {
	// STUB
};

/**
 * Fetch and process wikibase labels when the watchlist is for wikidata
 *
 * @param {Array} summary Original summary, with page titles (Q1, P2, L3, etc.)
 * @return {jQuery.Promise} Updated summary, with labels
 */
GlobalWatchlistSiteBase.prototype.makeWikidataList = function ( summary ) {
	var that = this;
	return new Promise( function ( resolve ) {
		if ( that.site !== that.config.wikibaseSite || that.config.fastMode ) {
			resolve( summary );
		} else {
			that.wikibaseHandler.addWikibaseLabels( summary ).then( function ( updatedSummary ) {
				resolve( updatedSummary );
			} );
		}
	} );
};

/**
 * Mark a site as seen
 */
GlobalWatchlistSiteBase.prototype.markAsSeen = function () {
	this.debug( 'markSiteAsSeen - marking' );
	var that = this;

	return new Promise( function ( resolve ) {
		var setter = {
			action: 'setnotificationtimestamp',
			entirewatchlist: true,
			timestamp: that.config.time.toISOString()
		};
		that.api( 'postWithEditToken', setter, 'actuallyMarkSiteAsSeen' );

		that.afterMarkAsSeen();

		// Done within a promise so that Vue can ensure re-rendering occurs after
		// entries are updated
		resolve();
	} );
};

/**
 * Update display after making a site as seen
 *
 * Overriden in {@link GlobalWatchlistSiteDisplay} and {@link GlobalWatchlistSiteVue}
 */
GlobalWatchlistSiteBase.prototype.afterMarkAsSeen = function () {
	// STUB
};

/**
 * Update entry click handlers, text, and strikethrough for a specific title
 *
 * Overriden in {@link GlobalWatchlistSiteDisplay} and {@link GlobalWatchlistSiteVue}
 *
 * @param {string} pageTitle Title of the page that was unwatched/rewatched.
 * @param {boolean} unwatched Whether the page was unwatched
 */
GlobalWatchlistSiteBase.prototype.processUpdateWatched = function ( pageTitle, unwatched ) {
	// STUB
};

/**
 * Used by {@link GlobalWatchlistSiteDisplay} to still include an output for api failures
 */
GlobalWatchlistSiteBase.prototype.renderApiFailure = function () {
	// STUB
};

module.exports = GlobalWatchlistSiteBase;
