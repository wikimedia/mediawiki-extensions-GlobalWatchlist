/**
 * Used for the settings page to alert the result of an attempted save
 *
 * @private
 * @class GlobalWatchlistNotificationManager
 * @constructor
 *
 * TODO replace uses of debugger.error with notification manager
 * Used for both the settings page and Special:GlobalWatchlist
 *
 * @param {object} GlobalWatchlistDebug debugger
 */
function GlobalWatchlistNotificationManager( GlobalWatchlistDebug ) {
	this.debugger = GlobalWatchlistDebug;
}

/**
 * Notify that settings were saved successfully
 *
 * @param {object} saveData
 */
GlobalWatchlistNotificationManager.prototype.onSettingsSaved = function ( saveData ) {
	this.debugger.info( 'SettingsSaved - successful', saveData, 1 );

	mw.notify(
		mw.msg( 'globalwatchlist-notify-settingssaved' ),
		{
			title: 'Global Watchlist',
			autoHide: false
		}
	);
};

/**
 * Notify that settings were not saved
 *
 * @param {object} failureData
 */
GlobalWatchlistNotificationManager.prototype.onSettingsFailed = function ( failureData ) {
	// TODO handle validation failures in failureData once validatio is added
	this.debugger.info( 'SettingsFailed - error', failureData, 1 );

	mw.notify(
		mw.msg( 'globalwatchlist-notify-savingfailed' ),
		{
			title: 'Global Watchlist',
			autoHide: false
		}
	);
};

module.exports = GlobalWatchlistNotificationManager;