/*
 * Extended version of SiteBase.js for use in jQuery version of Special:GlobalWatchlist
 */

var GlobalWatchlistSiteBase = require( './SiteBase.js' );

/**
 * Represents a specific site, including the display (used in jQuery / non-Vue display)
 *
 * @class GlobalWatchlistSiteDisplay
 * @extends GlobalWatchlistSiteBase
 *
 * @constructor
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug Debugger instance to log to
 * @param {GlobalWatchlistLinker} linker Linker instance to use
 * @param {Object} config User configuration
 * @param {Object} api Instance of mw.ForeignApi to use
 * @param {Object} watchlistUtils Reference to {@link watchlistUtils}
 * @param {string} urlFragment string for which site this represents
 */
function GlobalWatchlistSiteDisplay( globalWatchlistDebug, linker, config, api, watchlistUtils, urlFragment ) {
	GlobalWatchlistSiteDisplay.super.call(
		this,
		globalWatchlistDebug,
		linker,
		config,
		api,
		watchlistUtils,
		urlFragment
	);

	// Actual output for this site
	this.$feedDiv = '';
}

OO.inheritClass( GlobalWatchlistSiteDisplay, GlobalWatchlistSiteBase );

/**
 * Make the links for a row in the watchlist
 *
 * @param {Object} entry Details of the list entry to create
 * @return {Object} jQuery list item
 */
GlobalWatchlistSiteDisplay.prototype.makePageLink = function ( entry ) {
	var $before = false,
		$comment = '',
		$extraLink = false,
		$tags = false,
		$timestamp = false,
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
		.addClass( 'ext-globalwatchlist-watchunwatch' )
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
			.addClass( 'ext-globalwatchlist-diff' )
			.text(
				entry.editCount === 1 ? mw.msg( 'diff' ) : mw.msg( 'nchanges', entry.editCount )
			);
	} else if ( entry.entryType === 'log' ) {
		$extraLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'title=Special:Log&page=' + pageTitle ) )
			.attr( 'target', '_blank' )
			.text( mw.msg( 'sp-contributions-logs' ) );
	}

	if ( entry.timestamp ) {
		$timestamp = $( '<span>' )
			.text( entry.timestamp );
		if ( entry.editCount && entry.editCount !== 1 ) {
			$timestamp.attr( 'title', mw.msg( 'globalwatchlist-grouped-timestamp' ) );
		}
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

	$row.attr( 'data-site', encodeURIComponent( this.siteID ) );
	$row.attr( 'data-title', encodeURIComponent( entry.title ) );

	if ( $timestamp !== false ) {
		$row.append( $timestamp )
			.append( ' ' );
	}
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
		.append( ')' );

	if ( $user !== '' || $comment !== '' ) {
		$row.append( ' (' )
			.append( $user )
			.append( $comment )
			.append( ')' );
	}

	if ( $tags !== false ) {
		$row.append( ' ' )
			.append( $tags );
	}

	this.debug( 'makePageLink for entry', [ entry, $row ] );
	return $row;
};
/* end GlobalWatchlistSiteDisplay.prototype.makePageLink */

/**
 * Create the output for this.$feedDiv, either for success (via renderWatchlist) or
 * failure (via renderApiFailure)
 *
 * @param {Object} $content Content to show
 */
GlobalWatchlistSiteDisplay.prototype.actuallyRenderWatchlist = function ( $content ) {
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
		.attr( 'id', 'globalwatchlist-feed-site-' + this.siteID )
		.addClass( 'ext-globalwatchlist-feed-site' )
		.append(
			headerTemplate.render( headerParams ),
			$content
		);
};

/**
 * Alert on API failures
 */
GlobalWatchlistSiteDisplay.prototype.renderApiFailure = function () {
	var $siteContent = $( '<p>' ).text(
		mw.msg( 'globalwatchlist-fetch-site-failure' )
	);

	this.actuallyRenderWatchlist( $siteContent );
};

/**
 * Display the watchlist
 *
 * @param {Array} summary What should be rendered
 */
GlobalWatchlistSiteDisplay.prototype.renderWatchlist = function ( summary ) {
	var $ul = $( '<ul>' ),
		that = this;
	summary.forEach( function ( element ) {
		$ul.append( that.makePageLink( element ) );
	} );

	var markSeenButton = new OO.ui.ButtonInputWidget( {
		classes: [ 'ext-globalwatchlist-feed-markseen' ],
		flags: [ 'destructive' ],
		icon: 'check',
		label: mw.msg( 'globalwatchlist-markseen' )
	} ).on( 'click', function () {
		that.markAsSeen();
	} );

	var $outputContent = $( '<div>' )
		.addClass( 'ext-globalwatchlist-site' )
		.append(
			markSeenButton.$element,
			$ul
		)
		.makeCollapsible();
	this.actuallyRenderWatchlist( $outputContent );
};
/* end GlobalWatchlistSiteDisplay.prototype.renderWatchlist */

/**
 * Update display after marking a site as seen
 */
GlobalWatchlistSiteDisplay.prototype.afterMarkAsSeen = function () {
	this.debug( 'markSiteAsSeen - hiding site' );
	$( this.$feedDiv.children()[ 1 ] ).hide();

	// FIXME
	// GlobalWatchlist.watchlists.checkChangesShown( true );
};
/* end GlobalWatchlistSiteDisplay.prototype.afterMarkAsSeen */

/**
 * Update entry click handlers, text, and strikethrough for a specific title
 *
 * @param {string} pageTitle Title of the page that was unwatched/rewatched.
 * @param {boolean} unwatched Whether the page was unwatched
 */
GlobalWatchlistSiteDisplay.prototype.processUpdateWatched = function ( pageTitle, unwatched ) {
	this.debug(
		'Processing after ' + ( unwatched ? 'unwatching' : 'rewatching' ) + ': ' + pageTitle
	);

	var encodedSite = encodeURIComponent( this.siteID );
	var encodedTitle = encodeURIComponent( pageTitle );
	var $entries = $( 'li[data-site="' + encodedSite + '"][data-title="' + encodedTitle + '"]' );
	$entries[ unwatched ? 'addClass' : 'removeClass' ]( 'ext-globalwatchlist-strike' );

	var $links = $entries.children( 'a.ext-globalwatchlist-watchunwatch' );
	var newText = mw.msg( unwatched ? 'globalwatchlist-rewatch' : 'globalwatchlist-unwatch' );
	var that = this;

	$links.each( function () {
		$( this ).off( 'click' );
		$( this ).on( 'click', function () {
			that.changeWatched( pageTitle, unwatched ? 'watch' : 'unwatch' );
		} );
		$( this ).text( newText );
	} );
};
/* end GlobalWatchlistSiteDisplay.prototype.processUpdateWatched */

module.exports = GlobalWatchlistSiteDisplay;
