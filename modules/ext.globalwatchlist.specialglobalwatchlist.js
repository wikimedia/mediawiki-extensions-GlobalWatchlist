/* eslint-disable no-jquery/no-global-selector */
/**
 * Javascript for Special:GlobalWatchlist
 */
( function () {
	'use strict';

	var GlobalWatchlistDebug = require( './ext.globalwatchlist.debug.js' ),
		GetSettings = require( './ext.globalwatchlist.getSettings.js' ),
		Config = GetSettings(),
		WatchedSite = require( './ext.globalwatchlist.site.js' ),
		WatchlistUtils = require( './ext.globalwatchlist.watchlistUtils.js' ),
		ViewElements = {},
		ViewManager = {},
		WatchedSites = [];

	Config.liveCounter = 0;
	Config.currentMode = -1;

	ViewElements.groupPage = new OO.ui.ToggleButtonWidget( {
		disabled: Config.fastMode,
		label: mw.msg( 'globalwatchlist-option-grouppage' ),
		value: Config.groupPage && !Config.fastMode
	} ).on( 'click', function () {
		Config.groupPage = ViewElements.groupPage.value;
		ViewManager.renderFeed();
	} );
	ViewElements.liveToggle = new OO.ui.ToggleButtonWidget( {
		disabled: Config.fastMode,
		label: mw.msg( 'globalwatchlist-option-live' ),
		value: false
	} ).on( 'click', function () {
		ViewManager.setMode( ViewElements.liveToggle.value ? 13 : 11 );
	} );
	ViewElements.settingsLink = new OO.ui.ButtonWidget( {
		flags: [ 'progressive' ],
		href: mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:GlobalWatchlistSettings' ),
		icon: 'settings',
		label: mw.msg( 'globalwatchlist-globalwatchlistsettingslink' )
	} );
	ViewElements.markAllSeen = new OO.ui.ButtonInputWidget( {
		flags: [ 'primary', 'destructive' ],
		icon: 'checkAll',
		id: 'globalWatchlist-markSeen-all',
		label: mw.msg( 'globalwatchlist-markseen-all' )
	} ).on( 'click', function () {
		WatchedSites.forEach( function ( site ) {
			site.markAsSeen();
		} );
	} );
	ViewElements.refresh = new OO.ui.ButtonInputWidget( {
		flags: [ 'primary', 'progressive' ],
		icon: 'reload',
		id: 'globalWatchlist-reflesh',
		label: mw.msg( 'globalwatchlist-refresh' )
	} ).on( 'click', function () {
		ViewManager.renderFeed();
	} );
	ViewElements.progressBar = new OO.ui.ProgressBarWidget( {
		id: 'globalWatchlist-watchlistsLoading'
	} );
	ViewElements.$asOf = $( '<div>' )
		.attr( 'id', 'globalWatchlist-asOf' );
	ViewElements.$sharedFeed = $( '<div>' )
		.attr( 'id', 'globalWatchlist-watchlistsFeed' );

	WatchedSites = Config.siteList.map( function ( site ) {
		return new WatchedSite(
			GlobalWatchlistDebug,
			Config,
			new mw.ForeignApi( '//' + site + mw.util.wikiScript( 'api' ) ),
			WatchlistUtils,
			site
		);
	} );

	ViewManager.create = function () {
		return [
			$( '<div>' )
				.attr( 'id', 'globalWatchlist-toolbar' )
				.append(
					ViewElements.liveToggle.$element,
					ViewElements.groupPage.$element,
					ViewElements.refresh.$element,
					ViewElements.settingsLink.$element,
					ViewElements.markAllSeen.$element
				),
			ViewElements.$asOf,
			ViewElements.progressBar.$element,
			ViewElements.$sharedFeed
		];
	};
	ViewManager.newEmptySiteRow = function ( site ) {
		var $li = $( '<li>' );
		$li.addClass( 'globalWatchlist-emptyWatchlist' );
		$li.append(
			$( '<a>' )
				.attr( 'href', '//' + site + mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:Watchlist' ) )
				.text( site ),
			' (',
			$( '<a>' )
				.attr( 'href', '//' + site + mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:EditWatchlist' ) )
				.text( mw.msg( 'globalwatchlist-editwatchlist' ) ),
			')'
		);
		return $li;
	};
	ViewManager.refresh = function () {
		GlobalWatchlistDebug.info( 'watchlists.refresh', 'starting refresh', 1 );
		Config.time = new Date();
		return new Promise( function ( resolve ) {
			Promise.all( WatchedSites.map( function ( site ) {
				return site.getWatchlist( Config );
			} ) ).then( function () {
				var $div = $( '<div>' ).attr( 'id', 'globalWatchlist-feedCollector' ),
					emptySites = [],
					showChangesLabel = false;

				WatchedSites.forEach( function ( site ) {
					GlobalWatchlistDebug.info(
						'watchlists.refrsh site loop, a site',
						site.site,
						3
					);
					if ( site.isEmpty ) {
						emptySites.push( site.site );
					} else {
						showChangesLabel = true;
						$div.append( site.$feedDiv );
					}
				} );

				if ( showChangesLabel ) {
					$div.prepend(
						new OO.ui.LabelWidget( {
							label: mw.msg( 'globalwatchlist-changesfeed' )
						} ).$element
					)
						.append( $( '<hr>' ) );
				}

				if ( emptySites[ 0 ] ) {
					var $ul = $( '<ul>' ),
						emptyFeedLabel = new OO.ui.LabelWidget( {
							label: mw.msg( 'globalwatchlist-emptyfeed' )
						} );
					emptySites.forEach( function ( site ) {
						$ul.append(
							ViewManager.newEmptySiteRow( site )
						);
					} );
					$div.append(
						emptyFeedLabel.$element,
						$( '<div>' )
							.addClass( 'globalWatchlist-emptySites' )
							.addClass( 'mw-collapsed' )
							.append(
								$( '<div>' )
									.addClass( 'globalWatchlist-col' )
									.append( $ul )
							)
							.makeCollapsible()
					);
				}

				ViewElements.$sharedFeed.empty()
					.append( $div );
				ViewManager.runLive();
				ViewElements.$asOf.innerText = mw.msg(
					'globalwatchlist-asof',
					Config.time.toUTCString()
				);
				resolve();
			} ).catch( function ( error ) {
				/* eslint-disable-next-line no-console */
				console.log( error );
				GlobalWatchlistDebug.info( 'watchlists.refresh ERROR', error, 1 );
				resolve();
			} );
		} );
	};
	ViewManager.renderFeed = function () {
		GlobalWatchlistDebug.info( 'renderFeed', 'called', 1 );
		if ( Config.currentMode === 13 ) {
			return;
		}

		ViewManager.setMode( 10 );
		ViewManager.refresh().then( function () {
			ViewManager.setMode( 11 );
		} );
	};

	ViewManager.runLive = function () {
		if ( Config.currentMode === 13 ) {
			GlobalWatchlistDebug.info( 'watchlists.runLive - counter', Config.liveCounter++, 1 );
			setTimeout( ViewManager.refresh, 7500 );
		}
	};

	ViewManager.setMode = function ( newMode ) {
		GlobalWatchlistDebug.info( 'mode', newMode, 1 );
		Config.currentMode = newMode;
		switch ( newMode ) {
			// Loading global watchlist
			case 10:
				ViewElements.liveToggle.setDisabled( true );
				ViewElements.progressBar.$element.show();
				ViewElements.$sharedFeed.hide();
				ViewElements.$asOf.innerText = '';
				break;

			// Showing global watchlist
			case 11:
				ViewElements.liveToggle.setDisabled( Config.fastMode );
				ViewElements.refresh.setDisabled( false );
				ViewElements.groupPage.setDisabled( Config.fastMode );
				ViewElements.liveToggle.setIcon( 'play' );
				ViewElements.progressBar.$element.hide();
				ViewElements.$sharedFeed.show();
				break;

			// Marking all sites as seen, primarily used for status
			case 12:
				$( 'span.globalWatchlist-feed-markSeen > button > span.oo-ui-labelElement-label' ).each( function () {
					this.click();
				} );
				break;

			// Live updates running
			case 13:
				ViewElements.refresh.setDisabled( true );
				ViewElements.groupPage.setDisabled( true );
				ViewElements.liveToggle.setIcon( 'pause' );
				ViewManager.runLive();
				break;

			// Anything else (not supported)
			default:
				GlobalWatchlistDebug.error( 'Unsupported mode', newMode );
		}
	};

	mw.globalwatchlist = {};
	mw.globalwatchlist.elements = ViewElements;
	mw.globalwatchlist.watchedSites = WatchedSites;
	mw.globalwatchlist.view = ViewManager;
	mw.globalwatchlist.debug = GlobalWatchlistDebug;
	mw.globalwatchlist.config = Config;

	// On ready initialization
	$( function () {
		GlobalWatchlistDebug.info( 'GlobalWatchlist', 'javascript loaded!', 1 );

		$( '.globalwatchlist-content' )
			.empty()
			.append( ViewManager.create() );

		ViewManager.setMode( 10 );
		ViewManager.renderFeed();
	} );
}() );
