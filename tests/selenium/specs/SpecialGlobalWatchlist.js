'use strict';

const Api = require( 'wdio-mediawiki/Api' ),
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
	} );

	it( 'works with normal display', async () => {
		await GlobalWatchlist.openDisplay( 'normal' );

		const content = await GlobalWatchlist.content;

		// OOUI button should be loaded
		const element = await content.$( '#ext-globalwatchlist-refresh' );
		await expect( element ).toHaveAttribute( 'class', expect.stringContaining( 'oo-ui-widget' ) );

		// Watchlist should be shown, and include the relevant pageTitle (might not
		// happen immediately, needs to load)
		await content.$( '.ext-globalwatchlist-site' ).waitForExist();
		await expect( await content.$( '.ext-globalwatchlist-site' ) ).toExist(
			{ message: 'Watchlist entries load' }
		);
		// In the first site, in the first entry, the first link is to the page
		await expect( await content.$( '.ext-globalwatchlist-site li a' ) ).toHaveText(
			pageTitle,
			{ message: 'Edited title should be shown' }
		);
	} );

} );
