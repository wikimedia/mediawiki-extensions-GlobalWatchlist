/**
 * Represents a specific site
 *
 * @param {object} GlobalWatchlistDebug debugger
 * @param {object} config
 * @param {object} api
 * @param {object} WatchlistUtils
 * @param {string} urlFragment
 */
function GlobalWatchlistSite( GlobalWatchlistDebug, config, api, WatchlistUtils, urlFragment ) {
	// Logger to send debug info to
	this.debugLogger = GlobalWatchlistDebug;

	// User config, retrieved from getSettings
	this.config = config;

	// The api object to interact with
	this.apiObject = api;

	// Utility methods
	this.watchlistUtils = WatchlistUtils;

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
}

/**
 * @param {string} key
 * @param {string} msg
 * @param {int} level
 */
GlobalWatchlistSite.prototype.debug = function ( key, msg, level ) {
	this.debugLogger.info( this.site + ':' + key, msg, level );
};

/**
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
 * @param {object} content for api
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
 * @param {int} interation iteration count
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
			wltype: that.config.watchlistQueryTypes,
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
		});
	});
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
			text: '{{subst:TALKPAGENAME:' + pageTitle + '}}\n{{subst:SUBJECTPAGENAME:' + pageTitle + '}}',
		};
		that.api( 'get', getter, 'parseOnlyPST' ).then( function ( response ) {
			var titles = response.parse.text.split( '\n' );
			resolve( titles[1] === pageTitle ? titles[0] : titles[1] );
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
				tgprop: 'displayname',
			};
			that.api( 'get', getter, 'getTags' ).then( function ( response ) {
				var asObject = {};
				response.query.tags.forEach( function ( tag ) {
					asObject[tag.name] = ( tag.displayname || false )
						? that.linker.fixLocalLinks( tag.displayname )
						: tag.name;
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
 * @param {object} latestConfig config, can change
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.getWatchlist = function ( latestConfig ) {
	this.config = latestConfig;
	var that = this;
	return new Promise( function ( resolve ) {
		that.actuallyGetWatchlist( 1, 0 ).then( function ( wlraw ) {
			if ( !( wlraw && wlraw[0] ) ) {
				that.debug( 'getWatchlist', 'empty', 1 );
				that.isEmpty = true;
				resolve();
			}
			that.debug( 'getWatchlist wlraw', wlraw, 1 );

			var prelimSummary = that.watchlistUtils.rawToSummary(
				wlraw,
				that.site,
				that.config.groupPage
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
 * @param {object} summary
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

	this.$feedDiv = $( '<div>' )
		.attr( 'id', this.divID )
		.addClass( 'globalWatchlist-feed-site' )
		.append(
			$( '<h3>' )
				.append(
					$( '<a>' )
						.attr( 'href', this.linker.linkPage( 'Special:Watchlist' ) )
						.attr( 'target', '_blank' )
						.text( this.site ),
					' (',
					$( '<a>' )
						.attr( 'href', this.linker.linkPage( 'Special:EditWatchlist' ) )
						.attr( 'target', '_blank' )
						.text( mw.msg( 'globalwatchlist-editwatchlist' ) ),
					')'
				),
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
 * @param {object} entry
 * @return {object}
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

	if ( entry.editsbyuser || false ) {
		$user = entry.editsbyuser.replace( '%SITE%', this.site );
	} else if ( !this.config.fastMode ) {
		if ( entry.user === false ) {
			$user = $( '<span>' )
				.addClass( 'history-deleted' )
				.text( mw.msg( 'rev-deleted-user' ) );
		} else if ( entry.anon ) {
			$user = $( '<a>' )
				.attr( 'href', this.linker.linkPage( 'Special:Contributions/' + entry.user ) )
				.attr( 'target', '_blank' )
				.text( entry.user );
		} else {
			$user = $( '<a>' )
				.attr( 'href', this.linker.linkPage( 'User:' + entry.user ) )
				.attr( 'target', '_blank' )
				.text( entry.user );
		}
	}
	if ( entry.comment && entry.comment !== '' ) {
		// Need to process links in the parsed comments as raw HTML
		$comment = $( '<span>' ).html(
			': ' +
			this.linker.fixLocalLinks( entry.comment )
		);
	}

	if ( entry.entryType === 'edit' ) {
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
	} else if ( entry.minor || entry.bot || entry.entryType === 'new' ) {
		var letters = '';
		if ( entry.entryType === 'new' ) {
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

	if ( entry.tags && entry.tags.length > 0 ) {
		// Need to process links in the parsed description as raw HTML
		var tagsDisplay = entry.tags.map(
			function ( tag ) {
				return that.tags[ tag ]
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
 * Fetch and process wikidata labels when the watchlist is for wikidata
 *
 * @param {object} summary
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.makeWikidataList = function (summary) {
	var that = this;
	return new Promise( function ( resolve ) {
		if ( that.config.fastMode ) {
			that.debug( 'makeWikidataList', 'Skipping, fast mode is enabled', 1 );
			resolve( summary );
		} else if ( that.site !== mw.config.get( 'wgGlobalWatchlistWikibaseSite' ) ) {
			that.debug(
				'makeWikidataList',
				'Skipping, current site (' + that.site + ') is not the correct site (' + mw.config.get( 'wgGlobalWatchlistWikibaseSite' ) + ')',
				1
			);
			resolve( summary );
		} else {
			var ids = [],
				wdns = that.config.wikibaseLabelNamespaces;
			summary.forEach( function ( entry ) {
				if ( wdns.indexOf( entry.ns ) > -1 ) {
					entry.titleMsg = entry.title.replace(
						/^(?:Property|Lexeme):/,
						''
					);
					if ( ids.indexOf( entry.titleMsg ) === -1 ) {
						ids.push( entry.titleMsg );
					}
				}
			} );
			that.debug( 'makeWikidataList - summary, ids', [ summary, ids ], 1 );
			if ( ids.length === 0 ) {
				resolve( summary );
			}
			that.getWikidataLabels( ids ).then( function ( wdlabels ) {
				var lang = that.config.lang,
					entryWithLabel;
				summary.forEach( function ( entry ) {
					if ( wdns.indexOf( entry.ns ) > -1 && wdlabels[ entry.titleMsg ] ) {
						that.debug( 'makeWikidataList - have entry', [ entry, wdlabels[entry.titleMsg] ], 3 );
						entryWithLabel = wdlabels[entry.titleMsg][entry.ns === 146 ? 'lemmas' : 'labels'];
						if ( entryWithLabel && entryWithLabel[lang] && entryWithLabel[lang].value ) {
							entry.titleMsg += ' (' + entryWithLabel[lang].value + ')';
						}
					}
				} );
				resolve( summary );
			} );
		}
	} );
};

/**
 * Internal helper for makeWikidataList to get the labels for entries
 *
 * @param {array} ids
 * @return {jQuery.Promise}
 */
GlobalWatchlistSite.prototype.getWikidataLabels = function ( ids ) {
	var that = this;
	return new Promise( function ( resolve ) {
		that.debug( 'getWikidataLabels ids', ids, 1 );
		var lang = that.config.lang,
			wdgetter = {
				action: 'wbgetentities',
				formatversion: 2,
				ids: ids.slice( 0, 50 ),
				languages: lang,
				props: 'labels',
			};
		that.api( 'get', wdgetter, 'getWikidataLabels' ).then( function ( response ) {
			var wdlabels = response.entities;
			that.debug( 'getWikidataLabels wdlabels', wdlabels, 1 );
			if ( ids.length > 50 ) {
				that.getWikidataLabels( ids.slice( 50 ) ).then( function ( extraLabels ) {
					var bothLabels = $.extend( {}, wdlabels, extraLabels );
					that.debug( 'getWikidataLabels bothLabels', bothLabels, 3 );
					resolve( bothLabels );
				} );
			} else {
				resolve( wdlabels );
			}
		} );
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
		timestamp: this.config.time.toISOString(),
	};
	this.api( 'postWithEditToken', setter, 'actuallyMarkSiteAsSeen' );

	this.debug( 'markSiteAsSeen', 'hiding', 1 );
	$( this.$feedDiv.children()[1] ).hide();

	// FIXME
	// GlobalWatchlist.watchlists.checkChangesShown( true );
};

/**
 * Update entry click handlers, text, and strikethrough for a specific title
 *
 * @param {string} pageTitle
 * @param {bool} unwatched
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
	$entries[unwatched ? 'addClass' : 'removeClass']( 'globalWatchlist-strike' );

	$links.each( function () {
		$( this ).off( 'click' );
		$( this ).on( 'click', function () {
			that.changeWatched( pageTitle, unwatched ? 'watch' : 'unwatch' );
		} );
		$( this ).text( msg );
	} );
};

module.exports = GlobalWatchlistSite;