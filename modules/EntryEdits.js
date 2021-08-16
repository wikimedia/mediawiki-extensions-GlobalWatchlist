/**
 * Extended version of GlobalWatchlistEntryBase for edits
 */

var GlobalWatchlistEntryBase = require( './EntryBase.js' );

/**
 * Represents one or more edits being shown together
 *
 * @class GlobalWatchlistEntryEdits
 * @extends GlobalWatchlistEntryBase
 *
 * @param {Object} info Should have all of the properties that are documented below, plus
 *   all those needed by {@link GlobalWatchlistEntryBase}
 */
function GlobalWatchlistEntryEdits( info ) {
	GlobalWatchlistEntryEdits.super.call( this, info );

	/**
	 * @property {number} fromRev The revision before this entry's edit(s), to use for
	 *   the diff link
	 */
	this.fromRev = info.fromRev;

	/**
	 * @property {number} toRev The revision after this entry's edit(s), to use for
	 *   the diff link
	 */
	this.toRev = info.toRev;

	/**
	 * @property {boolean} newPage If this entry's edit(s) represent the creation of a
	 *   new page, which means no diff link should be shown
	 */
	this.newPage = info.newPage;

	/**
	 * @property {number} editCount The number of edits this entry represents
	 */
	this.editCount = info.editCount;
}

OO.inheritClass( GlobalWatchlistEntryEdits, GlobalWatchlistEntryBase );

module.exports = GlobalWatchlistEntryEdits;
