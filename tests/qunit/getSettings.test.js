( function () {
	const getSettings = require( 'ext.globalwatchlist.specialglobalwatchlist/getSettings.js' );

	function FakeDebugger() {
		this.infoCalled = false;

		// eslint-disable-next-line no-unused-vars
		this.info = function ( unused, alsoUnused ) {
			this.infoCalled = true;
		};
	}

	const defaultSettings = {
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

		lang: null,
		// Based on the others or the config
		watchlistQueryProps: 'ids|title|flags|loginfo|parsedcomment|timestamp|user|tags|expiry',
		watchlistQueryTypes: 'edit|new|log',
		watchlistQueryShow: 'unread'
	};

	QUnit.module( 'ext.globalwatchlist.specialglobalwatchlist/getSettings', QUnit.newMwEnvironment( {
		config: {
			wgServer: '//en.wikipedia.org',
			wgUserLanguage: 'en'
		}
	} ) );

	QUnit.test( 'getSettings.noSettings', ( assert ) => {
		mw.user.options.set( 'global-watchlist-options', null );
		const fakeDebugInstance = new FakeDebugger();

		const settings = getSettings( fakeDebugInstance );

		assert.deepEqual(
			settings,
			defaultSettings,
			'When the user has no settings set, the defaults are used'
		);
		assert.strictEqual(
			fakeDebugInstance.infoCalled,
			false,
			'No errors occurred fetching user options'
		);
	} );

	QUnit.test( 'getSettings.userSettings', ( assert ) => {
		mw.user.options.set(
			'global-watchlist-options',
			'{"sites":["foo.bar.org","baz.qux.org"],"anonfilter":2,"botfilter":2,"minorfilter":2,"confirmallsites":false,"fastmode":true,"grouppage":true,"showtypes":["edit","log"],"version":1}'
		);
		const fakeDebugInstance = new FakeDebugger();

		const settings = getSettings( fakeDebugInstance );

		const expectedSettings = {
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

			lang: null,
			// Based on the others or the config
			watchlistQueryProps: 'ids|title|flags|loginfo',
			watchlistQueryTypes: 'edit|log',
			watchlistQueryShow: 'unread|!anon|!bot|!minor'
		};

		assert.deepEqual(
			settings,
			expectedSettings,
			'When the user has valid settings set, they are used'
		);
		assert.strictEqual(
			fakeDebugInstance.infoCalled,
			false,
			'No errors occurred fetching user options'
		);
	} );

	QUnit.test( 'getSettings.invalidSettings', ( assert ) => {
		mw.user.options.set( 'global-watchlist-options', 'notValidJson' );
		const fakeDebugInstance = new FakeDebugger();

		const settings = getSettings( fakeDebugInstance );

		assert.deepEqual(
			settings,
			defaultSettings,
			'When the user has invalid settings set, the defaults are used'
		);

		// Technically, the warning is the result of the mw.loader.load call, but
		// if globalWatchlistDebug.info was called then mw.loader.load should also have
		// been called
		assert.strictEqual(
			fakeDebugInstance.infoCalled,
			true,
			'User is warned of errors in their settings'
		);
	} );

}() );
