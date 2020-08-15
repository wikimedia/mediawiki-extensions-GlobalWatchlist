/*
 * Extended version of SiteBase.js for use in jQuery version of Special:GlobalWatchlist
 */
( function () {
	'use strict';

	var GlobalWatchlistSiteBase = require( './SiteBase.js' );

	/**
	 * Represents a specific site, including the display (used in jQuery / non-Vue display)
	 *
	 * @class GlobalWatchlistSiteDisplay
	 * @extends GlobalWatchlistSiteBase
	 *
	 * @constructor
	 * @param {GlobalWatchlistDebugger} globalWatchlistDebug
	 * @param {Object} config
	 * @param {Object} api
	 * @param {Object} watchlistUtils
	 * @param {string} urlFragment
	 */
	function GlobalWatchlistSiteDisplay( globalWatchlistDebug, config, api, watchlistUtils, urlFragment ) {
		GlobalWatchlistSiteDisplay.super.call(
			this,
			globalWatchlistDebug,
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
	 * @param {Object} entry
	 * @return {Object}
	 */
	GlobalWatchlistSiteDisplay.prototype.makePageLink = function ( entry ) {
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

		$row.attr( 'data-site', encodeURIComponent( this.siteID ) );
		$row.attr( 'data-title', encodeURIComponent( entry.title ) );

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

		this.debug( 'makePageLink for entry', [ entry, $row ] );
		return $row;
	};
	/* end GlobalWatchlistSiteDisplay.prototype.makePageLink */

	/**
	 * Display the watchlist
	 *
	 * @param {Array} summary
	 */
	GlobalWatchlistSiteDisplay.prototype.renderWatchlist = function ( summary ) {
		var $ul = $( '<ul>' ),
			that = this;
		summary.forEach( function ( element ) {
			$ul.append( that.makePageLink( element ) );
		} );

		var markSeenButton = new OO.ui.ButtonInputWidget( {
			classes: [ 'globalWatchlist-feed-markSeen' ],
			flags: [ 'destructive' ],
			icon: 'check',
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
			.attr( 'id', 'globalwatchlist-feed-site-' + this.siteID )
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
	/* end GlobalWatchlistSiteDisplay.prototype.renderWatchlist */

	/**
	 * Update display after marking a site as seen
	 */
	GlobalWatchlistSiteDisplay.prototype.afterMarkAsSeen = function () {
		this.debug( 'markSiteAsSeen - hiding site' );
		$( this.$feedDiv.children()[ 1 ] ).hide();

		// FIXME
		// GlobalWatchlist.watchlists.checkChangesShown( true );
	}
	/* end GlobalWatchlistSiteDisplay.prototype.afterMarkAsSeen */

	/**
	 * Update entry click handlers, text, and strikethrough for a specific title
	 *
	 * @param {string} pageTitle
	 * @param {boolean} unwatched
	 */
	GlobalWatchlistSiteDisplay.prototype.processUpdateWatched = function ( pageTitle, unwatched ) {
		this.debug(
			'Proccessing after ' + ( unwatched ? 'unwatching' : 'rewatching' ) + ': ' + pageTitle
		);

		var encodedSite = encodeURIComponent( this.siteID );
		var encodedTitle = encodeURIComponent( pageTitle );
		var $entries = $( 'li[data-site="' + encodedSite + '"][data-title="' + encodedTitle + '"]' );
		$entries[ unwatched ? 'addClass' : 'removeClass' ]( 'globalWatchlist-strike' );

		var $links = $entries.children( 'a.globalWatchlist-watchunwatch' );
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

}() );
