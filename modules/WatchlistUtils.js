/**
 * General helper for converting the api response data into the form we use to display
 *
 * @class GlobalWatchlistWatchlistUtils
 * @constructor
 *
 * @param {GlobalWatchlistLinker} linker Linker for the relevant site, used for
 *    Links to user pages for registered users
 *    Links to contributions pages for anonymous users
 *    Converting links in edit summaries to not be relative to the current site
 */
function GlobalWatchlistWatchlistUtils( linker ) {
	this.linker = linker;
}

/**
 * Convert an array of two or more objects for specific edits to the same page to one object
 * with the information grouped
 *
 * @param {Array} edits Edits to merge
 * @return {Object} Merged information
 */
GlobalWatchlistWatchlistUtils.prototype.mergePageEdits = function ( edits ) {
	var mergedEditInfo = {};

	// No comments are shown for the grouped changes
	mergedEditInfo.comment = false;

	mergedEditInfo.bot = edits
		.map( function ( edit ) {
			return edit.bot;
		} )
		.reduce( function ( bot1, bot2 ) {
			// The combined edits are only tagged as bot if all of the edits where bot edits
			return bot1 && bot2;
		} );

	mergedEditInfo.editCount = edits.length;

	// Should all be the same
	mergedEditInfo.expiry = edits[ 0 ].expiry;

	mergedEditInfo.fromRev = edits
		.map( function ( edit ) {
			return edit.old_revid;
		} )
		.reduce( function ( edit1, edit2 ) {
			// Get the lower rev id, corresponding to the older revision
			return ( edit1 > edit2 ? edit2 : edit1 );
		} );

	mergedEditInfo.minor = edits
		.map( function ( edit ) {
			return edit.minor;
		} )
		.reduce( function ( minor1, minor2 ) {
			// The combined edits are only tagged as minor if all of the edits where minor
			return minor1 && minor2;
		} );

	mergedEditInfo.newPage = edits
		.map( function ( edit ) {
			return edit.newPage;
		} )
		.reduce( function ( newPage1, newPage2 ) {
			// Page creation is stored as a flag on edit entries, instead of as
			// its own type of entry. If any of the entries are creations, the
			// overall group was a page creation
			return newPage1 || newPage2;
		} );

	// No tags
	mergedEditInfo.tags = [];

	// Per T262176, and like the core watchlist, use the latest timestamp
	mergedEditInfo.timestamp = edits
		.map( function ( edit ) {
			return edit.timestamp;
		} )
		.reduce( function ( time1, time2 ) {
			return ( ( new Date( time1 ) ) > ( new Date( time2 ) ) ? time1 : time2 );
		} );

	// When there are multiple edits grouped, the timestamp has a tooltip (title attribute)
	// explaining that its the timestamp of the latest change. If its not set here, its null,
	// and both the jQuery and Vue displays ignore null attribute values. See T286268 and
	// * https://v3.vuejs.org/guide/migration/attribute-coercion.html#overview
	// * https://api.jquery.com/attr/#attr-attributeName-value
	mergedEditInfo.timestampTitle = mw.msg( 'globalwatchlist-grouped-timestamp' );

	mergedEditInfo.toRev = edits
		.map( function ( edit ) {
			return edit.revid;
		} )
		.reduce( function ( edit1, edit2 ) {
			// Get the higher rev id, corresponding to the newer revision
			return ( edit1 > edit2 ? edit1 : edit2 );
		} );

	return mergedEditInfo;
};

/**
 * Create links based on one-or-more editors
 *
 * editsByUser has the information for the links to create. It is a map in the following format:
 *
 *   ⧼user name/ip address⧽
 *       ->
 *   {
 *       editCount: ⧼count⧽
 *       anon: ⧼true/false⧽
 *   }
 *
 * For edits where the user was hidden, the key is: ##hidden##
 *
 * WARNING: This method returns RAW HTML that is the displayed. jQuery isn't used because we need
 *          to handle creating multiple links and returning the same way a single link does, since
 *          the caller doesn't know if the entry row is for a single edit or multiple edits grouped
 * For each entry in editsByUser:
 *  - if the user was hidden, the output is hard-coded as the core message `rev-deleted-user`
 *      wrapped in a span for styling
 *  - if the user wasn't hidden, a link is shown. The text for the link is the username, and
 *      the target is the user page (for users) or the contributions page (for anonymous editors),
 *      just like at Special:Watchlist. See RCCacheEntryFactory::getUserLink and Linker::userLink.
 *  - if the user made multiple edits, or multiple edits were made by hidden users, the number of
 *      edits is appended after the link, using the `ntimes` core message. This is only the case
 *      when grouping results by page. See EnhancedChangesList::recentChangesBlockGroup
 *
 * @param {Object} editsByUser Edit information
 * @return {string} the raw HTML to display
 */
GlobalWatchlistWatchlistUtils.prototype.makeUserLinks = function ( editsByUser ) {
	var users = Object.keys( editsByUser );

	var allLinks = [],
		userLink = '',
		userLinkBase = '',
		userLinkURL = '';

	var that = this;
	users.forEach( function ( userMessage ) {
		if ( userMessage === '##hidden##' ) {
			// Edits by hidden user(s)
			userLink = '<span class="history-deleted">' +
				mw.message( 'rev-deleted-user' ).escaped() +
				'</span>';
		} else {
			userLinkBase = editsByUser[ userMessage ].anon ?
				'Special:Contributions/' :
				'User:';
			userLinkURL = that.linker.linkPage( userLinkBase + userMessage );
			userLink = '<a href="' + userLinkURL + '" target="_blank">' + userMessage + '</a>';
		}
		if ( editsByUser[ userMessage ].editCount > 1 ) {
			userLink = userLink + ' ' +
				mw.message( 'ntimes', editsByUser[ userMessage ].editCount ).escaped();
		}
		allLinks.push( userLink );
	} );

	return allLinks.join( ', ' );
};

/**
 * Shortcut for makeUserLinks when there is only one user (single edits, ungrouped edits,
 * or log entries) and no need for showing a message for the edit count
 *
 * @param {string} userMessage either name or ip address
 * @param {boolean} isAnon Whether the link is for an anonymous user
 * @return {string}
 */
GlobalWatchlistWatchlistUtils.prototype.makeSingleUserLink = function ( userMessage, isAnon ) {
	if ( userMessage === '' ) {
		// Didn't fetch due to fast mode
		return '';
	}

	var editsByUser = {};
	editsByUser[ userMessage ] = {
		editCount: 1,
		anon: isAnon
	};

	return this.makeUserLinks( editsByUser );
};

/**
 * Convert edit info, including adding links to user pages / anonymous users' contributions and
 * grouping results by page when called for
 *
 * @param {Object} editInfo
 * @param {boolean} groupPage Whether to group results by page
 * @return {Array} Converted edits
 */
GlobalWatchlistWatchlistUtils.prototype.convertEdits = function ( editInfo, groupPage ) {
	var finalEdits = [];

	var edits = [];
	for ( var key in editInfo ) {
		edits.push( editInfo[ key ] );
	}

	var that = this;
	edits.forEach( function ( page ) {
		var pagebase = {
			entryType: 'edit',
			ns: page.ns,
			title: page.title
		};
		if ( !groupPage || page.each.length === 1 ) {
			page.each.forEach( function ( entry ) {
				finalEdits.push( $.extend( {}, pagebase, {
					bot: entry.bot,
					comment: entry.parsedcomment,
					editCount: 1,
					expiry: entry.expiry,
					fromRev: entry.old_revid,
					minor: entry.minor,
					newPage: entry.newPage,
					tags: entry.tags,
					timestamp: entry.timestamp,
					timestampTitle: null,
					toRev: entry.revid,
					userDisplay: that.makeSingleUserLink(
						entry.user,
						entry.anon
					)
				} ) );
			} );
		} else {
			var mergedEditInfo = that.mergePageEdits( page.each );

			// Map of edit counts
			// ⧼user name/ip address⧽
			//     ->
			// {
			//     editCount: ⧼count⧽
			//     anon: ⧼true/false⧽
			// }
			//
			// For edits where the user was hidden, the key is: ##hidden##
			var editsByUser = {};

			page.each.forEach( function ( specificEdit ) {
				if ( !( specificEdit.user in editsByUser ) ) {
					editsByUser[ specificEdit.user ] = {
						editCount: 0,
						anon: specificEdit.anon
					};
				}
				editsByUser[ specificEdit.user ].editCount =
					editsByUser[ specificEdit.user ].editCount + 1;
			} );

			mergedEditInfo.userDisplay = that.makeUserLinks( editsByUser );

			finalEdits.push( $.extend( {}, pagebase, mergedEditInfo ) );
		}
	} );

	return finalEdits;
};

/**
 * @param {Array} entries Entries in the format returned by the api
 * @return {Array} Entries in a "normalized" format
 */
GlobalWatchlistWatchlistUtils.prototype.normalizeEntries = function ( entries ) {
	entries.forEach( function ( entry ) {
		if ( entry.userhidden ) {
			// # is in wgLegalTitleChars so no conflict
			entry.user = '##hidden##';
		} else if ( typeof entry.user === 'undefined' ) {
			// Not fetching, fast mode
			entry.user = '';
		}

		if ( typeof entry.parsedcomment === 'undefined' ) {
			entry.parsedcomment = '';
		}
		if ( typeof entry.tags === 'undefined' ) {
			entry.tags = [];
		}
		if ( entry.type === 'new' ) {
			// Treat page creations as edits with a flag, so that they can be
			// grouped together when needed
			entry.type = 'edit';
			entry.newPage = true;
		} else {
			entry.newPage = false;
		}

		if ( typeof entry.timestamp === 'undefined' ) {
			// Not fetched in fast mode
			entry.timestamp = false;
		}
	} );
	return entries;
};

/**
 * Convert raw expiration strings into the tooltip to be shown
 *
 * @param {Array} entries
 * @return {Array}
 */
GlobalWatchlistWatchlistUtils.prototype.addExpirationMessages = function ( entries ) {
	var expirationDate, daysLeft;
	entries.forEach( function ( entry ) {
		if ( entry.expiry ) {
			expirationDate = new Date( entry.expiry );
			daysLeft = Math.ceil( ( expirationDate - Date.now() ) / 1000 / 86400 ) + 0;
			if ( daysLeft === 0 ) {
				entry.expiry = mw.msg( 'watchlist-expiring-hours-full-text' );
			} else {
				entry.expiry = mw.msg( 'watchlist-expiring-days-full-text', daysLeft );
			}
		}
	} );
	return entries;
};

/**
 * Add a "flags" property to each entry that will either be `false` or a string with the flags
 * to show next to the entry (new page, minor edit, bot action).
 *
 * Must be done *after* the merging of grouped changes, so cannot be a part of normalizeEntries()
 *
 * @param {Array} entries Entries to update
 * @return {Array} updated entries, now with a "flags" property
 */
GlobalWatchlistWatchlistUtils.prototype.addEntryFlags = function ( entries ) {
	// Optimization: only fetch the messages a single time
	// Order to match the display of core
	var newPageFlag = mw.msg( 'newpageletter' );
	var minorFlag = mw.msg( 'minoreditletter' );
	var botFlag = mw.msg( 'boteditletter' );
	var entryFlags;
	entries.forEach( function ( entry ) {
		entryFlags = '';
		if ( entry.newPage === true ) {
			entryFlags += newPageFlag;
		}
		if ( entry.minor ) {
			entryFlags += minorFlag;
		}
		if ( entry.bot ) {
			entryFlags += botFlag;
		}
		if ( entryFlags === '' ) {
			entry.flags = false;
		} else {
			entry.flags = entryFlags;
		}
	} );
	return entries;
};

/**
 * Truncate the timestamp to only show details down to the minute, see T262176
 *
 * This needs to be done *after* the sorting of edits and log entries by timestamp,
 * which should be done using the full untruncated version, see T286977
 *
 * @param {Array} entries Entries to update
 * @return {Array} updated entries
 */
GlobalWatchlistWatchlistUtils.prototype.truncateTimestamps = function ( entries ) {
	entries.forEach( function ( entry ) {
		// We set the timestamp to false in normalizeEntries if its not available
		if ( entry.timestamp !== false ) {
			// Per T262176, display as
			// YYYY-MM-DD HH:MM
			entry.timestamp = entry.timestamp.replace( /T(\d+:\d+):\d+Z/, ' $1' );
		}
	} );
	return entries;
};

/**
 * Create the HTML to show for the tags associated with an entry. For each tag, if there is
 * a display configured onwiki, that is shown, otherwise its just the name. See
 * {@link GlobalWatchlistSiteBase#getTagList SiteBase#getTagList} for where the info is
 * retrieved.
 *
 * Must be done *after* the merging of grouped changes, so cannot be a part of normalizeEntries()
 *
 * @param {Array} entries Entries to update
 * @param {Object} tagsInfo Keys are tag names, values are the html to display (either the
 *    display text with local links updated, or just the name)
 * @return {Array} updated entries
 */
GlobalWatchlistWatchlistUtils.prototype.addTagDisplays = function ( entries, tagsInfo ) {
	// In fast mode no tag info was retrieved, and none of the entries should have tags
	// that need displaying. We still need to set the `tagsDisplay` property for each
	// entry though, the display code checks it.
	if ( Object.keys( tagsInfo ).length === 0 ) {
		entries.forEach( function ( entry ) {
			entry.tagsDisplay = false;
		} );
		return entries;
	}

	// We have some possible tags
	var tagDescriptions;
	var withLabel;
	entries.forEach( function ( entry ) {
		if ( entry.tags.length === 0 ) {
			entry.tagsDisplay = false;
		} else {
			// This is the actual building of the display
			tagDescriptions = entry.tags.map(
				function ( tagName ) {
					return tagsInfo[ tagName ];
				}
			).join( ', ' );
			withLabel = mw.msg( 'globalwatchlist-tags', entry.tags.length, tagDescriptions );
			entry.tagsDisplay = mw.msg( 'parentheses', withLabel );
		}
	} );
	return entries;
};

/**
 * Set the comment display to include the updated links in edit summaries/log entries.
 * In fast mode, or for grouped changes, there is no comment display.
 *
 * Must be done *after* the merging of grouped changes, so cannot be a part of normalizeEntries()
 *
 * The commentDisplay set here is treated as raw html by both the jQuery and Vue displays. We
 * use the `parsedcomment` result from the api, and MediaWiki core takes care of escaping.
 *
 * @param {Array} entries Entries to update
 * @return {Array} updated entries
 */
GlobalWatchlistWatchlistUtils.prototype.addCommentDisplays = function ( entries ) {
	var that = this;
	entries.forEach( function ( entry ) {
		if ( entry.comment && entry.comment !== '' ) {
			entry.commentDisplay = ': ' + that.linker.fixLocalLinks( entry.comment );
		} else {
			entry.commentDisplay = false;
		}
	} );
	return entries;
};

/**
 * Convert result from the API to format used by this extension
 *
 * This is the entry point for the JavaScript controlling Special:GlobalWatchlist and the
 * display of each site's changes.
 *
 * @param {Array} entries Entries to convert
 * @param {boolean} groupPage Whether to group results by page
 * @param {Object} tagsInfo See {@link GlobalWatchlistWatchlistUtils#addTagDisplays #addTagDisplays}
 *    for details
 * @return {Array} summary of changes
 */
GlobalWatchlistWatchlistUtils.prototype.rawToSummary = function ( entries, groupPage, tagsInfo ) {
	var convertedEdits = [],
		edits = {},
		logEntries = [],
		cleanedEntries = this.normalizeEntries( entries );

	var that = this;
	cleanedEntries.forEach( function ( entry ) {
		if ( entry.type === 'edit' ) {
			// Also includes new pages
			if ( typeof edits[ entry.pageid ] === 'undefined' ) {
				edits[ entry.pageid ] = {
					each: [ entry ],
					ns: entry.ns,
					title: entry.title
				};
			} else {
				edits[ entry.pageid ].each.push( entry );
			}
		} else if ( entry.type === 'log' ) {
			logEntries.push( {
				bot: entry.bot,
				comment: entry.parsedcomment,
				entryType: entry.type,
				expiry: entry.expiry,
				ns: entry.ns,
				tags: entry.tags,
				timestamp: entry.timestamp,
				timestampTitle: null,
				title: entry.title,
				logaction: entry.logaction,
				logid: entry.logid,
				logtype: entry.logtype,
				userDisplay: that.makeSingleUserLink(
					entry.user,
					entry.anon
				)
			} );
		}
	} );

	convertedEdits = this.convertEdits( edits, groupPage );

	// Sorting: we want the newest edits and log entries at the top. But, the api
	// only tells us what minute the edit/log entry was made. So, if the timestamps
	// are the same, go by the revid and logid - we assume that newer edits have higher
	// revision ids, and newer log entries have higher log ids. Sort functions should
	// return negative if the order should not change, and positive if they should.
	// See T275303
	convertedEdits.sort(
		function ( editA, editB ) {
			if ( editA.timestamp !== editB.timestamp ) {
				return ( ( new Date( editA.timestamp ) ) > ( new Date( editB.timestamp ) ) ?
					-1 :
					1
				);
			}
			// fallback to revision ids
			return ( ( editA.toRev > editB.toRev ) ? -1 : 1 );
		}
	);
	logEntries.sort(
		function ( logA, logB ) {
			if ( logA.timestamp !== logB.timestamp ) {
				return ( ( new Date( logA.timestamp ) ) > ( new Date( logB.timestamp ) ) ?
					-1 :
					1
				);
			}
			// fallback to log ids
			return ( ( logA.logid > logB.logid ) ? -1 : 1 );
		}
	);

	var everything = convertedEdits.concat( logEntries );
	everything = this.addExpirationMessages( everything );
	everything = this.addEntryFlags( everything );
	everything = this.truncateTimestamps( everything );
	everything = this.addTagDisplays( everything, tagsInfo );
	everything = this.addCommentDisplays( everything );
	return everything;
};

module.exports = GlobalWatchlistWatchlistUtils;
