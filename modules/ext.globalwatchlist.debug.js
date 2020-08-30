/**
 * Debug interface to avoid using console.log directly everywhere
 *
 * At least for now, we need client-side debugging. Messages sent here
 * are added to the debugLog. If wgGlobalWatchlistDevMode is true, they are
 * also printed to the console.
 *
 * @class GlobalWatchlistDebugger
 * @constructor
 */
function GlobalWatchlistDebugger() {
	// Log of all messages
	this.debugLog = [];

	this.sendToConsole = mw.config.get( 'wgGlobalWatchlistDevMode' );
}

/**
 * @param {string} msg
 * @param {Object} [extraInfo]
 */
GlobalWatchlistDebugger.prototype.info = function ( msg, extraInfo ) {
	if ( this.sendToConsole ) {
		/* eslint-disable-next-line no-console */
		console.log( 'GlobalWatchlist@' + msg );

		if ( extraInfo ) {
			/* eslint-disable-next-line no-console */
			console.log( extraInfo );
		}
	}

	var entry = this.debugLog.length + ': ' + msg;

	if ( extraInfo ) {
		entry += '\t' + JSON.stringify( extraInfo );
	}

	this.debugLog.push( entry );
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

	this.info( 'ERROR: ' + info, errorMessage );

	/* eslint-disable-next-line no-alert */
	alert( 'GlobalWatchlist error, please check the console!' );

	/* eslint-disable-next-line no-console */
	console.error( errorToThrow );
};

module.exports = GlobalWatchlistDebugger;
