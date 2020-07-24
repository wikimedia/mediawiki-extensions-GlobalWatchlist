/**
 * User notifications
 *
 * @class GlobalWatchlistNotificationManager
 * @constructor
 *
 * TODO remove this - onGetOptionsError doesn't need its own class
 *
 * @param {Object} globalWatchlistDebug debugger
 */
function GlobalWatchlistNotificationManager( globalWatchlistDebug ) {
	this.debug = globalWatchlistDebug;
}

/**
 * Alert the user with issues with their saved settings and that the defaults with be used
 *
 * @param {Object} e The exception
 */
GlobalWatchlistNotificationManager.prototype.onGetOptionsError = function ( e ) {
	this.debug.info( 'GetOptions - error', e, 1 );

	OO.ui.alert(
		mw.msg( 'globalwatchlist-getoptions-error' )
	);
};

module.exports = GlobalWatchlistNotificationManager;
