/* eslint-disable no-jquery/no-global-selector */
/**
 * Javascript for Special:GlobalWatchlist
 */
( function () {
	'use strict';

	var globalWatchlistDebug = require( './ext.globalwatchlist.debug.js' ),
		getSettings = require( './ext.globalwatchlist.getSettings.js' ),
		config = {},
		NotificationManager = require( './ext.globalwatchlist.notifications.js' ),
		WatchedSite = require( './ext.globalwatchlist.site.js' ),
		watchlistUtils = require( './ext.globalwatchlist.watchlistUtils.js' ),
		viewElements = {},
		viewManager = {},
		watchedSites = [];
	var notifications = new NotificationManager( globalWatchlistDebug );

	config = getSettings( notifications );
	config.liveCounter = 0;
	config.currentMode = -1;

	viewElements.groupPage = new OO.ui.ToggleButtonWidget( {
		disabled: config.fastMode,
		label: mw.msg( 'globalwatchlist-option-grouppage' ),
		value: config.groupPage && !config.fastMode
	} ).on( 'click', function () {
		config.groupPage = viewElements.groupPage.value;
		viewManager.renderFeed();
	} );
	viewElements.liveToggle = new OO.ui.ToggleButtonWidget( {
		disabled: config.fastMode,
		label: mw.msg( 'globalwatchlist-option-live' ),
		value: false
	} ).on( 'click', function () {
		viewManager.setMode( viewElements.liveToggle.value ? 13 : 11 );
	} );
	viewElements.settingsLink = new OO.ui.ButtonWidget( {
		flags: [ 'progressive' ],
		href: mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:GlobalWatchlistSettings' ),
		icon: 'settings',
		label: mw.msg( 'globalwatchlist-globalwatchlistsettingslink' )
	} );
	viewElements.markAllSeen = new OO.ui.ButtonInputWidget( {
		flags: [ 'primary', 'destructive' ],
		icon: 'checkAll',
		id: 'globalWatchlist-markSeen-all',
		label: mw.msg( 'globalwatchlist-markseen-all' )
	} ).on( 'click', function () {
		if ( config.confirmAllSites ) {
			notifications.onMarkAllSitesSeen( viewManager.reallyMarkAllSeen );
		} else {
			globalWatchlistDebug.info( 'MarkAllSitesSeen', 'Marking without confirmation', 1 );
			viewManager.reallyMarkAllSeen();
		}
	} );
	viewElements.refresh = new OO.ui.ButtonInputWidget( {
		flags: [ 'primary', 'progressive' ],
		icon: 'reload',
		id: 'globalWatchlist-reflesh',
		label: mw.msg( 'globalwatchlist-refresh' )
	} ).on( 'click', function () {
		viewManager.renderFeed();
	} );
	viewElements.progressBar = new OO.ui.ProgressBarWidget( {
		id: 'globalWatchlist-watchlistsLoading'
	} );
	viewElements.$asOf = $( '<div>' )
		.attr( 'id', 'globalWatchlist-asOf' );
	viewElements.$sharedFeed = $( '<div>' )
		.attr( 'id', 'globalWatchlist-watchlistsFeed' );
	viewElements.$toolbar = $( '<div>' )
		.attr( 'id', 'globalWatchlist-toolbar' )
		.append(
			viewElements.liveToggle.$element,
			viewElements.groupPage.$element,
			viewElements.refresh.$element,
			viewElements.settingsLink.$element,
			viewElements.markAllSeen.$element
		);

	watchedSites = config.siteList.map( function ( site ) {
		return new WatchedSite(
			globalWatchlistDebug,
			config,
			new mw.ForeignApi( '//' + site + mw.util.wikiScript( 'api' ) ),
			watchlistUtils,
			site
		);
	} );

	viewManager.newEmptySiteRow = function ( site ) {
		var template = mw.template.get(
			'ext.globalwatchlist.specialglobalwatchlist',
			'templates/newEmptySiteRow.mustache'
		);
		var params = {
			'special-watchlist-url': '//' + site + mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:Watchlist' ),
			'site-name': site,
			'special-edit-watchlist-url': '//' + site + mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:EditWatchlist' ),
			'edit-watchlist-msg': mw.msg( 'globalwatchlist-editwatchlist' )
		};
		return template.render( params );
	};
	viewManager.refresh = function () {
		globalWatchlistDebug.info( 'watchlists.refresh', 'starting refresh', 1 );
		config.time = new Date();
		return new Promise( function ( resolve ) {
			Promise.all( watchedSites.map( function ( site ) {
				return site.getWatchlist( config );
			} ) ).then( function () {
				var $div = $( '<div>' ).attr( 'id', 'globalWatchlist-feedCollector' ),
					emptySites = [],
					showChangesLabel = false;

				watchedSites.forEach( function ( site ) {
					globalWatchlistDebug.info(
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
							viewManager.newEmptySiteRow( site )
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

				viewElements.$sharedFeed.empty()
					.append( $div );
				viewManager.runLive();
				viewElements.$asOf.innerText = mw.msg(
					'globalwatchlist-asof',
					config.time.toUTCString()
				);
				resolve();
			} ).catch( function ( error ) {
				/* eslint-disable-next-line no-console */
				console.log( error );
				globalWatchlistDebug.info( 'watchlists.refresh ERROR', error, 1 );
				resolve();
			} );
		} );
	};
	viewManager.renderFeed = function () {
		globalWatchlistDebug.info( 'renderFeed', 'called', 1 );
		if ( config.currentMode === 13 ) {
			return;
		}

		viewManager.setMode( 10 );
		viewManager.refresh().then( function () {
			viewManager.setMode( 11 );
		} );
	};
	viewManager.reallyMarkAllSeen = function () {
		// Needs to be a separate function to be passed as a callback to the notification
		// manager if the user prefers to require confirmation
		watchedSites.forEach( function ( site ) {
			site.markAsSeen();
		} );
	}

	viewManager.runLive = function () {
		if ( config.currentMode === 13 ) {
			globalWatchlistDebug.info( 'watchlists.runLive - counter', config.liveCounter++, 1 );
			setTimeout( viewManager.refresh, 7500 );
		}
	};

	viewManager.setMode = function ( newMode ) {
		globalWatchlistDebug.info( 'mode', newMode, 1 );
		config.currentMode = newMode;
		switch ( newMode ) {
			// Loading global watchlist
			case 10:
				viewElements.liveToggle.setDisabled( true );
				viewElements.progressBar.$element.show();
				viewElements.$sharedFeed.hide();
				viewElements.$asOf.innerText = '';
				break;

			// Showing global watchlist
			case 11:
				viewElements.liveToggle.setDisabled( config.fastMode );
				viewElements.refresh.setDisabled( false );
				viewElements.groupPage.setDisabled( config.fastMode );
				viewElements.liveToggle.setIcon( 'play' );
				viewElements.progressBar.$element.hide();
				viewElements.$sharedFeed.show();
				break;

			// Marking all sites as seen, primarily used for status
			case 12:
				$( 'span.globalWatchlist-feed-markSeen > button > span.oo-ui-labelElement-label' ).each( function () {
					this.click();
				} );
				break;

			// Live updates running
			case 13:
				viewElements.refresh.setDisabled( true );
				viewElements.groupPage.setDisabled( true );
				viewElements.liveToggle.setIcon( 'pause' );
				viewManager.runLive();
				break;

			// Anything else (not supported)
			default:
				globalWatchlistDebug.error( 'Unsupported mode', newMode );
		}
	};

	mw.globalwatchlist = {};
	mw.globalwatchlist.elements = viewElements;
	mw.globalwatchlist.watchedSites = watchedSites;
	mw.globalwatchlist.view = viewManager;
	mw.globalwatchlist.debug = globalWatchlistDebug;
	mw.globalwatchlist.config = config;
	mw.globalwatchlist.notifications = notifications;

	// On ready initialization
	$( function () {
		globalWatchlistDebug.info( 'GlobalWatchlist', 'javascript loaded!', 1 );

		$( '.globalwatchlist-content' )
			.empty()
			.append(
				viewElements.$toolbar,
				viewElements.$asOf,
				viewElements.progressBar.$element,
				viewElements.$sharedFeed
			);

		viewManager.setMode( 10 );
		viewManager.renderFeed();
	} );
}() );
