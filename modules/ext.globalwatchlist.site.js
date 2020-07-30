/**
 * Represents a specific site
 *
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug
 * @param {Object} config
 * @param {Object} api
 * @param {Object} watchlistUtils
 * @param {string} urlFragment
 */
function GlobalWatchlistSite( globalWatchlistDebug, config, api, watchlistUtils, urlFragment ) {
	// Logger to send debug info to
	this.debugLogger = globalWatchlistDebug;

	// User config and other settings, retrieved from getSettings
	this.config = config;

	// The api object to interact with
	this.apiObject = api;

	// Utility methods
	this.watchlistUtils = watchlistUtils;

	// Site identifier in url format
	this.site = urlFragment.replace( /_/g, '.' );

	// Linker utility (GlobalWatchlistLinker)
	var GlobalWatchlistLinker = require( './ext.globalwatchlist.linker.js' );
	this.linker = new GlobalWatchlistLinker( this.site );

	// Site identifier in format that can be used for elemnt attributes
	this.siteID = urlFragment.replace( /\./g, '_' );

	// Wrapper div for all of the output of this site
	this.divID = 'globalwatchlist-feed-site-' + this.siteID;

	// Actual output for this site
	this.$feedDiv = '';

	// Whether this site had any changes to show
	this.isEmpty = false;

	// Cached information about the tags of a site
	this.tags = {};

	// Instance of GlobalWatchlistWikibaseHandler, only used for wikibase
	// Don't create it if it will never be needed
	if ( this.site === config.wikibaseSite ) {
		var GlobalWatchlistWikibaseHandler = require( './ext.globalwatchlist.wikibase.js' );
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
 * @param {string} key
 * @param {string} msg
 * @param {number} level
 */
GlobalWatchlistSite.prototype.debug = function ( key, msg, level ) {
	this.debugLogger.info( this.site + ':' + key, msg, level );
};

/**
 * Shortcut for sending errors to the debug logger
 *
 * @param {string} key
 * @param {string} msg
 */
GlobalWatchlistSite.prototype.error = function ( key, msg ) {
	this.debugLogger.error( this.site + ':' + key, msg );
};

/**
 * API handler for debugging and avoiding actual important actions when testing client-side
 *
 * @param {string} func Function name
 * @param {Object} content for api
 * @param {string} name for logging
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.api = function ( func, content, name ) {
	var skippedWhenTesting = [ 'updateWatched', 'actuallyMarkSiteAsSeen' ],
		shouldSkipInTests = skippedWhenTesting.indexOf( name ) > -1,
		that = this;

	return new Promise( function ( resolve, reject ) {
		that.debug( 'API.' + name + ' (called), with func & content:', [ func, content ], 1 );
		if ( shouldSkipInTests && that.config.testNoActions ) {
			that.debug( 'API.' + name + 'skipping; func & content:', [ func, content ], 3 );
			resolve();
		} else {
			that.apiObject[ func ]( content ).then( function ( response ) {
				that.debug(
					'API.' + name + ' (result); func, content, & response',
					[ func, content, response ],
					2
				);
				resolve( response );
			} ).catch( function ( error ) {
				that.error( 'API.' + name, error );
				reject();
			} );
		}
	} );
};

/**
 * Get the changes on a user's watchlist
 *
 * @param {number} iteration iteration count
 * @param {string} continueFrom
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.actuallyGetWatchlist = function ( iteration, continueFrom ) {
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
			var wlraw = response.query.watchlist;
			if ( response.continue && response.continue.wlcontinue ) {
				that.actuallyGetWatchlist(
					iteration + 1,
					response.continue.wlcontinue
				).then( function ( innerResponse ) {
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
 * @param {string} pageTitle
 * @param {string} func Either 'watch' or 'unwatch'
 */
GlobalWatchlistSite.prototype.changeWatched = function ( pageTitle, func ) {
	this.debug( 'changeWatched', 'Going to ' + func + ': ' + pageTitle, 1 );
	var that = this,
		titleReal = pageTitle.replace( /DOUBLEQUOTE/g, '"' );
	this.api( func, titleReal, 'updateWatched' );
	this.processUpdateWatched( pageTitle, func === 'unwatch' );
	if ( !this.config.fastMode ) {
		this.getAssociatedPageTitle( titleReal ).then( function ( associatedTitle ) {
			that.processUpdateWatched( associatedTitle, func === 'unwatch' );
			// TODO re-add functionality for old checkChangesShown
		} );
	}
};

/**
 * Note: this should be a part of the core info api, see T257014
 * Returns the talk/subject page associated with a given page, since entries for the associated page
 *    also need to have their text and strikethrough updated on unwatching/rewatching
 *
 * @param {string} pageTitle
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.getAssociatedPageTitle = function ( pageTitle ) {
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
GlobalWatchlistSite.prototype.getTagList = function () {
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
				that.debug( 'getTagList', asObject, 3 );
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
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.getWatchlist = function ( latestConfig ) {
	this.config = latestConfig;
	var that = this;
	return new Promise( function ( resolve ) {
		that.actuallyGetWatchlist( 1, 0 ).then( function ( wlraw ) {
			if ( !( wlraw && wlraw[ 0 ] ) ) {
				that.debug( 'getWatchlist', 'empty', 1 );
				that.isEmpty = true;
				resolve();
			}
			that.debug( 'getWatchlist wlraw', wlraw, 1 );

			var prelimSummary = that.watchlistUtils.rawToSummary(
				wlraw,
				that.site,
				that.config.groupPage,
				that.linker
			);
			that.debug( 'getWatchlist prelimSummary', prelimSummary, 1 );

			that.makeWikidataList( prelimSummary ).then( function ( summary ) {
				that.debug( 'getWatchlist summary', summary, 1 );
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
 * @param {Object} summary
 */
GlobalWatchlistSite.prototype.renderWatchlist = function ( summary ) {
	var $ul = $( '<ul>' ),
		that = this;
	summary.forEach( function ( element ) {
		$ul.append( that.makePageLink( element ) );
	} );

	var markSeenButton = new OO.ui.ButtonInputWidget( {
		classes: [ 'globalWatchlist-feed-markSeen' ],
		flags: [ 'destructive' ],
		icon: 'check',
		id: this.divID + '-seen',
		label: mw.msg( 'globalwatchlist-markseen' )
	} ).on( 'click', function () {
		that.markAsSeen();
	} );

	var headerTemplate = mw.template.get(
		'ext.globalwatchlist.specialglobalwatchlist',
		'templates/siteRowHeader.mustache'
	);
	var headerParams = {
		'special-watchlist-url': this.linker.linkPage( 'Special:Watchlist' ),
		'site-name': this.site,
		'special-edit-watchlist-url': this.linker.linkPage( 'Special:EditWatchlist' ),
		'edit-watchlist-msg': mw.msg( 'globalwatchlist-editwatchlist' )
	};

	this.$feedDiv = $( '<div>' )
		.attr( 'id', this.divID )
		.addClass( 'globalWatchlist-feed-site' )
		.append(
			headerTemplate.render( headerParams ),
			$( '<div>' )
				.addClass( 'globalWatchlist-site' )
				.append(
					markSeenButton.$element,
					$ul
				)
				.makeCollapsible()
		);
};

/**
 * Make the links for a row in the watchlist
 *
 * @param {Object} entry
 * @return {Object}
 */
GlobalWatchlistSite.prototype.makePageLink = function ( entry ) {
	var $before = false,
		$comment = '',
		$extraLink = false,
		$tags = false,
		$user = '';
	var pageTitle = encodeURIComponent( entry.title ).replace( /'/g, '%27' );
	var $pageLink = $( '<a>' )
		.attr( 'href', this.linker.linkQuery( 'title=' + pageTitle + '&redirect=no' ) )
		.attr( 'target', '_blank' )
		.text( entry.titleMsg || entry.title );
	var $historyLink = $( '<a>' )
		.attr( 'href', this.linker.linkQuery( 'title=' + pageTitle + '&action=history' ) )
		.attr( 'target', '_blank' )
		.text( mw.msg( 'history_small' ) );
	var that = this;
	var $unwatchLink = $( '<a>' )
		.addClass( 'globalWatchlist-watchunwatch' )
		.text( mw.msg( 'globalwatchlist-unwatch' ) )
		.on( 'click', function () {
			that.changeWatched( entry.title, 'unwatch' );
		} );

	if ( !this.config.fastMode ) {
		$user = entry.userDisplay;
	}

	if ( entry.comment && entry.comment !== '' ) {
		// Need to process links in the parsed comments as raw HTML
		$comment = $( '<span>' ).html(
			': ' +
			this.linker.fixLocalLinks( entry.comment )
		);
	}

	if ( entry.entryType === 'edit' && entry.newPage === false ) {
		$extraLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'diff=' + entry.toRev + '&oldid=' + entry.fromRev ) )
			.attr( 'target', '_blank' )
			.addClass( 'globalWatchlist-diff' )
			.text(
				entry.editCount === 1 ? mw.msg( 'diff' ) : mw.msg( 'nchanges', entry.editCount )
			);
	} else if ( entry.entryType === 'log' ) {
		$extraLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'title=Special:Log&page=' + pageTitle ) )
			.attr( 'target', '_blank' )
			.text( mw.msg( 'sp-contributions-logs' ) );
	}

	if ( entry.entryType === 'log' ) {
		$before = $( '<i>' )
			.text( 'Log: ' + entry.logtype + '/' + entry.logaction + ': ' );
	} else if ( entry.minor || entry.bot || entry.newPage === true ) {
		var letters = '';
		if ( entry.newPage === true ) {
			letters += mw.msg( 'newpageletter' );
		}
		if ( entry.minor ) {
			letters += mw.msg( 'minoreditletter' );
		}
		if ( entry.bot ) {
			letters += mw.msg( 'boteditletter' );
		}
		$before = $( '<b>' ).text( letters );
	}

	if ( entry.tags.length > 0 ) {
		// Need to process links in the parsed description as raw HTML
		var tagsDisplay = entry.tags.map(
			function ( tag ) {
				return that.tags[ tag ];
			}
		).join( ', ' );
		$tags = $( '<i>' ).html( '(Tags: ' + tagsDisplay + ')' );
	}

	// Actually set up the $row to be returned
	var $row = $( '<li>' );

	$row.attr( 'siteAndPage', this.siteID + '_' + pageTitle );
	if ( $before !== false ) {
		$row.append( $before )
			.append( ' ' );
	}
	$row.append( $pageLink )
		.append( ' (' )
		.append( $historyLink )
		.append( ', ' );
	if ( $extraLink !== false ) {
		$row.append( $extraLink )
			.append( ', ' );
	}
	$row.append( $unwatchLink )
		.append( ') (' )
		.append( $user )
		.append( $comment )
		.append( ')' );

	if ( $tags !== false ) {
		$row.append( ' ' )
			.append( $tags );
	}

	this.debug( 'makePageLink for entry', [ entry, $row ], 3 );
	return $row;
};

/**
 * Fetch and process wikibase labels when the watchlist is for wikidata
 *
 * @param {Array} summary
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.makeWikidataList = function ( summary ) {
	var that = this;
	return new Promise( function ( resolve ) {
		if ( that.config.fastMode ) {
			that.debug( 'makeWikidataList', 'Skipping, fast mode is enabled', 1 );
			resolve( summary );
		} else if ( that.site !== that.config.wikibaseSite ) {
			that.debug(
				'makeWikidataList',
				'Skipping, wrong site (' + that.site + ')',
				1
			);
			resolve( summary );
		} else {
			that.wikibaseHandler.addWikibaseLabels( summary ).then( function ( updatedSummary ) {
				that.debug(
					'makeWikidataList - updated summary',
					updatedSummary,
					1
				);
				resolve( updatedSummary );
			} );
		}
	} );
};

/**
 * Mark a site as seen
 */
GlobalWatchlistSite.prototype.markAsSeen = function () {
	this.debug( 'markSiteAsSeen', 'marking', 1 );
	var setter = {
		action: 'setnotificationtimestamp',
		entirewatchlist: true,
		timestamp: this.config.time.toISOString()
	};
	this.api( 'postWithEditToken', setter, 'actuallyMarkSiteAsSeen' );

	this.debug( 'markSiteAsSeen', 'hiding', 1 );
	$( this.$feedDiv.children()[ 1 ] ).hide();

	// FIXME
	// GlobalWatchlist.watchlists.checkChangesShown( true );
};

/**
 * Update entry click handlers, text, and strikethrough for a specific title
 *
 * @param {string} pageTitle
 * @param {boolean} unwatched
 */
GlobalWatchlistSite.prototype.processUpdateWatched = function ( pageTitle, unwatched ) {
	this.debug(
		'processUpdateWatched',
		'Proccessing after ' + ( unwatched ? 'unwatching' : 'rewatching' ) + ': ' + pageTitle,
		1
	);
	var encodedTitle = encodeURIComponent( pageTitle )
			.replace( /'/g, '%27' )
			.replace( /DOUBLEQUOTE/g, '%22' ),
		msg = mw.msg( unwatched ? 'globalwatchlist-rewatch' : 'globalwatchlist-unwatch' ),
		that = this,
		$links = $( 'li[siteAndPage="' + this.siteID + '_' + encodedTitle + '"] > a.globalWatchlist-watchunwatch' );

	var $entries = $( 'li[siteAndPage="' + this.siteID + '_' + encodedTitle + '"]' );
	$entries[ unwatched ? 'addClass' : 'removeClass' ]( 'globalWatchlist-strike' );

	$links.each( function () {
		$( this ).off( 'click' );
		$( this ).on( 'click', function () {
			that.changeWatched( pageTitle, unwatched ? 'watch' : 'unwatch' );
		} );
		$( this ).text( msg );
	} );
};

module.exports = GlobalWatchlistSite;
