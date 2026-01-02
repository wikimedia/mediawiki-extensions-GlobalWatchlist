/*
 * Extended version of GlobalWatchlistEntryBase for log entries
 */

const GlobalWatchlistEntryBase = require( './EntryBase.js' );

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
	 * @property {number} logid The log id for this entry
	 */
	this.logid = info.logid;

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

	/**
	 * @property {string} logdisplay The "action text" for this log entry, used for
	 *   plain text description
	 */
	this.logdisplay = info.logdisplay;
}

OO.inheritClass( GlobalWatchlistEntryLog, GlobalWatchlistEntryBase );

module.exports = GlobalWatchlistEntryLog;
