/**
 * Debug interface to avoid using console.log directly everywhere
 *
 * At least for now, we need client-side debugging. All messages sent here
 * are added to the debugLog, and those below the configured debugLevel are
 * also printed to the console. , so keep logging everything
 *
 * When a message is sent to the debugger, a "level" is also specified. Lower numbers
 * correspond to more import messages (eg errors are always 0). If the level is below
 * the debugLevel set, it is also logged to the console.
 *
 * @class GlobalWatchlistDebugger
 * @constructor
 *
 * @param {number} [debugLevel] level below which messages should be sent to the console.
 */
function GlobalWatchlistDebugger( debugLevel ) {
	// Log of all messages
	this.debugLog = [];

	// Level below which to send to console
	this.debugLevel = debugLevel || 100;
}

/**
 * @param {string} key
 * @param {Object} msg
 * @param {number} level
 */
GlobalWatchlistDebugger.prototype.info = function ( key, msg, level ) {
	if ( this.debugLevel > level ) {
		/* eslint-disable-next-line no-console */
		console.log( 'GlobalWatchlist@' + key );

		/* eslint-disable-next-line no-console */
		console.log( msg );
	}

	this.debugLog.push(
		this.debugLog.length +
		': ' +
		key +
		'\t' +
		JSON.stringify( msg )
	);
};

/**
 * @param {string} info
 * @param {Object} error
 */
GlobalWatchlistDebugger.prototype.error = function ( info, error ) {
	this.info( 'ERROR: ' + info, error, 0 );

	/* eslint-disable-next-line no-alert */
	alert( 'GlobalWatchlist error, please check the console!' );

	throw new Error( 'Error: ' + info + ' - ' + error );
};

module.exports = GlobalWatchlistDebugger;
