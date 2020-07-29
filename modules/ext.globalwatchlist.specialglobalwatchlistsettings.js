/*
 * Javascript for Special:GlobalWatchlistSettings
 */
( function () {
	'use strict';

	var globalWatchlistDebug = require( './ext.globalwatchlist.debug.js' ),
		getSettings = require( './ext.globalwatchlist.getSettings.js' ),
		saveSettings = require( './ext.globalwatchlist.saveSettings.js' ),
		NotificationManager = require( './ext.globalwatchlist.notifications.js' ),
		settingsElements = {},
		settingsManager = {};
	var notifications = new NotificationManager( globalWatchlistDebug );
	var startingOptions = getSettings( notifications );

	settingsElements.anon = new OO.ui.RadioSelectWidget( {
		items: [
			new OO.ui.RadioOptionWidget( {
				data: 0,
				label: mw.msg( 'globalwatchlist-filter-either' )
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 1,
				label: mw.msg( 'globalwatchlist-filter-only-anon' )
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 2,
				label: mw.msg( 'globalwatchlist-filter-not-anon' )
			} )
		],
		text: mw.msg( 'globalwatchlist-filter-anon' )
	} );
	settingsElements.bot = new OO.ui.RadioSelectWidget( {
		items: [
			new OO.ui.RadioOptionWidget( {
				data: 0,
				label: mw.msg( 'globalwatchlist-filter-either' )
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 1,
				label: mw.msg( 'globalwatchlist-filter-only-bot' )
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 2,
				label: mw.msg( 'globalwatchlist-filter-not-bot' )
			} )
		],
		text: mw.msg( 'globalwatchlist-filter-bot' )
	} );
	settingsElements.confirmAllSites = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-option-confirmallsites' )
	} );
	settingsElements.edits = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-show-edits' )
	} );
	settingsElements.fastMode = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-option-fastmode' )
	} );
	settingsElements.groupPage = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-option-grouppage' )
	} );
	settingsElements.logEntries = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-show-logentries' )
	} );
	settingsElements.minor = new OO.ui.RadioSelectWidget( {
		items: [
			new OO.ui.RadioOptionWidget( {
				data: 0,
				label: mw.msg( 'globalwatchlist-filter-either' )
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 1,
				label: mw.msg( 'globalwatchlist-filter-only-minor' )
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 2,
				label: mw.msg( 'globalwatchlist-filter-not-minor' )
			} )
		],
		text: mw.msg( 'globalwatchlist-filter-minor' )
	} );
	settingsElements.newPages = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-show-newpages' )
	} );
	settingsElements.sitelist = new OO.ui.FieldsetLayout();
	settingsElements.sites = [];

	settingsManager.addRow = function ( start ) {
		var num = settingsElements.sites.length,
			row = new OO.ui.ActionFieldLayout(
				new OO.ui.TextInputWidget( {
					classes: [ 'globalWatchlist-site-text' ],
					value: start || ''
				} ),
				new OO.ui.ButtonInputWidget( {
					flags: [ 'destructive' ],
					label: mw.msg( 'globalwatchlist-remove' )
				} ).on( 'click', function () {
					settingsElements.sites[ num ].toggle();
				} )
			);
		settingsElements.sitelist.addItems( [ row ] );
		settingsElements.sites.push( row );
	};
	settingsManager.create = function () {
		return [
			new OO.ui.ButtonInputWidget( {
				icon: 'history',
				id: 'globalWatchlist-resetchanges',
				label: mw.msg( 'globalwatchlist-resetchanges' )
			} ).on( 'click', function () {
				settingsManager.prefill();
			} ).$element,
			new OO.ui.ButtonWidget( {
				flags: [ 'progressive' ],
				href: '/wiki/Special:GlobalWatchlist',
				icon: 'previous',
				label: mw.msg( 'globalwatchlist-globalwatchlistbacklink' )
			} ).$element,
			$( '<hr>' ),
			$( '<br>' ),
			$( '<div>' )
				.attr( 'id', 'globalWatchlist-sites' )
				.append(
					new OO.ui.LabelWidget( {
						label: mw.msg( 'globalwatchlist-sitelist' )
					} ).$element,
					$( '<div>' )
						.attr( 'id', 'globalWatchlist-sites-list' ),
					settingsElements.sitelist.$element,
					new OO.ui.ButtonInputWidget( {
						icon: 'add',
						id: 'globalWatchlist-add',
						label: mw.msg( 'globalwatchlist-add' )
					} ).on( 'click', settingsManager.addRow ).$element,
					new OO.ui.ButtonInputWidget( {
						icon: 'bookmark',
						id: 'globalWatchlist-save',
						label: mw.msg( 'globalwatchlist-save' )
					} ).on( 'click', settingsManager.saveChanges ).$element
				),
			$( '<div>' )
				.attr( 'id', 'globalWatchlist-filters' )
				.append(
					$( '<div>' )
						.attr( 'id', 'globalWatchlist-filters-label' )
						.append(
							new OO.ui.LabelWidget( {
								label: mw.msg( 'globalwatchlist-filters' )
							} ).$element
						),
					$( '<hr>' ),
					$( '<div>' )
						.attr( 'id', 'globalWatchlist-filters-list' )
						.append(
							settingsElements.anon.$element,
							settingsElements.bot.$element,
							settingsElements.minor.$element
						),
					$( '<hr>' ),
					$( '<div>' )
						.attr( 'id', 'globalWatchlist-settings-other' )
						.append(
							new OO.ui.LabelWidget( {
								label: mw.msg( 'globalwatchlist-changetypes' )
							} ).$element,
							new OO.ui.CheckboxMultiselectWidget( {
								items: [
									settingsElements.edits,
									settingsElements.logEntries,
									settingsElements.newPages
								]
							} ).$element,
							new OO.ui.LabelWidget( {
								label: mw.msg( 'globalwatchlist-otheroptions' )
							} ).$element,
							new OO.ui.CheckboxMultiselectWidget( {
								items: [
									settingsElements.groupPage,
									settingsElements.confirmAllSites,
									settingsElements.fastMode
								]
							} ).$element
						)
				)
		];
	};
	settingsManager.prefill = function () {
		settingsElements.anon.selectItemByData( startingOptions.anon );
		settingsElements.bot.selectItemByData( startingOptions.bot );
		settingsElements.minor.selectItemByData( startingOptions.minor );

		settingsElements.edits.setSelected( startingOptions.showEdits );
		settingsElements.logEntries.setSelected( startingOptions.showLogEntries );
		settingsElements.newPages.setSelected( startingOptions.showNewPages );
		settingsElements.groupPage.setSelected( startingOptions.groupPage );
		settingsElements.confirmAllSites.setSelected( startingOptions.confirmAllSites );
		settingsElements.fastMode.setSelected( startingOptions.fastMode );

		settingsElements.sitelist.clearItems();
		startingOptions.siteList.forEach( function ( site, index ) {
			settingsElements.sites[ index ].toggle( true );
			settingsElements.sitelist.addItems( [ settingsElements.sites[ index ] ] );

			/* eslint-disable-next-line no-jquery/no-global-selector, no-jquery/no-sizzle */
			$( '.globalWatchlist-site-text:last > input' )[ 0 ].value = site;
		} );
		settingsElements.sites[ startingOptions.siteList.length ].toggle( true );
		settingsElements.sitelist.addItems(
			[ settingsElements.sites[ startingOptions.siteList.length ] ]
		);

		/* eslint-disable-next-line no-jquery/no-global-selector, no-jquery/no-sizzle */
		$( '.globalWatchlist-site-text:last > input' )[ 0 ].value = '';
	};
	settingsManager.saveChanges = function () {
		var settings = {
			anonFilter: settingsElements.anon.findSelectedItem().data,
			botFilter: settingsElements.bot.findSelectedItem().data,
			confirmAllSites: settingsElements.confirmAllSites.isSelected(),
			fastMode: settingsElements.fastMode.isSelected(),
			groupPage: settingsElements.groupPage.isSelected(),
			minorFilter: settingsElements.minor.findSelectedItem().data,
			showEdits: settingsElements.edits.isSelected(),
			showLogEntries: settingsElements.logEntries.isSelected(),
			showNewPages: settingsElements.newPages.isSelected(),

			/* eslint-disable-next-line no-jquery/no-global-selector, no-jquery/no-sizzle */
			sites: $( 'div.oo-ui-actionFieldLayout:visible .globalWatchlist-site-text > input' )
				.filter(
					function () {
						return this.value && this.value !== '';
					}
				)
				.map( function ( site, field ) {
					return field.value;
				} )
				.toArray()
		};
		globalWatchlistDebug.info( 'Settings.saveChanges', settings, 0 );

		// Preload the notification module for mw.notify, used in notifications
		// not included as a dependency for this module because it isn't needed until
		// the user wants to save their settings, and so shouldn't delay initial
		// loading
		mw.loader.load( 'mediawiki.notification' );

		saveSettings( globalWatchlistDebug, settings )
			.done( function ( data ) {
				notifications.onSettingsSaved( data );
			} )
			.fail( function ( response, data ) {
				notifications.onSettingsFailed( response, data );
			} );
	};

	mw.globalwatchlist = mw.globalwatchlist || {};
	mw.globalwatchlist.settings = settingsManager;
	mw.globalwatchlist.debug = globalWatchlistDebug;

	// On ready initialization
	$( function () {
		globalWatchlistDebug.info( 'GlobalWatchlistSettings', 'javascript loaded!', 1 );

		/* eslint-disable-next-line no-jquery/no-global-selector */
		$( '.globalwatchlist-content' )
			.empty()
			.append( settingsManager.create() );
		startingOptions.siteList.forEach( function ( site ) {
			settingsManager.addRow( site );
		} );
		settingsManager.addRow();
		settingsManager.prefill();
	} );
}() );
