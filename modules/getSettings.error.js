/*
 * Javascript to alert the user that there was a problem parsing their stored settings
 *
 * - For Special:GlobalWatchlistSettings when filling in the defaults of the HTMLForm from saved
 *   settings, but the PHP code had a problem decoding the settings (see FormatJson::parse)
 *
 * - For Special:GlobalWatchlist when the user has settings saved to use, but the JavaScript in
 *   getSettings.js couldn't parse the JSON
 */
( function () {
	'use strict';

	// On ready initialization
	$( function () {
		OO.ui.alert(
			mw.msg( 'globalwatchlist-getoptions-error' )
		);
	} );
}() );
