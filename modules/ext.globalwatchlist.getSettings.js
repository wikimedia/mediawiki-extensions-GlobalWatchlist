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
 * @return {object}
 */
function GlobalWatchlistGetSettings() {
	var userSettings = window.GlobalWatchlistSettings,
		config = {};

	if ( userSettings === undefined ) {
		// Defaults
		userSettings = {
			sites: [
				mw.config.get( 'wgServerName' )
			],
			anonfilter: 0,
			botfilter: 0,
			minorfilter: 0,
			confirmallsites: true,
			fastmode: false,
			grouppage: true,
			showtypes: [ 'edit', 'log', 'new' ]
		};
	}

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
		watchlistQueryProps: userSettings.fastmode
			? 'ids|title|flags|loginfo'
			: 'ids|title|flags|loginfo|parsedcomment|user|tags',
	};

	config['watchlistQueryTypes'] = (
		( config['showEdits'] ? 'edit|' : '' ) +
		( config['showNewPages'] ? 'new|' : '' ) +
		( config['showLogEntries'] ? 'log|' : '' )
	).replace( /\|+$/, '' );

	// TODO add `unread` once ready
	config['watchlistQueryShow'] = [
		getQueryFlag( config['anon'], 'anon' ),
		getQueryFlag( config['bot'], 'bot' ),
		getQueryFlag( config['minor'], 'minor' )
	].join( '' ).replace( /^\|+/, '' );

	return config;
}

module.exports = GlobalWatchlistGetSettings;