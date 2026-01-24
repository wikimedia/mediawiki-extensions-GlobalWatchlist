/*
 * Retrieve current user settings to use, or the defaults
 *
 * Used for both versions of Special:GlobalWatchlist
 */
/**
 * @private
 * @param {number} setting Current stored level
 * @param {string} flag
 * @return {string}
 */
function getQueryFlag( setting, flag ) {
	if ( setting === 1 ) {
		return ( '|' + flag );
	}
	if ( setting === 2 ) {
		return ( '|!' + flag );
	}
	return '';
}

/**
 * @private
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug
 * @return {Object}
 */
function globalWatchlistGetSettings( globalWatchlistDebug ) {
	// Note: this must be the same key as SettingsManager::PREFERENCE_NAME
	const userOptions = mw.user.options.get( 'global-watchlist-options' ),
		defaultConfig = {
			siteList: [
				mw.config.get( 'wgServer' ).replace( /.*?\/\//, '' )
			],
			anon: 0,
			bot: 0,
			minor: 0,
			confirmAllSites: true,
			fastMode: false,
			groupPage: true,
			showEdits: true,
			showLogEntries: true,
			showNewPages: true
		};

	let config;
	if ( userOptions === null ) {
		config = defaultConfig;
	} else {
		try {
			const userSettings = JSON.parse( userOptions );
			config = {
				siteList: userSettings.sites,
				anon: userSettings.anonfilter,
				bot: userSettings.botfilter,
				minor: userSettings.minorfilter,
				confirmAllSites: userSettings.confirmallsites,
				fastMode: userSettings.fastmode,
				groupPage: userSettings.grouppage,
				showEdits: userSettings.showtypes.includes( 'edit' ),
				showLogEntries: userSettings.showtypes.includes( 'log' ),
				showNewPages: userSettings.showtypes.includes( 'new' )
			};
		} catch ( e ) {
			// Not using .error since it can be recovered from, and the user notice
			// should be the one in getsettingserror rather than a plain `alert` call
			globalWatchlistDebug.info( 'GetSettings - error', e );

			// Alert the user
			mw.loader.load( 'ext.globalwatchlist.getsettingserror' );

			config = defaultConfig;
		}
	}

	// The following settings are extracted from the user's set configuration or the defaults
	// or are not set in the options
	config.lang = mw.config.get( 'wgUserLanguage' );

	config.watchlistQueryProps = config.fastMode ?
		'ids|title|flags|loginfo' :
		'ids|title|flags|loginfo|parsedcomment|timestamp|user|tags|expiry';

	config.watchlistQueryTypes = (
		( config.showEdits ? 'edit|' : '' ) +
		( config.showNewPages ? 'new|' : '' ) +
		( config.showLogEntries ? 'log|' : '' )
	).replace( /\|+$/, '' );

	config.watchlistQueryShow = [
		'unread',
		getQueryFlag( config.anon, 'anon' ),
		getQueryFlag( config.bot, 'bot' ),
		getQueryFlag( config.minor, 'minor' )
	].join( '' ).replace( /^\|+/, '' );

	return config;
}

module.exports = globalWatchlistGetSettings;
