/* eslint-disable no-unused-vars */
/**
 * Represents a specific site
 *
 * @class GlobalWatchlistSiteBase
 * @abstract
 *
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug Debugger instance to log to
 * @param {GlobalWatchlistLinker} linker Linker instance to use
 * @param {Object} config User configuration
 * @param {mw.ForeignApi} api Instance of mw.ForeignApi for this site
 * @param {GlobalWatchlistWatchlistUtils} watchlistUtils WatchlistUtils instance for this site
 * @param {string} urlFragment string for which site this represents
 */
function GlobalWatchlistSiteBase(
	globalWatchlistDebug,
	linker,
	config,
	api,
	watchlistUtils,
	urlFragment
) {
	// Logger to send debug info to
	this.debugLogger = globalWatchlistDebug;

	// User config and other settings, retrieved from getSettings
	this.config = config;

	// The api object to interact with
	this.apiObject = api;

	// Utility methods (GlobalWatchlistWatchlistUtils)
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
 * @return {Promise} Result of the api call
 */
GlobalWatchlistSiteBase.prototype.api = function ( func, content, name ) {
	const that = this;

	return new Promise( ( resolve, reject ) => {
		that.debug( 'API.' + name + ' (called), with func & content:', [ func, content ] );
		that.apiObject[ func ]( content ).then( ( response ) => {
			that.debug(
				'API.' + name + ' (result); func, content, & response',
				[ func, content, response ]
			);
			resolve( response );
		} ).catch( ( code, data ) => {
			that.error( 'API.' + name + ' ' + code, data );
			that.apiError = true;

			const $userNotification = $( '<div>' )
				.append(
					mw.message( 'globalwatchlist-api-error', that.site ).escaped(),
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
 * @return {Promise} Promise of api result
 */
GlobalWatchlistSiteBase.prototype.actuallyGetWatchlist = function ( iteration, continueFrom ) {
	const that = this;

	return new Promise( ( resolve ) => {
		const query = {
			action: 'query',
			formatversion: 2,
			list: 'watchlist',
			wllimit: 'max',
			wlprop: that.config.watchlistQueryProps,
			wlshow: that.config.watchlistQueryShow,
			wltype: that.config.watchlistQueryTypes,
			responselanginfo: 1
		};
		if ( iteration > 1 ) {
			query.wlcontinue = continueFrom;
		} else {
			query.meta = 'siteinfo';
			query.siprop = that.isWikibase === undefined ?
				// the check for Wikibase Handler is needed only once for the site
				'general|namespaces' :
				'general';
			if ( !that.config.languageData ) {
				query.meta += '|languageinfo';
				query.liprop = 'dir';
			}
			if ( !that.labelsData ) {
				query.meta += '|userinfo';
				query.uiprop = 'watchlistlabels';
			}
		}
		if ( !that.config.fastMode ) {
			query.wlallrev = true;
		}

		that.api( 'get', query, 'actuallyGetWatchlist #' + iteration ).then( ( response ) => {
			if ( response === 'ERROR' ) {
				resolve( {
					wlraw: [],
					rtl: undefined
				} );
				return;
			}
			const wlraw = response.query.watchlist;
			const langinfo = response.query.languageinfo;
			if ( langinfo ) {
				that.config.languageData = langinfo;
				that.debug( 'language data', langinfo );
				if ( that.config.lang && !langinfo[ that.config.lang ] ) {
					that.config.lang = null;
				}
			}
			if ( response.query.userinfo ) {
				const labelinfo = response.query.userinfo.watchlistlabels;
				if ( labelinfo ) {
					that.labelsData = [];
					labelinfo.forEach( ( item ) => {
						this.labelsData[ item.id ] = item.name;
					} );
					that.debug( 'user labels', labelinfo );
				}
			}
			if ( response.query.namespaces ) {
				const wbdefaultmodels = [ 'wikibase-item', 'wikibase-property', 'wikibase-lexeme', 'EntitySchema' ];
				const wbns = { wikibase: [], entity: [] };
				const wbnsNames = { wikibase: [], entity: [] };
				Object.values( response.query.namespaces ).forEach( ( ns ) => {
					const index = ns.defaultcontentmodel === 'EntitySchema' ? 'entity' : 'wikibase';
					if ( wbdefaultmodels.includes( ns.defaultcontentmodel ) ) {
						wbns[ index ].push( ns.id );
						if ( ns.name ) {
							wbnsNames[ index ].push( ns.name );
						}
						if ( ns.canonical && ns.canonical !== ns.name ) {
							wbnsNames[ index ].push( ns.canonical );
						}
					}
				} );
				that.isWikibase = wbns.wikibase.length + wbns.entity.length > 0;
				if ( that.isWikibase && response.uselang ) {
					that.direction = that.config.languageData[ response.uselang ].dir;
					that.debug( 'changing direction', that.direction );
				}

				if ( that.isWikibase && !that.wikibaseHandler ) {
					// Instance of GlobalWatchlistWikibaseHandler, only used for wikibase
					// Don't create it if it will never be needed
					const GlobalWatchlistWikibaseHandler = require( './WikibaseHandler.js' );
					const wikibaseLang = that.config.lang || response.uselang || mw.config.get( 'wgUserLanguage' );
					that.debug( 'config lang', that.config.lang );
					that.debug( 'response uselang', response.uselang );
					that.debug( 'wgUserLanguage', mw.config.get( 'wgUserLanguage' ) );
					that.debug( 'wikibaseLang', wikibaseLang );
					that.wikibaseHandler = new GlobalWatchlistWikibaseHandler(
						that.debugLogger,
						that.apiObject,
						wikibaseLang,
						wbns,
						wbnsNames
					);
					that.debug( 'Wikibase handler created', that.site );
				}
			}

			const rtl = that.direction === 'rtl' || response.query.general && response.query.general.rtl;

			if ( response.continue && response.continue.wlcontinue ) {
				that.actuallyGetWatchlist(
					iteration + 1,
					response.continue.wlcontinue
				).then( ( innerResponse ) => {
					resolve( {
						// If there was an error in the recursive call, this just
						// adds an empty array. getWatchlist checks this.apiError
						// before assuming that an empty response means nothing to show
						wlraw: wlraw.concat( innerResponse.wlraw ),
						// `rtl` is present only in the outermost call, `innerResponse.rtl`
						// will always be `undefined`
						rtl: rtl
					} );
				} );
			} else {
				resolve( { wlraw, rtl } );
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
	const that = this;
	this.api( func, pageTitle, 'updateWatched' );
	this.processUpdateWatched( pageTitle, func === 'unwatch' );
	if ( !this.config.fastMode ) {
		this.getAssociatedPageTitle( pageTitle ).then( ( associatedTitle ) => {
			that.processUpdateWatched( associatedTitle, func === 'unwatch' );
			// TODO re-add functionality for old checkChangesShown
		} );
	}
};

/**
 * Mark page as read
 *
 * Calls the API to reset notification timestamp for a page
 *
 * @param {string} pageTitle Title of the page to mark as read
 * @return {Promise} that resolves after the api call is made and after `afterMarkPageAsSeen`
 * is called, not necessarily after the api call is finished.
 */
GlobalWatchlistSiteBase.prototype.markPageAsSeen = function ( pageTitle ) {
	const that = this;

	return new Promise( ( resolve ) => {
		const setter = {
			action: 'setnotificationtimestamp',
			titles: pageTitle,
			timestamp: that.config.time.toISOString()
		};
		that.api( 'postWithEditToken', setter );

		that.afterMarkPageAsSeen( pageTitle );

		// Done within a promise so that display can ensure re-rendering occurs after
		// entries are updated
		resolve();
	} );
};

/**
 * Update display after marking a page as read
 *
 * Overriden in {@link GlobalWatchlistSiteDisplay}
 *
 * @param {string} pageTitle Page that was marked as read
 */
GlobalWatchlistSiteBase.prototype.afterMarkPageAsSeen = function ( pageTitle ) {
	// STUB
};

/**
 * Returns the talk/subject page associated with a given page, since entries for the associated page
 *   also need to have their text and strikethrough updated on unwatching/rewatching
 *
 * @param {string} pageTitle Title of the page for which to retrieve the associated page
 * @return {Promise} Promise of api result
 */
GlobalWatchlistSiteBase.prototype.getAssociatedPageTitle = function ( pageTitle ) {
	const that = this;
	return new Promise( ( resolve ) => {
		const query = {
			action: 'query',
			prop: 'info',
			titles: pageTitle,
			inprop: 'associatedpage',
			formatversion: 2
		};
		that.api( 'get', query, 'getAssociatedPageTitle' ).then( ( response ) => {
			resolve( response.query.pages[ 0 ].associatedpage );
		} );
	} );
};

/**
 * Get the tags for a wiki, loading them if not already available (in fast mode we don't retrieve
 * tags information for the watchlist, so this returns an empty object)
 *
 * Once this is called once, the tag info is stored in this.tags and future calls with return early
 *
 * @return {Promise} Resolves with the tags that where retrieved, or an empty object if we are
 *   in fast mode
 */
GlobalWatchlistSiteBase.prototype.getTagList = function () {
	const that = this;
	return new Promise( ( resolve ) => {
		if ( that.config.fastMode || Object.keys( that.tags ).length > 0 ) {
			// Either we are in fast mode, and we should return an empty object, which
			// is the default value of that.tags, or we already fetched the tags info
			// and its already available in that.tags
			resolve( that.tags );
		} else {
			const query = {
				action: 'query',
				list: 'tags',
				tglimit: 'max',
				tgprop: 'displayname'
			};
			that.api( 'get', query, 'getTags' ).then( ( response ) => {
				const asObject = {};
				response.query.tags.forEach( ( tag ) => {
					asObject[ tag.name ] = ( tag.displayname || false ) ?
						that.linker.fixLocalLinks( tag.displayname ) :
						tag.name;
				} );
				that.debug( 'getTagList', asObject );
				// Save for future calls (eg on refresh)
				that.tags = asObject;
				resolve( asObject );
			} );
		}
	} );
};

/**
 * Get the rendered changes for a user's watchlist
 *
 * @param {Object} latestConfig config, can change
 * @return {Promise} Promise that the watchlist was retrieved
 */
GlobalWatchlistSiteBase.prototype.getWatchlist = function ( latestConfig ) {
	this.config = latestConfig;
	const that = this;
	return new Promise( ( resolve ) => {
		that.actuallyGetWatchlist( 1, 0 ).then( ( { wlraw, rtl } ) => {
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

			that.getTagList().then( ( tagsInfo ) => {
				const prelimSummary = that.watchlistUtils.rawToSummary(
					wlraw,
					that.config.groupPage,
					tagsInfo,
					that.labelsData || []
				);
				that.debug( 'getWatchlist prelimSummary', prelimSummary );

				that.makeWikidataList( prelimSummary ).then( ( summary ) => {
					that.debug( 'getWatchlist summary', summary );
					that.renderWatchlist( summary, { rtl } );
					resolve();
				} );
			} );
		} );
	} );
};

/**
 * Display the watchlist
 *
 * Overriden in {@link GlobalWatchlistSiteDisplay}
 *
 * @param {GlobalWatchlistEntryBase[]} summary What should be rendered
 * @param {Object} siteinfo Extra site information read live from the wiki
 * @param {boolean|undefined} siteinfo.rtl Whether the site is right-to-left;
 *  `undefined` if unknown
 */
GlobalWatchlistSiteBase.prototype.renderWatchlist = function ( summary, siteinfo ) {
	// STUB
};

/**
 * Fetch and process wikibase labels when the watchlist is for wikidata
 *
 * @param {GlobalWatchlistEntryBase[]} summary Original summary, with page titles (Q1, P2, L3, etc.)
 * @return {Promise<Array>} Updated summary array, with labels
 */
GlobalWatchlistSiteBase.prototype.makeWikidataList = function ( summary ) {
	const that = this;

	if ( !summary || summary.length === 0 ) {
		return Promise.resolve( [] );
	}

	if ( !that.isWikibase || that.config.fastMode ) {
		return Promise.resolve( summary );
	}

	// Not efficient for now
	return Promise.all(
		summary.map( ( item ) => that.wikibaseHandler.addWikibaseLabels( item ) )
	);
};

/**
 * Mark a site as seen
 *
 * @return {Promise} that resolves after the api call is made and after `afterMarkAllAsSeen`
 *   is called, not necessarily after the api call is finished.
 */
GlobalWatchlistSiteBase.prototype.markAllAsSeen = function () {
	this.debug( 'markSiteAsSeen - marking' );
	const that = this;

	return new Promise( ( resolve ) => {
		const setter = {
			action: 'setnotificationtimestamp',
			entirewatchlist: true,
			timestamp: that.config.time.toISOString()
		};
		that.api( 'postWithEditToken', setter, 'actuallyMarkSiteAsSeen' );

		that.afterMarkAllAsSeen();

		// Done within a promise so that display can ensure re-rendering occurs after
		// entries are updated
		resolve();
	} );
};

/**
 * Update display after making a site as seen
 *
 * Overriden in {@link GlobalWatchlistSiteDisplay}
 */
GlobalWatchlistSiteBase.prototype.afterMarkAllAsSeen = function () {
	// STUB
};

/**
 * Mark a set of pages as seen.
 * This function is not efficient for now, and it will be very improved after T417357 will be resolved.
 *
 * @param {string[]} pageTitles - Array of page titles to mark as seen
 * @return {Promise} resolves when all pages are marked
 */
GlobalWatchlistSiteBase.prototype.markSectionAsSeen = function ( pageTitles ) {
	this.debug( 'markSectionAsSeen - marking', pageTitles );
	const that = this;

	if ( !pageTitles || pageTitles.length === 0 ) {
		return Promise.resolve();
	}

	// Take first 50 titles (or all if <=50)
	const batch = pageTitles.slice( 0, 50 );
	const remaining = pageTitles.slice( 50 );

	return new Promise( ( resolve, reject ) => {
		const setter = {
			action: 'setnotificationtimestamp',
			titles: batch,
			timestamp: that.config.time.toISOString()
		};

		that.api( 'postWithEditToken', setter, 'actuallyMarkSectionAsSeen' )
			.then( () => {
				// Update the display immediately for this batch
				batch.forEach( ( title ) => that.afterMarkPageAsSeen( title ) );

				if ( remaining.length > 0 ) {
					// Recursively process the next batch
					that.markSectionAsSeen( remaining ).then( resolve ).catch( reject );
				} else {
					resolve();
				}
			} )
			.catch( reject );
	} );
};

/**
 * Update entry click handlers, text, and strikethrough for a specific title
 *
 * Overriden in {@link GlobalWatchlistSiteDisplay}
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
