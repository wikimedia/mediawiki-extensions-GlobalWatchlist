/**
 * Represents a base entry of any type that is shown
 *
 * @class GlobalWatchlistEntryBase
 * @abstract
 *
 * @param {Object} info Should have all of the properties that are documented below
 */
function GlobalWatchlistEntryBase( info ) {
	/**
	 * @property {string} entryType Either 'edit' or 'log'
	 */
	this.entryType = info.entryType;

	/**
	 * @property {string|boolean} timestamp Either `false` or a string to display
	 */
	this.timestamp = info.timestamp;

	/**
	 * @property {string|null} timestampTitle Either `null` for single changes, or
	 *   a string to display as a tooltip for grouped edits
	 */
	this.timestampTitle = info.timestampTitle;

	/**
	 * @property {string|boolean} expiry Either `false` or a string explaining when the
	 *   watchlist entry expires
	 */
	this.expiry = info.expiry;

	/**
	 * @property {string|boolean} flags Either `false` or a string of flags to show
	 */
	this.flags = info.flags;

	/**
	 * @property {string} userDisplay Raw HTML to show for the user(s) that made this entry
	 */
	this.userDisplay = info.userDisplay;

	/**
	 * @property {string} title Title of the entry
	 */
	this.title = info.title;

	/**
	 * @property {string} titleMsg Display text for the title of this entry, might be
	 *   changed by {@link GlobalWatchlistWikibaseHandler}
	 */
	this.titleMsg = info.title;

	/**
	 * @property {number} ns Namespace for this entry, can be used by
	 *   {@link GlobalWatchlistWikibaseHandler} to decide if a label should be added.
	 */
	this.ns = info.ns;

	/**
	 * @property {string|boolean} commentDisplay Either `false` or a raw HTML string for
	 *   the parsed comment that should be shown
	 */
	this.commentDisplay = info.commentDisplay;

	/**
	 * @property {string|boolean} tagsDisplay Either `false` or a raw HTML string for the
	 *   parsed tags information that should be shown
	 */
	this.tagsDisplay = info.tagsDisplay;
}

module.exports = GlobalWatchlistEntryBase;
