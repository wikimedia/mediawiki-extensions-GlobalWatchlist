/**
 * @class watchlistUtils
 * @hideconstructor
 */
var watchlistUtils = {};

/**
 * Convert an array of two or more objects for specific edits to the same page to one object
 * with the information grouped
 *
 * @param {Array} edits Edits to merge
 * @return {Object} Merged information
 */
watchlistUtils.mergePageEdits = function ( edits ) {
	var mergedEditInfo = {};

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
 * @param {GlobalWatchlistLinker} linker Linker to create the links
 * @return {string} the raw HTML to display
 */
watchlistUtils.makeUserLinks = function ( editsByUser, linker ) {
	var users = Object.keys( editsByUser );

	var allLinks = [],
		userLink = '',
		userLinkBase = '',
		userLinkURL = '';
	users.forEach( function ( userMessage ) {
		if ( userMessage === '##hidden##' ) {
			// Edits by hidden user(s)
			userLink = '<span class="history-deleted">' +
				( new mw.Message( 'rev-deleted-user' ) ).escaped() +
				'</span>';
		} else {
			userLinkBase = editsByUser[ userMessage ].anon ?
				'Special:Contributions/' :
				'User:';
			userLinkURL = linker.linkPage( userLinkBase + userMessage );
			userLink = '<a href="' + userLinkURL + '" target="_blank">' + userMessage + '</a>';
		}
		if ( editsByUser[ userMessage ].editCount > 1 ) {
			userLink = userLink + ' ' +
				( new mw.Message( 'ntimes', editsByUser[ userMessage ].editCount ) ).escaped();
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
 * @param {GlobalWatchlistLinker} linker Linker to create the link
 * @return {string}
 */
watchlistUtils.makeSingleUserLink = function ( userMessage, isAnon, linker ) {
	if ( userMessage === '' ) {
		// Didn't fetch due to fast mode
		return '';
	}

	var editsByUser = {};
	editsByUser[ userMessage ] = {
		editCount: 1,
		anon: isAnon
	};

	return watchlistUtils.makeUserLinks( editsByUser, linker );
};

/**
 * Convert edit info, including adding links to user pages / anonymous users' contributions and
 * grouping results by page when called for
 *
 * @param {Object} editInfo
 * @param {string} site Which site this is for
 * @param {boolean} groupPage Whether to group results by page
 * @param {GlobalWatchlistLinker} linker Linker to use
 * @return {Array} Converted edits
 */
watchlistUtils.convertEdits = function ( editInfo, site, groupPage, linker ) {
	var finalEdits = [];

	var edits = [];
	for ( var key in editInfo ) {
		edits.push( editInfo[ key ] );
	}

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
					toRev: entry.revid,
					userDisplay: watchlistUtils.makeSingleUserLink(
						entry.user,
						entry.anon,
						linker
					)
				} ) );
			} );
		} else {
			var mergedEditInfo = watchlistUtils.mergePageEdits( page.each );

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

			mergedEditInfo.userDisplay = watchlistUtils.makeUserLinks(
				editsByUser,
				linker
			);

			finalEdits.push( $.extend( {}, pagebase, mergedEditInfo ) );
		}
	} );

	return finalEdits;
};

/**
 * @param {Array} entries Entries in the format returned by the api
 * @return {Array} Entries in a "normalized" format
 */
watchlistUtils.normalizeEntries = function ( entries ) {
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

			// need to be set for the mapping in mergePageEdits, but won't be used
			// eslint-disable-next-line camelcase
			entry.old_revid = 0;
			entry.revid = 0;
		} else {
			entry.newPage = false;
		}

		if ( typeof entry.timestamp === 'undefined' ) {
			// Not fetched in fast
			entry.timestamp = false;
		} else {
			// Per T262176, display as
			// YYYY-MM-DD HH:MM
			entry.timestamp = entry.timestamp.replace( /T(\d+:\d+):\d+Z/, ' $1' );
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
watchlistUtils.addExpirationMessages = function ( entries ) {
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
 * Convert result from the API to format used by this extension
 *
 * This is the entry point for the JavaScript controlling Special:GlobalWatchlist and the
 * display of each site's changes.
 *
 * @param {Array} entries Entries to convert
 * @param {string} site Which site this is for
 * @param {boolean} groupPage Whether to group results by page
 * @param {GlobalWatchlistLinker} linker Linker for the relevant site, used for
 *    Links to user pages for registered users
 *    Links to contributions pages for anonymous users
 *    Converting links in edit summaries to not be relative to the current site
 * @return {Array} summary of changes
 */
watchlistUtils.rawToSummary = function ( entries, site, groupPage, linker ) {
	var convertedEdits = [],
		edits = {},
		logEntries = [],
		cleanedEntries = watchlistUtils.normalizeEntries( entries );

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
				title: entry.title,
				logaction: entry.logaction,
				logid: entry.logid,
				logtype: entry.logtype,
				userDisplay: watchlistUtils.makeSingleUserLink(
					entry.user,
					entry.anon,
					linker
				)
			} );
		}
	} );

	convertedEdits = watchlistUtils.convertEdits( edits, site, groupPage, linker );

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
	everything = watchlistUtils.addExpirationMessages( everything );
	return everything;
};

// Only rawToSummary is needed, but the rest are exported for testability
module.exports = watchlistUtils;
