/**
 * Javascript for Special:GlobalWatchlistSettings
 */
( function () {
	'use strict';

	var GlobalWatchlistDebug = require( './ext.globalwatchlist.debug.js' ),
		GetSettings = require( './ext.globalwatchlist.getSettings.js' ),
		SaveSettings = require( './ext.globalwatchlist.saveSettings.js' ),
		NotificationManager = require( './ext.globalwatchlist.notifications.js' ),
		SettingsElements = {},
		SettingsManager = {};

	SettingsElements.anon = new OO.ui.RadioSelectWidget( {
		items: [
			new OO.ui.RadioOptionWidget( {
				data: 0,
				label: mw.msg( 'globalwatchlist-filter-either' ),
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 1,
				label: mw.msg( 'globalwatchlist-filter-only-anon' ),
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 2,
				label: mw.msg( 'globalwatchlist-filter-not-anon' ),
			} ),
		],
		text: mw.msg( 'globalwatchlist-filter-anon' ),
	} );
	SettingsElements.bot = new OO.ui.RadioSelectWidget( {
		items: [
			new OO.ui.RadioOptionWidget( {
				data: 0,
				label: mw.msg( 'globalwatchlist-filter-either' ),
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 1,
				label: mw.msg( 'globalwatchlist-filter-only-bot' ),
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 2,
				label: mw.msg( 'globalwatchlist-filter-not-bot' ),
			} ),
		],
		text: mw.msg( 'globalwatchlist-filter-bot' ),
	} );
	SettingsElements.confirmAllSites = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-option-confirmallsites' )
	} );
	SettingsElements.edits = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-show-edits' )
	} );
	SettingsElements.fastMode = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-option-fastmode' )
	} );
	SettingsElements.groupPage = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-option-grouppage' )
	} );
	SettingsElements.logEntries = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-show-logentries' )
	} );
	SettingsElements.minor = new OO.ui.RadioSelectWidget( {
		items: [
			new OO.ui.RadioOptionWidget( {
				data: 0,
				label: mw.msg( 'globalwatchlist-filter-either' ),
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 1,
				label: mw.msg( 'globalwatchlist-filter-only-minor' ),
			} ),
			new OO.ui.RadioOptionWidget( {
				data: 2,
				label: mw.msg( 'globalwatchlist-filter-not-minor' ),
			} ),
		],
		text: mw.msg( 'globalwatchlist-filter-minor' ),
	} );
	SettingsElements.newPages = new OO.ui.CheckboxMultioptionWidget( {
		label: mw.msg( 'globalwatchlist-show-newpages' )
	} );
	SettingsElements.sitelist = new OO.ui.FieldsetLayout();
	SettingsElements.sites = [];

	SettingsManager.addRow = function ( start ) {
		var num = SettingsElements.sites.length,
			row = new OO.ui.ActionFieldLayout(
				new OO.ui.TextInputWidget( {
					classes: [ 'globalWatchlist-site-text' ],
					value: start || '',
				} ),
				new OO.ui.ButtonInputWidget( {
					flags: [ 'destructive' ],
					label: mw.msg( 'globalwatchlist-remove' ),
				} ).on( 'click', function () {
					SettingsElements.sites[num].toggle();
				} )
			);
		SettingsElements.sitelist.addItems( [ row ] );
		SettingsElements.sites.push( row );
	};
	SettingsManager.create = function () {
		return [
			new OO.ui.ButtonInputWidget( {
				icon: 'history',
				id: 'globalWatchlist-resetchanges',
				label: mw.msg( 'globalwatchlist-resetchanges' ),
			} ).on( 'click', function () {
				SettingsManager.prefill();
			} ).$element,
			new OO.ui.ButtonWidget( {
				flags: [ 'progressive' ],
				href: '/wiki/Special:GlobalWatchlist',
				icon: 'previous',
				label: mw.msg( 'globalwatchlist-globalwatchlistbacklink' ),
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
					SettingsElements.sitelist.$element,
					new OO.ui.ButtonInputWidget( {
						icon: 'add',
						id: 'globalWatchlist-add',
						label: mw.msg( 'globalwatchlist-add' ),
					} ).on( 'click', SettingsManager.addRow).$element,
					new OO.ui.ButtonInputWidget( {
						icon: 'bookmark',
						id: 'globalWatchlist-save',
						label: mw.msg( 'globalwatchlist-save' ),
					} ).on( 'click', SettingsManager.saveChanges).$element
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
							SettingsElements.anon.$element,
							SettingsElements.bot.$element,
							SettingsElements.minor.$element
						),
					$( '<hr>' ),
					$( '<div>' )
						.attr( 'id', 'globalWatchlist-settings-other' )
						.append(
							new OO.ui.LabelWidget( {
								label: mw.msg( 'globalwatchlist-changetypes' ),
							} ).$element,
							new OO.ui.CheckboxMultiselectWidget( {
								items: [
									SettingsElements.edits,
									SettingsElements.logEntries,
									SettingsElements.newPages,
								],
							} ).$element,
							new OO.ui.LabelWidget( {
								label: mw.msg( 'globalwatchlist-otheroptions' )
							} ).$element,
							new OO.ui.CheckboxMultiselectWidget( {
								items: [
									SettingsElements.groupPage,
									SettingsElements.confirmAllSites,
									SettingsElements.fastMode,
								],
							} ).$element
						)
				),
		];
	};
	SettingsManager.prefill = function () {
		var config = GetSettings();

		SettingsElements[ 'anon' ].selectItemByData( config[ 'anon' ] );
		SettingsElements[ 'bot' ].selectItemByData( config[ 'bot' ] );
		SettingsElements[ 'minor' ].selectItemByData( config[ 'minor' ] );

		SettingsElements[ 'edits' ].setSelected( config[ 'showEdits' ] );
		SettingsElements[ 'logEntries' ].setSelected( config[ 'showLogEntries' ] );
		SettingsElements[ 'newPages' ].setSelected( config[ 'showNewPages' ] );
		SettingsElements[ 'groupPage' ].setSelected( config[ 'groupPage' ] );
		SettingsElements[ 'confirmAllSites' ].setSelected( config[ 'confirmAllSites' ] );
		SettingsElements[ 'fastMode' ].setSelected( config[ 'fastMode' ] );

		SettingsElements.sitelist.clearItems();
		config.siteList.forEach( function ( site, index ) {
			SettingsElements.sites[index].toggle( true );
			SettingsElements.sitelist.addItems( [ SettingsElements.sites[index] ] );

			/* eslint-disable-next-line no-jquery/no-global-selector, no-jquery/no-sizzle */
			$( '.globalWatchlist-site-text:last > input' )[0].value = site;
		} );
		SettingsElements.sites[ config.siteList.length ].toggle( true );
		SettingsElements.sitelist.addItems( [ SettingsElements.sites[ config.siteList.length ] ] );

		/* eslint-disable-next-line no-jquery/no-global-selector, no-jquery/no-sizzle */
		$( '.globalWatchlist-site-text:last > input' )[0].value = '';
	};
	SettingsManager.saveChanges = function () {
		var notifications = new NotificationManager( GlobalWatchlistDebug ),
			settings = {
				anonFilter: SettingsElements.anon.findSelectedItem().data,
				botFilter: SettingsElements.bot.findSelectedItem().data,
				confirmAllSites: SettingsElements.confirmAllSites.isSelected(),
				fastMode: SettingsElements.fastMode.isSelected(),
				groupPage: SettingsElements.groupPage.isSelected(),
				minorFilter: SettingsElements.minor.findSelectedItem().data,
				showEdits: SettingsElements.edits.isSelected(),
				showLogEntries: SettingsElements.logEntries.isSelected(),
				showNewPages: SettingsElements.newPages.isSelected(),

				/* eslint-disable-next-line no-jquery/no-global-selector, no-jquery/no-sizzle */
				sites: $( 'div.oo-ui-actionFieldLayout:visible .globalWatchlist-site-text > input' )
					.filter(
						function () {
							return this.value && this.value !== '';
						}
					)
					.map( function ( site, field ) {
						return field.value
					} )
					.toArray(),
			};
		GlobalWatchlistDebug.info( 'Settings.saveChanges', settings, 0 );

		// Preload the notification module for mw.notify, used in notifications
		// not included as a dependency for this module because it isn't needed until
		// the user wants to save their settings, and so shouldn't delay initial
		// loading
		mw.loader.load( 'mediawiki.notification' );

		SaveSettings( GlobalWatchlistDebug, settings )
			.done( function ( data ) {
				notifications.onSettingsSaved( data );
			} )
			.fail( function ( data ) {
				notifications.onSettingsFailed( data );
			} );
	};

	mw.globalwatchlist = mw.globalwatchlist || {};
	mw.globalwatchlist.settings = SettingsManager;

	// On ready initialization
	$( function () {
		GlobalWatchlistDebug.info( 'GlobalWatchlistSettings', 'javascript loaded!', 1 );

		/* eslint-disable-next-line no-jquery/no-global-selector */
		$( '.globalwatchlist-content' )
			.empty()
			.append( SettingsManager.create() );
		GetSettings().siteList.forEach( function ( site ) {
			SettingsManager.addRow( site );
		} );
		SettingsManager.addRow();
		SettingsManager.prefill();
	} );
}() );