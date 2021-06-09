'use strict';

const assert = require( 'assert' ),
	Api = require( 'wdio-mediawiki/Api' ),
	LoginPage = require( 'wdio-mediawiki/LoginPage' ),
	GlobalWatchlist = require( '../pageobjects/GlobalWatchlist.page' ),
	Util = require( 'wdio-mediawiki/Util' );

describe( 'Special:GlobalWatchlist', function () {
	let pageTitle;

	before( () => {
		LoginPage.loginAdmin();

		pageTitle = Util.getTestString( 'GlobalWatchlist-page-' );

		// We are using the same user (the default admin) for both the edit and the
		// viewing of Special:GlobalWatchlist, to avoid needing to create a new account.
		// So, after the edit is made we need to reset the notification timestamp to
		// beforehand, so that the edit is shown on Special:GlobalWatchlist, which
		// only shows unseen changes (unlike the default for Special:Watchlist).
		// We need to use browser.call with the async function instead of making this
		// entire before handler async because that would break the LoginPage.loginAdmin()
		// call due to Selenium's asyncronous execution model.
		browser.call( async () => {
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
		} );
	} );

	it( 'works with normal display', function () {
		GlobalWatchlist.openDisplay( 'normal' );

		const content = GlobalWatchlist.content;

		// OOUI button should be loaded
		assert(
			content.$( '#ext-globalwatchlist-refresh' )
				.getAttribute( 'class' )
				.includes( 'oo-ui-widget' )
		);

		// Watchlist should be shown, and include the relevant pageTitle (might not
		// happen immediately, needs to load)
		assert(
			content.$( '.ext-globalwatchlist-site' ).waitForExist(),
			'Watchlist entries load'
		);
		// In the first site, in the first entry, the first link is to the page
		assert.strictEqual(
			content.$( '.ext-globalwatchlist-site li a' ).getText(),
			pageTitle,
			'Edited title should be shown'
		);

	} );

	it( 'works with vue display', function () {
		GlobalWatchlist.openDisplay( 'vue' );

		const content = GlobalWatchlist.content;

		// WVUI button should be loaded
		assert(
			content.$( '#ext-globalwatchlist-vue-toolbar button' )
				.getAttribute( 'class' )
				.includes( 'wvui-button' )
		);

		// Watchlist should be shown, and include the relevant pageTitle (might not
		// happen immediately, needs to load)
		assert(
			content.$( '.ext-globalwatchlist-vue-site' ).waitForExist(),
			'Watchlist entries load'
		);
		// In the first site, in the first entry, the first link is to the page
		assert.strictEqual(
			content.$( '.ext-globalwatchlist-vue-site li a' ).getText(),
			pageTitle,
			'Edited title should be shown'
		);

	} );

} );
