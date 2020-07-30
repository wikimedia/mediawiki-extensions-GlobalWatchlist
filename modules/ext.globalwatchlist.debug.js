/**
 * Debug interface to avoid using console.log directly everywhere
 *
 * At least for now, we need client-side debugging. All messages sent here
 * are added to the debugLog, and those below the configured debugLevel are
 * also printed to the console.
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
 * @param {Object} error If an instanceof `Error`, it will be the error that is thrown, otherwise
 *                 a new Error object will be constructed here
 */
GlobalWatchlistDebugger.prototype.error = function ( info, error ) {
	var errorMessage,
		errorToThrow;

	if ( error instanceof Error ) {
		errorMessage = error.toString();
		errorToThrow = error; // Throw the original error so we get its stack trace, etc.
	} else {
		errorMessage = error; // use JSON.stringify in info()
		errorToThrow = new Error( 'GlobalWatchlistError: ' + info + ' - ' + error );
	}

	this.info( 'ERROR: ' + info, errorMessage, 0 );

	/* eslint-disable-next-line no-alert */
	alert( 'GlobalWatchlist error, please check the console!' );

	throw errorToThrow;
};

module.exports = GlobalWatchlistDebugger;
