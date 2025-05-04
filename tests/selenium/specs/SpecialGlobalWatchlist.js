'use strict';

const assert = require( 'assert' ),
	Api = require( 'wdio-mediawiki/Api' ),
	LoginPage = require( 'wdio-mediawiki/LoginPage' ),
	GlobalWatchlist = require( '../pageobjects/GlobalWatchlist.page' ),
	Util = require( 'wdio-mediawiki/Util' );

describe( 'Special:GlobalWatchlist', () => {
	let pageTitle;

	before( async () => {
		await LoginPage.loginAdmin();

		pageTitle = Util.getTestString( 'GlobalWatchlist-page-' );

		// We are using the same user (the default admin) for both the edit and the
		// viewing of Special:GlobalWatchlist, to avoid needing to create a new account.
		// So, after the edit is made we need to reset the notification timestamp to
		// beforehand, so that the edit is shown on Special:GlobalWatchlist, which
		// only shows unseen changes (unlike the default for Special:Watchlist).
		const bot = await Api.bot();
		await bot.edit(
			pageTitle,
			'summary',
			{ watchlist: 'watch' }
		);
		await bot.request( {
			action: 'setnotificationtimestamp',
			timestamp: '2021-01-01T00:00:00.000Z',
			titles: pageTitle,
			token: bot.editToken
		} );

		// This cookie allows us to use the `displayversion` parameter to test both the
		// OOUI and the Vue versions of the display even when $wgGlobalWatchlistDevMode is
		// false, so that we don't need to have it by true by default.
		await browser.setCookies( {
			name: 'mw-globalwatchlist-selenium-test',
			value: '1'
		} );
	} );

	it( 'works with normal display', async () => {
		await GlobalWatchlist.openDisplay( 'normal' );

		const content = await GlobalWatchlist.content;

		// OOUI button should be loaded
		const element = await content.$( '#ext-globalwatchlist-refresh' );
		await expect( element ).toHaveElementClassContaining( 'oo-ui-widget' );

		// Watchlist should be shown, and include the relevant pageTitle (might not
		// happen immediately, needs to load)
		assert(
			await content.$( '.ext-globalwatchlist-site' ).waitForExist(),
			'Watchlist entries load'
		);
		// In the first site, in the first entry, the first link is to the page
		assert.strictEqual(
			await content.$( '.ext-globalwatchlist-site li a' ).getText(),
			pageTitle,
			'Edited title should be shown'
		);

	} );

	it( 'works with vue display', async () => {
		GlobalWatchlist.openDisplay( 'vue' );

		const content = await GlobalWatchlist.content;

		// WVUI button should be loaded
		const element = await content.$( '#ext-globalwatchlist-vue-toolbar button' );
		await expect( element ).toHaveElementClassContaining( 'wvui-toggle-button' );

		// Watchlist should be shown, and include the relevant pageTitle (might not
		// happen immediately, needs to load)
		assert(
			await content.$( '.ext-globalwatchlist-vue-site' ).waitForExist(),
			'Watchlist entries load'
		);
		// In the first site, in the first entry, the first link is to the page
		assert.strictEqual(
			await content.$( '.ext-globalwatchlist-vue-site li a' ).getText(),
			pageTitle,
			'Edited title should be shown'
		);

	} );

} );
