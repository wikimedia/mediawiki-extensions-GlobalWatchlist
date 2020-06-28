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
	this.debug = GlobalWatchlistDebug;
}

/**
 * Notify that settings were saved successfully
 *
 * @param {object} saveData
 */
GlobalWatchlistNotificationManager.prototype.onSettingsSaved = function ( saveData ) {
	this.debug.info( 'SettingsSaved - successful', saveData, 1 );

	mw.notify(
		mw.msg( 'globalwatchlist-notify-settingssaved' ),
		{
			title: mw.msg( 'globalwatchlist-notify-heading' ),
			autoHide: false
		}
	);
};

/**
 * Notify that settings were not saved
 *
 * @param {object} failureCode
 * @param {object} failureData
 */
GlobalWatchlistNotificationManager.prototype.onSettingsFailed = function ( failureCode, failureData ) {
	this.debug.info( 'SettingsFailed - error', [ failureCode, failureData ], 1 );

	if ( failureCode === 'globalwatchlist-invalid-settings' ) {
		this.onInvalidSettings( failureData );
	} else {
		// Something else happened
		mw.notify(
			mw.msg( 'globalwatchlist-notify-savingfailed' ),
			{
				title: mw.msg( 'globalwatchlist-notify-heading' ),
				autoHide: false
			}
		);
	}
};

/**
 * Alert the user to issues with their selected settings
 *
 * @param {object} failureData
 */
GlobalWatchlistNotificationManager.prototype.onInvalidSettings = function ( failureData ) {
	var errorCodes = failureData.errors[ 0 ].data,
		errorList = [];

	// Can't use Object.values, not available in internet explorer
	Object.keys( errorCodes ).forEach( function ( index ) {
		var msg, li,
			code = errorCodes[ index ];
		// Errors used:
		// * globalwatchlist-settings-error-anon-bot
		// * globalwatchlist-settings-error-anon-minor
		// * globalwatchlist-settings-error-no-sites
		// * globalwatchlist-settings-error-no-types
		msg = mw.msg( 'globalwatchlist-settings-error-' + code );
		li = '<li>' + msg + '</li>';
		errorList.push( li );
	} );

	OO.ui.alert(
		new OO.ui.HtmlSnippet(
			'<ul>' + errorList.join( '' ) + '</ul>'
		),
		{
			title: mw.msg( 'apierror-globalwatchlist-invalid-settings' ),
			size: 'large'
		}
	);
}

module.exports = GlobalWatchlistNotificationManager;