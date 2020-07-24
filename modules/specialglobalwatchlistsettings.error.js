/*
 * Javascript for Special:GlobalWatchlistSettings when the user has settings saved,
 * and they couldn't be parsed
 */
( function () {
	'use strict';

	// On ready initialization
	$( function () {
		var GlobalWatchlistDebugger = require( './ext.globalwatchlist.debug.js' ),
			NotificationManager = require( './ext.globalwatchlist.notifications.js' );
		var globalWatchlistDebug = new GlobalWatchlistDebugger();
		var notifications = new NotificationManager( globalWatchlistDebug );

		notifications.onGetOptionsError( 'Problem parsing stored settings' );
	} );
}() );
