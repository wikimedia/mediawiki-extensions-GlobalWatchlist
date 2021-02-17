/* eslint-disable no-jquery/no-global-selector */
/*
 * Javascript for Special:GlobalWatchlist
 */
( function () {
	'use strict';

	var GlobalWatchlistDebugger = require( './Debug.js' ),
		getSettings = require( './getSettings.js' ),
		config = {},
		MultiSiteWrapper = require( './MultiSiteWrapper.js' ),
		WatchedSite = require( './SiteDisplay.js' ),
		viewElements = {},
		viewManager = {};
	var globalWatchlistDebug = new GlobalWatchlistDebugger();

	config = getSettings( globalWatchlistDebug );
	config.liveCounter = 0;
	config.inLive = false;

	var watchedSites = new MultiSiteWrapper(
		WatchedSite,
		config,
		globalWatchlistDebug
	);

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
		if ( viewElements.liveToggle.value ) {
			viewManager.startLiveUpdates();
		} else {
			viewManager.showFeed();
		}
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
		id: 'ext-globalwatchlist-markseen-all',
		label: mw.msg( 'globalwatchlist-markseen-all' )
	} ).on( 'click', function () {
		watchedSites.markAllSitesSeen( config.confirmAllSites );
	} );
	viewElements.refresh = new OO.ui.ButtonInputWidget( {
		flags: [ 'primary', 'progressive' ],
		icon: 'reload',
		id: 'ext-globalwatchlist-reflesh',
		label: mw.msg( 'globalwatchlist-refresh' )
	} ).on( 'click', function () {
		viewManager.renderFeed();
	} );
	viewElements.progressBar = new OO.ui.ProgressBarWidget( {
		id: 'ext-globalwatchlist-watchlistsloading'
	} );
	viewElements.progressBar.$element.hide();
	viewElements.$asOf = $( '<div>' )
		.attr( 'id', 'ext-globalwatchlist-asof' );
	viewElements.$sharedFeed = $( '<div>' )
		.attr( 'id', 'ext-globalwatchlist-watchlistsfeed' );
	viewElements.$toolbar = $( '<div>' )
		.attr( 'id', 'ext-globalwatchlist-toolbar' )
		.append(
			viewElements.liveToggle.$element,
			viewElements.groupPage.$element,
			viewElements.refresh.$element,
			viewElements.settingsLink.$element,
			viewElements.markAllSeen.$element
		);
	// The "Sites with changes" label
	viewElements.$feedHeader = new OO.ui.LabelWidget( {
		label: mw.msg( 'globalwatchlist-changesfeed' )
	} ).$element;
	viewElements.$feedHeader.hide();

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
		globalWatchlistDebug.info( 'watchlists.refresh - starting' );
		config.time = new Date();
		return new Promise( function ( resolve ) {
			watchedSites.getAllWatchlists( config ).then( function () {
				var $div = $( '<div>' ).attr( 'id', 'ext-globalwatchlist-feedcollector' ),
					emptySites = [],
					haveChangesToShow = false;

				watchedSites.siteList.forEach( function ( site ) {
					globalWatchlistDebug.info(
						'watchlists.refrsh site loop, handling site: ' + site.site
					);
					if ( site.isEmpty ) {
						emptySites.push( site.site );
					} else {
						haveChangesToShow = true;
						$div.append( site.$feedDiv );
					}
				} );

				// Only show the "Sites with changes" message if there
				// are any sites without changes, otherwise its not helpful
				// See T274720
				if ( haveChangesToShow && emptySites[ 0 ] ) {
					viewElements.$feedHeader.show();
					$div.append( $( '<hr>' ) );
				} else {
					viewElements.$feedHeader.hide();
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
					var $emptySitesDiv = $( '<div>' ).append( $ul );

					$div.append(
						emptyFeedLabel.$element,
						$emptySitesDiv
					);
				}

				viewElements.$sharedFeed.empty()
					.append( $div );
				viewManager.runLive();
				viewElements.$asOf[0].innerText = mw.msg(
					'globalwatchlist-asof',
					config.time.toUTCString()
				);
				resolve();
			} ).catch( function ( error ) {
				/* eslint-disable-next-line no-console */
				console.log( error );
				globalWatchlistDebug.info( 'watchlists.refresh ERROR', error );
				resolve();
			} );
		} );
	};
	viewManager.renderFeed = function () {
		globalWatchlistDebug.info( 'renderFeed - called' );
		if ( config.inLive === true ) {
			return;
		}

		config.inLive = false;

		viewElements.liveToggle.setDisabled( true );
		viewElements.progressBar.$element.show();
		viewElements.$feedHeader.hide();
		viewElements.$sharedFeed.hide();
		viewElements.$asOf[0].innerText = '';

		viewManager.refresh().then( function () {
			viewManager.showFeed();
		} );
	};

	viewManager.maybeLiveRefresh = function () {
		// In case the live updates were disabled between when the refresh
		// was queued and when it was called, double check current config
		// before proceeding to refresh()
		if ( config.inLive ) {
			viewManager.refresh();
		}
	};

	viewManager.runLive = function () {
		if ( config.inLive === true ) {
			config.liveCounter++;
			globalWatchlistDebug.info( 'watchlists.runLive - counter: ' + config.liveCounter );
			setTimeout( viewManager.maybeLiveRefresh, 7500 );
		}
	};

	// Displaying the global watchlist
	viewManager.showFeed = function () {
		globalWatchlistDebug.info( 'mode - displaying watchlist' );
		config.inLive = false;

		viewElements.liveToggle.setDisabled( config.fastMode );
		viewElements.refresh.setDisabled( false );
		viewElements.groupPage.setDisabled( config.fastMode );
		viewElements.liveToggle.setIcon( 'play' );
		viewElements.progressBar.$element.hide();
		viewElements.$sharedFeed.show();
	};

	// Running in live updates mode
	viewManager.startLiveUpdates = function () {
		globalWatchlistDebug.info( 'mode - starting live updates' );
		config.inLive = true;

		viewElements.refresh.setDisabled( true );
		viewElements.groupPage.setDisabled( true );
		viewElements.liveToggle.setIcon( 'pause' );
		viewManager.runLive();
	};

	mw.globalwatchlist = {
		config: config,
		debug: globalWatchlistDebug,
		elements: viewElements,
		view: viewManager,
		watchedSites: watchedSites
	};

	// On ready initialization
	$( function () {
		globalWatchlistDebug.info( 'GlobalWatchlist - javascript loaded!' );

		$( '.ext-globalwatchlist-content' )
			.empty()
			.append(
				viewElements.$toolbar,
				viewElements.$asOf,
				viewElements.progressBar.$element,
				viewElements.$feedHeader,
				viewElements.$sharedFeed
			);

		// Based on viewManager.renderFeed but with timing
		var loadStartTime = mw.now();
		viewElements.liveToggle.setDisabled( true );
		viewElements.$sharedFeed.hide();
		viewElements.$asOf[0].innerText = '';

		// Wait a bit before showing the progress bar, hopefully if the user's
		// internet is fast enough clearTimeout will be called before the loading bar
		// is ever shown. See T268268
		var timer = setTimeout( function () {
			viewElements.progressBar.$element.show();
		}, 1500 );

		viewManager.refresh().then( function () {
			// If the progress bar wasn't shown, prevent timer from finishing
			clearTimeout( timer );

			viewManager.showFeed();

			var metricName = config.fastMode ?
				'timing.MediaWiki.GlobalWatchlist.firstload.display.fastmode' :
				'timing.MediaWiki.GlobalWatchlist.firstload.display.normal';
			var loadEndTime = mw.now();
			var loadElapsedTime = loadEndTime - loadStartTime;
			mw.track( metricName, loadElapsedTime );
		} );

		// Only run live updates when the special page is being displayed
		// Note: the page visibility api isn't available for some of the
		// older versions of mobile browsers that MediaWiki still provides
		// Grade A support for, but its better than nothing. See T268266
		document.addEventListener( 'visibilitychange', function () {
			if ( document.visibilityState === 'hidden' ) {
				// Pause live updates
				if ( config.inLive === true ) {
					config.inLive = 'paused';
				}
			} else if ( document.visibilityState === 'visible' ) {
				// Unpause
				if ( config.inLive === 'paused' ) {
					// Set back to true in the method, as well as requeueing
					// the actual updates
					viewManager.startLiveUpdates();
				}
			}
		} );
	} );
}() );
