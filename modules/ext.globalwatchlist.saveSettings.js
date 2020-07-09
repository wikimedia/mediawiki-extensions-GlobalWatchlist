/**
 * Save the user's settings
 *
 * @param {object} GlobalWatchlistDebug debugger
 * @param {object} newSettings
 * @return {jQuery.Promise} promise that either resolves successfully or rejects with the error
 */
function GlobalWatchlistSaveSettings( GlobalWatchlistDebug, newSettings ) {
	var params = {
		action: 'globalwatchlistsettings',
		errorformat: 'raw',
		formatversion: 2,
		sites: newSettings.sites,
		anonfilter: newSettings.anonFilter,
		botfilter: newSettings.botFilter,
		minorfilter: newSettings.minorFilter,
		confirmallsites: newSettings.confirmAllSites,
		fastmode: newSettings.fastMode,
		grouppage: newSettings.groupPage,
		showtypes: []
	};

	if ( newSettings.showEdits ) {
		params.showtypes.push( 'edit' );
	}
	if ( newSettings.showLogEntries ) {
		params.showtypes.push( 'log' );
	}
	if ( newSettings.showNewPages ) {
		params.showtypes.push( 'new' );
	}

	GlobalWatchlistDebug.info( 'SaveSettings - parameters', params, 1 );

	// Not loaded as a dependency in extension.json because it isn't needed until the user
	// wants to save settings, and shouldn't delay the initial startup
	return mw.loader.using( 'mediawiki.api' ).then( function () {
		return new mw.Api().postWithEditToken( params );
	} );
}

module.exports = GlobalWatchlistSaveSettings;
