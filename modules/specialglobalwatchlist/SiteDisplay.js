/*
 * Extended version of SiteBase.js for use in jQuery version of Special:GlobalWatchlist
 */

const GlobalWatchlistSiteBase = require( './SiteBase.js' );

/**
 * Represents a specific site, including the display (used in jQuery display)
 *
 * @class GlobalWatchlistSiteDisplay
 * @extends GlobalWatchlistSiteBase
 *
 * @constructor
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug Debugger instance to log to
 * @param {GlobalWatchlistLinker} linker Linker instance to use
 * @param {Object} config User configuration
 * @param {mw.ForeignApi} api Instance of mw.ForeignApi for this site
 * @param {GlobalWatchlistWatchlistUtils} watchlistUtils WatchlistUtils instance for this site
 * @param {string} urlFragment string for which site this represents
 */
function GlobalWatchlistSiteDisplay(
	globalWatchlistDebug,
	linker,
	config,
	api,
	watchlistUtils,
	urlFragment
) {
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
 * @param {GlobalWatchlistEntryBase} entry Details of the list entry to create
 * @return {jQuery} list item
 */
GlobalWatchlistSiteDisplay.prototype.makePageLink = function ( entry ) {
	const pageTitle = encodeURIComponent( entry.title ).replace( /'/g, '%27' );
	const $pageLink = $( '<a>' )
		.attr( 'href', this.linker.linkQuery( 'title=' + pageTitle + '&redirect=no' ) )
		.attr( 'target', '_blank' )
		.addClass( 'mw-title' )
		.text( entry.titleMsg || entry.title );
	const that = this;

	// Actually set up the $row to be returned
	const $row = $( '<li>' );

	$row.attr( 'data-site', encodeURIComponent( this.siteID ) );
	$row.attr( 'data-title', encodeURIComponent( entry.title ) );

	if ( entry.timestamp ) {
		// entry.timestampTitle is either a string explaining grouped changes, or null to ignore
		const $timestamp = $( '<span>' )
			.text( entry.timestamp )
			.attr( 'title', entry.timestampTitle );
		$row.append( $timestamp )
			.append( ' ' );
	}
	if ( entry.expiry ) {
		const clockIcon = new OO.ui.IconWidget( {
			classes: [ 'ext-globalwatchlist-expiry-icon' ],
			icon: 'clock',
			title: entry.expiry
		} );
		$row.append( clockIcon.$element )
			.append( ' ' );
	}
	if ( entry.flags ) {
		// New page / minor edit / bot flag
		$row.append( $( '<b>' ).text( entry.flags ) )
			.append( ' ' );
	}
	if ( entry.entryType === 'log' ) {
		// log action description outside fast mode
		let logText = 'Log: ' + entry.logtype + '/' + entry.logaction;
		if ( entry.logdisplay && entry.logdisplay !== '' && this.config.fastMode === false ) {
			// remove HTML links, which can have wrong local URLs, preserving the plain text with bdi tags only
			const wrapper = document.createElement( 'div' );
			wrapper.innerHTML = entry.logdisplay;
			[ ...wrapper.querySelectorAll( '*' ) ].forEach( ( el ) => {
				if ( el.tagName.toLowerCase() !== 'bdi' ) {
					el.replaceWith( ...el.childNodes );
				}
			} );
			logText += ' (' + wrapper.innerHTML.trim() + ')';
		}
		logText += ': ';
		$row.append( $( '<em>' ).html( logText ) )
			.append( ' ' );
	}
	$row.append( $pageLink )
		.append( ' (' );

	if ( entry.entryType !== 'log' ) {
		// No history link for log entries, T273691
		const $historyLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'title=' + pageTitle + '&action=history' ) )
			.attr( 'target', '_blank' )
			.text( mw.msg( 'globalwatchlist-history' ) );
		$row.append( $historyLink )
			.append( ', ' );
	}

	// flag for the permalink creation
	let newEdit = false;
	if ( entry.entryType === 'edit' && entry.newPage === true && this.config.fastMode === false ) {
		const $diffLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'oldid=' + entry.toRev ) )
			.attr( 'target', '_blank' )
			.addClass( 'ext-globalwatchlist-permalink' )
			.text( mw.msg( 'globalwatchlist-permalink' ) );
		$row.append( $diffLink );
		newEdit = true;
	}
	// No diff links in fast mode, see T269728
	if ( entry.entryType === 'edit' && ( entry.newPage === false || entry.editCount > 1 ) && this.config.fastMode === false ) {
		const $diffLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'diff=' + entry.toRev + '&oldid=' + entry.fromRev ) )
			.attr( 'target', '_blank' )
			.addClass( 'ext-globalwatchlist-diff' );
		// case when there is more than just the creation
		if ( newEdit ) {
			$row.append( '+' );
			$diffLink.text(
				entry.editCount === 2 ? mw.msg( 'diff' ) : mw.msg( 'nchanges', entry.editCount - 1 )
			);
		// case when there is no creation
		} else {
			$diffLink.text(
				entry.editCount === 1 ? mw.msg( 'diff' ) : mw.msg( 'nchanges', entry.editCount )
			);
		}
		$row.append( $diffLink )
			.append( ', ' );
	// case when there is just the creation
	} else if ( newEdit ) {
		$row.append( ', ' );
	}
	if ( entry.entryType === 'log' ) {
		const $logPageLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'title=Special:Log&page=' + pageTitle ) )
			.attr( 'target', '_blank' )
			.text( mw.msg( 'globalwatchlist-log-page' ) );
		$row.append( $logPageLink )
			.append( ', ' );

		const $logEntryLink = $( '<a>' )
			.attr( 'href', this.linker.linkQuery( 'title=Special:Log&logid=' + entry.logid ) )
			.attr( 'target', '_blank' )
			.text( mw.msg( 'globalwatchlist-log-entry' ) );
		$row.append( $logEntryLink )
			.append( ', ' );
	}

	const $unwatchLink = $( '<a>' )
		.addClass( 'ext-globalwatchlist-watchunwatch' )
		.text( mw.msg( 'globalwatchlist-unwatch' ) )
		.on( 'click', () => {
			that.changeWatched( entry.title, 'unwatch' );
		} );
	$row.append( $unwatchLink )
		.append( ', ' );

	const $markAsReadLink = $( '<a>' )
		.addClass( 'ext-globalwatchlist-markpageseen' )
		.text( mw.msg( 'globalwatchlist-markpageseen' ) )
		.on( 'click', () => {
			that.markPageAsSeen( entry.title );
		} );
	$row.append( $markAsReadLink );

	$row.append( ')' );

	const $user = ( this.config.fastMode ? '' : entry.userDisplay );
	let $comment = '';
	if ( entry.commentDisplay ) {
		// Need to process links in the parsed comments as raw HTML
		$comment = $( '<span>' ).html( entry.commentDisplay );
	}
	if ( $user !== '' || $comment !== '' ) {
		$row.append( ' (' )
			.append( $user )
			.append( $comment )
			.append( ')' );
	}

	if ( entry.tagsDisplay ) {
		// Need to process links in the parsed description as raw HTML
		const $tags = $( '<em>' ).html( entry.tagsDisplay );

		$row.append( ' ' )
			.append( $tags );
	}

	return $row;
};
/* end GlobalWatchlistSiteDisplay.prototype.makePageLink */

/**
 * Create the output for this.$feedDiv, either for success (via renderWatchlist) or
 * failure (via renderApiFailure)
 *
 * @param {jQuery} $content Content to show
 * @param {Object} siteinfo Extra site information read live from the wiki
 * @param {boolean|undefined} siteinfo.rtl Whether the site is right-to-left;
 *  `undefined` if unknown
 */
GlobalWatchlistSiteDisplay.prototype.actuallyRenderWatchlist = function ( $content, siteinfo ) {
	const headerTemplate = mw.template.get(
		'ext.globalwatchlist.specialglobalwatchlist',
		'templates/siteRowHeader.mustache'
	);
	const headerParams = {
		'special-watchlist-url': this.linker.linkPage( 'Special:Watchlist' ),
		'site-name': this.site,
		'special-edit-watchlist-url': this.linker.linkPage( 'Special:EditWatchlist' ),
		'edit-watchlist-msg': mw.msg( 'globalwatchlist-editwatchlist' )
	};

	this.$feedDiv = $( '<div>' )
		.attr( 'id', 'ext-globalwatchlist-feed-site-' + this.siteID )
		.addClass( 'ext-globalwatchlist-feed-site' )
		.append(
			headerTemplate.render( headerParams ),
			$content
		);

	if ( siteinfo.rtl !== undefined ) {
		// mw-content-ltr and -rtl classes are not enough to ensure that the text is formatted
		// in the correct direction, so add a manual direction attribute. See T287649
		// We still add those classes because they are also used by jQuery.makeCollapsible
		// to know if the collapse button should be on the right or left.
		this.$feedDiv.attr( 'dir', siteinfo.rtl ? 'rtl' : 'ltr' );
		this.$feedDiv.addClass( siteinfo.rtl ? 'mw-content-rtl' : 'mw-content-ltr' );
	}
};

/**
 * Alert on API failures
 */
GlobalWatchlistSiteDisplay.prototype.renderApiFailure = function () {
	const $siteContent = $( '<p>' ).text(
		mw.msg( 'globalwatchlist-fetch-site-failure' )
	);

	this.actuallyRenderWatchlist( $siteContent, { rtl: undefined } );
};

/**
 * Display the watchlist
 *
 * @param {GlobalWatchlistEntryBase[]} summary What should be rendered
 * @param {Object} siteinfo Extra site information read live from the wiki
 * @param {boolean|undefined} siteinfo.rtl Whether the site is right-to-left;
 *  `undefined` if unknown
 */
GlobalWatchlistSiteDisplay.prototype.renderWatchlist = function ( summary, siteinfo ) {
	const $ul = $( '<ul>' ),
		that = this;
	summary.forEach( ( element ) => {
		$ul.append( that.makePageLink( element ) );
	} );

	const markSeenButton = new OO.ui.ButtonInputWidget( {
		classes: [ 'ext-globalwatchlist-feed-markseen' ],
		flags: [ 'destructive' ],
		icon: 'check',
		label: mw.msg( 'globalwatchlist-markseen' )
	} ).on( 'click', () => {
		that.markAllAsSeen();
	} );

	const $outputContent = $( '<div>' )
		.addClass( 'ext-globalwatchlist-site' )
		.append(
			markSeenButton.$element,
			$ul
		)
		.makeCollapsible();
	this.actuallyRenderWatchlist( $outputContent, siteinfo );
};
/* end GlobalWatchlistSiteDisplay.prototype.renderWatchlist */

/**
 * Update display after marking a site as seen
 */
GlobalWatchlistSiteDisplay.prototype.afterMarkAllAsSeen = function () {
	this.debug( 'markSiteAsSeen - hiding site' );
	if ( this.$feedDiv ) {
		// Don't call .children() on the default empty string, T275078
		$( this.$feedDiv.children()[ 1 ] ).hide();
	}

	// FIXME
	// GlobalWatchlist.watchlists.checkChangesShown( true );
};
/* end GlobalWatchlistSiteDisplay.prototype.afterMarkAllAsSeen */

GlobalWatchlistSiteBase.prototype.afterMarkPageAsSeen = function ( pageTitle ) {
	this.debug( 'markPageAsSeen - hiding page' );
	if ( this.$feedDiv ) {
		const dataTitle = encodeURIComponent( pageTitle );
		$( this.$feedDiv.find( '[data-title="' + dataTitle + '"]' ) ).hide();
	}
};

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

	const encodedSite = encodeURIComponent( this.siteID );
	const encodedTitle = encodeURIComponent( pageTitle );
	const $entries = $( 'li[data-site="' + encodedSite + '"][data-title="' + encodedTitle + '"]' );
	$entries[ unwatched ? 'addClass' : 'removeClass' ]( 'ext-globalwatchlist-strike' );

	$entries.children( '.ext-globalwatchlist-expiry-icon' ).remove();

	const $links = $entries.children( 'a.ext-globalwatchlist-watchunwatch' );
	const newText = mw.msg( unwatched ? 'globalwatchlist-rewatch' : 'globalwatchlist-unwatch' );
	const that = this;

	$links.each( function () {
		$( this ).off( 'click' );
		$( this ).on( 'click', () => {
			that.changeWatched( pageTitle, unwatched ? 'watch' : 'unwatch' );
		} );
		$( this ).text( newText );
	} );
};
/* end GlobalWatchlistSiteDisplay.prototype.processUpdateWatched */

module.exports = GlobalWatchlistSiteDisplay;
