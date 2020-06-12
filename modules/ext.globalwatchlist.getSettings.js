/**
 * Shared module to retrieve the current settings
 *
 * Currently uses window.GlobalWatchlistSettings,
 * will eventually use user options
 *
 * Used for both the settings page and Special:GlobalWatchlist
 */
function GlobalWatchlistGetSettings() {
	var userSettings = window.GlobalWatchlistSettings;

	if ( userSettings === undefined ) {
		// Defaults
		userSettings = {
			sites: [ 'en.wikipedia.org' ],
			anonfilter: 0,
			botfilter: 0,
			minorfilter: 0,
			confirmallsites: true,
			fastmode: false,
			grouppage: true,
			showtypes: [ 'edit', 'log', 'new' ]
		};
	}

	return {
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
}

module.exports = GlobalWatchlistGetSettings;