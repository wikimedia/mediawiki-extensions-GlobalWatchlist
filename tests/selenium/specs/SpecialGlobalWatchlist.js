import { createApiClient } from 'wdio-mediawiki/Api.js';
import LoginPage from 'wdio-mediawiki/LoginPage.js';
import GlobalWatchlist from '../pageobjects/GlobalWatchlist.page.js';
import { getTestString } from 'wdio-mediawiki/Util.js';

describe( 'Special:GlobalWatchlist', () => {
	let pageTitle;

	before( async () => {
		await LoginPage.loginAdmin();

		pageTitle = getTestString( 'GlobalWatchlist-page-' );

		// We are using the same user (the default admin) for both the edit and the
		// viewing of Special:GlobalWatchlist, to avoid needing to create a new account.
		// So, after the edit is made we need to reset the notification timestamp to
		// beforehand, so that the edit is shown on Special:GlobalWatchlist, which
		// only shows unseen changes (unlike the default for Special:Watchlist).
		const apiClient = await createApiClient();
		const editToken = await apiClient.getEditToken();

		// Sent as a raw request because apiClient.edit() cannot pass watchlist.
		await apiClient.request( {
			action: 'edit',
			title: pageTitle,
			text: 'Page content for the GlobalWatchlist browser test',
			summary: 'summary',
			watchlist: 'watch',
			token: editToken
		} );
		await apiClient.request( {
			action: 'setnotificationtimestamp',
			timestamp: '2021-01-01T00:00:00.000Z',
			titles: pageTitle,
			token: editToken
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
