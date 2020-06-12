/**
 * At least for now, we need client-side debugging, so keep logging everything
 *
 * Used for both the settings page and Special:GlobalWatchlist
 */
var GlobalWatchlistDebug = {
	debugLog: [],
	debugLevel: 100,
	info: function ( key, msg, level ) {
		if ( GlobalWatchlistDebug.debugLevel >= level ) {
			/* eslint-disable-next-line no-console */
			console.log( 'GlobalWatchlist@' + key );

			/* eslint-disable-next-line no-console */
			console.log( msg );
		}

		GlobalWatchlistDebug.debugLog.push(
			GlobalWatchlistDebug.debugLog.length
			+ ': '
			+ key
			+ '\t'
			+ JSON.stringify( msg )
		);
	},
	error: function ( info, error ) {
		GlobalWatchlistDebug.info( 'ERROR: ' + info, error, 0 );

		/* eslint-disable-next-line no-alert */
		alert( 'GlobalWatchlist error, please check the console!' );

		throw new Error( 'Error: ' + info + ' - ' + error );
	}
};

module.exports = GlobalWatchlistDebug;