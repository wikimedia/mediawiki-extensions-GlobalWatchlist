/**
 * Used for the settings page to alert the result of an attempted save
 *
 * @class GlobalWatchlistNotificationManager
 * @constructor
 *
 * TODO replace uses of debugger.error with notification manager
 * Used for both the settings page and Special:GlobalWatchlist
 *
 * @param {Object} globalWatchlistDebug debugger
 */
function GlobalWatchlistNotificationManager( globalWatchlistDebug ) {
	this.debug = globalWatchlistDebug;
}

/**
 * Confirm with the user that they want to mark all sites as seen
 *
 * @param {Object} callback if sites should all be marked as seen
 */
GlobalWatchlistNotificationManager.prototype.onMarkAllSitesSeen = function ( callback ) {
	var that = this;
	OO.ui.confirm(
		mw.msg( 'globalwatchlist-markseen-allconfirm' )
	).done(
		function ( confirmed ) {
			if ( confirmed ) {
				that.debug.info( 'MarkAllSitesSeen', 'Confirmed', 1 );
				callback();
			} else {
				that.debug.info( 'MarkAllSitesSeen', 'not confirmed, cancelling', 1 );
			}
		}
	);
};

/**
 * Notify that settings were saved successfully
 *
 * @param {Object} saveData
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
 * @param {Object} failureCode
 * @param {Object} failureData
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
				autoHide: false,
				type: "error"
			}
		);
	}
};

/**
 * Alert the user to issues with their selected settings
 *
 * @param {Object} failureData
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
};

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
