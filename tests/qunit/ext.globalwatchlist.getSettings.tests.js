( function () {
	var getSettings = require( '../../../modules/ext.globalwatchlist.getSettings.js' );

	function FakeNotificationManager() {
		this.onGetOptionsErrorCalled = false;

		// eslint-disable-next-line no-unused-vars
		this.onGetOptionsError = function ( unused ) {
			this.onGetOptionsErrorCalled = true;
		};
	};

	var defaultSettings = {
		siteList: [ 'en.wikipedia.org' ],
		anon: 0,
		bot: 0,
		minor: 0,
		confirmAllSites: true,
		fastMode: false,
		groupPage: true,
		showEdits: true,
		showLogEntries: true,
		showNewPages: true,

		// Based on the others or the config
		lang: 'en',
		watchlistQueryProps: 'ids|title|flags|loginfo|parsedcomment|user|tags',
		watchlistQueryTypes: 'edit|new|log',
		watchlistQueryShow: '',
		wikibaseLabelNamespaces: [ 0 ]
	};

	QUnit.module( 'ext.globalwatchlist.getSettings', QUnit.newMwEnvironment( {
		config: {
			wgNamespaceIds: {},
			wgServer: '//en.wikipedia.org',
			wgUserLanguage: 'en'
		}
	} ) );

	QUnit.test( 'getSettings.noSettings', function ( assert ) {
		mw.user.options.set( 'global-watchlist-options', null );
		var notificationManager = new FakeNotificationManager();

		var settings = getSettings( notificationManager );

		assert.deepEqual(
			settings,
			defaultSettings,
			'When the user has no settings set, the defaults are used'
		);
		assert.strictEqual(
			notificationManager.onGetOptionsErrorCalled,
			false,
			'No errors occurred fetching user options'
		);
	} );

	QUnit.test( 'getSettings.userSettings', function ( assert ) {
		mw.user.options.set(
			'global-watchlist-options',
			'{"sites":["foo.bar.org","baz.qux.org"],"anonfilter":2,"botfilter":2,"minorfilter":2,"confirmallsites":false,"fastmode":true,"grouppage":true,"showtypes":["edit","log"],"version":1}'
		);
		var notificationManager = new FakeNotificationManager();

		var settings = getSettings( notificationManager );

		var expectedSettings = {
			siteList: [ 'foo.bar.org', 'baz.qux.org' ],
			anon: 2,
			bot: 2,
			minor: 2,
			confirmAllSites: false,
			fastMode: true,
			groupPage: true,
			showEdits: true,
			showLogEntries: true,
			showNewPages: false,

			// Based on the others or the config
			lang: 'en',
			watchlistQueryProps: 'ids|title|flags|loginfo',
			watchlistQueryTypes: 'edit|log',
			watchlistQueryShow: '!anon|!bot|!minor',
			wikibaseLabelNamespaces: [ 0 ]
		}

		assert.deepEqual(
			settings,
			expectedSettings,
			'When the user has valid settings set, they are used'
		);
		assert.strictEqual(
			notificationManager.onGetOptionsErrorCalled,
			false,
			'No errors occurred fetching user options'
		);
	} );

	QUnit.test( 'getSettings.invalidSettings', function ( assert ) {
		mw.user.options.set( 'global-watchlist-options', 'notValidJson' );
		var notificationManager = new FakeNotificationManager();

		var settings = getSettings( notificationManager );

		assert.deepEqual(
			settings,
			defaultSettings,
			'When the user has invalid settings set, the defaults are used'
		);
		assert.strictEqual(
			notificationManager.onGetOptionsErrorCalled,
			true,
			'User is warned of errors in their settings'
		);
	} );

}() );
