/*
 * Extended version of SiteBase.js for use in Vue version of Special:GlobalWatchlist
 */

var GlobalWatchlistSiteBase = require( './SiteBase.js' );

/**
 * Represents a specific site, excluding the display (used in Vue display)
 *
 * @class GlobalWatchlistSiteVue
 * @extends GlobalWatchlistSiteBase
 *
 * @constructor
 * @param {GlobalWatchlistDebugger} globalWatchlistDebug Debugger instance to log to
 * @param {GlobalWatchlistLinker} linker Linker instance to use
 * @param {Object} config User configuration
 * @param {mw.ForeignApi} api Instance of mw.ForeignApi for this site
 * @param {GlobalWatchlistWatchlistUtils} watchlistUtils WatchlistUtils instance for this site
 * @param {string} urlFragment string for which site this represents
 */
function GlobalWatchlistSiteVue(
	globalWatchlistDebug,
	linker,
	config,
	api,
	watchlistUtils,
	urlFragment
) {
	GlobalWatchlistSiteVue.super.call(
		this,
		globalWatchlistDebug,
		linker,
		config,
		api,
		watchlistUtils,
		urlFragment
	);

	// Entries to be used for EntryRow.vue
	this.entries = [];
}

OO.inheritClass( GlobalWatchlistSiteVue, GlobalWatchlistSiteBase );

/**
 * Update this.entries for the latest entries to show
 *
 * @param {GlobalWatchlistEntryBase[]} summary What should be rendered
 */
GlobalWatchlistSiteVue.prototype.renderWatchlist = function ( summary ) {
	this.entries = summary;
	this.entries.forEach( function ( entry ) {
		entry.pageWatched = true;
	} );
};

/**
 * Update display after marking a site as seen
 */
GlobalWatchlistSiteVue.prototype.afterMarkAsSeen = function () {
	this.debug( 'afterMarkAsSeen - Finished for: ' + this.site );
	this.entries = [];
};

/**
 * Update entry.pageWatched specific title
 *
 * @param {string} pageTitle Title of the page that was unwatched/rewatched.
 * @param {boolean} unwatched Whether the page was unwatched
 */
GlobalWatchlistSiteVue.prototype.processUpdateWatched = function ( pageTitle, unwatched ) {
	this.debug(
		'Processing after ' + ( unwatched ? 'unwatching' : 'rewatching' ) + ': ' + pageTitle
	);

	var pageWatched = !unwatched;

	this.entries.forEach( function ( entry ) {
		if ( entry.title === pageTitle ) {
			entry.pageWatched = pageWatched;
		}
	} );
};

module.exports = GlobalWatchlistSiteVue;
