/*
 * Extended version of GlobalWatchlistEntryBase for log entries
 */

var GlobalWatchlistEntryBase = require( './EntryBase.js' );

/**
 * Represents a single log entry
 *
 * @class GlobalWatchlistEntryLog
 * @extends GlobalWatchlistEntryBase
 *
 * @constructor
 * @param {Object} info Should have all of the properties that are documented below, plus
 *   all those needed by {@link GlobalWatchlistEntryBase}
 */
function GlobalWatchlistEntryLog( info ) {
	GlobalWatchlistEntryLog.super.call( this, info );

	/**
	 * @property {number} logId The log id for this entry
	 */
	this.logId = info.logId;

	/**
	 * @property {string} logaction The "action" for this log entry, used together with
	 *   logtype below
	 */
	this.logaction = info.logaction;

	/**
	 * @property {string} logtype The "type" for this log entry, used together with
	 *   logaction above
	 */
	this.logtype = info.logtype;
}

OO.inheritClass( GlobalWatchlistEntryLog, GlobalWatchlistEntryBase );

module.exports = GlobalWatchlistEntryLog;
