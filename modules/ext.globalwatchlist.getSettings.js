/**
 * Shared module to retrieve the current settings
 *
 * Currently uses window.GlobalWatchlistSettings,
 * will eventually use user options
 *
 * Used for both the settings page and Special:GlobalWatchlist
 */
/**
 * @param {int} setting Current stored level
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
 * @param {object} notificationManager instance of of GlobalWatchlistNotificationManager
 * @return {object}
 */
function GlobalWatchlistGetSettings( notificationManager ) {
	// Note: this must be the same key as is used in the settings manager
	var userOptions = mw.user.options.get( 'global-watchlist-options' ),
		userSettings = {},
		config = {},
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
		},
		namespaceIds = mw.config.get( 'wgNamespaceIds' );

	if ( userOptions === null ) {
		config = defaultConfig;
	} else {
		try {
			userSettings = JSON.parse( userOptions );
			config = {
				siteList: userSettings.sites,
				anon: userSettings.anonfilter,
				bot: userSettings.botfilter,
				minor: userSettings.minorfilter,
				confirmAllSites: userSettings.confirmallsites,
				fastMode: userSettings.fastmode,
				groupPage: userSettings.grouppage,
				showEdits: userSettings.showtypes.indexOf( 'edit' ) > -1,
				showLogEntries: userSettings.showtypes.indexOf( 'log' ) > -1,
				showNewPages: userSettings.showtypes.indexOf( 'new' ) > -1,
			};
		} catch ( e ) {
			notificationManager.onGetOptionsError( e );

			config = defaultConfig;
		}
	}

	// The following settings are extracted from the user's set configuration or the defaults
	// or are not set in the options
	config.lang = mw.config.get( 'wgUserLanguage' );

	config.watchlistQueryProps = config.fastMode ?
		'ids|title|flags|loginfo' :
		'ids|title|flags|loginfo|parsedcomment|user|tags'

	config.watchlistQueryTypes = (
		( config.showEdits ? 'edit|' : '' ) +
		( config.showNewPages ? 'new|' : '' ) +
		( config.showLogEntries ? 'log|' : '' )
	).replace( /\|+$/, '' );

	// TODO add `unread` once ready
	config.watchlistQueryShow = [
		getQueryFlag( config.anon, 'anon' ),
		getQueryFlag( config.bot, 'bot' ),
		getQueryFlag( config.minor, 'minor' )
	].join( '' ).replace( /^\|+/, '' );

	config.wikibaseLabelNamespaces = [ 0 ];
	if ( namespaceIds.property !== undefined ) {
		config.wikibaseLabelNamespaces.push( namespaceIds.property );
	}
	if ( namespaceIds.lexeme !== undefined ) {
		config.wikibaseLabelNamespaces.push( namespaceIds.lexeme );
	}

	return config;
}

module.exports = GlobalWatchlistGetSettings;
