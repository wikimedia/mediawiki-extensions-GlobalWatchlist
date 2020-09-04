/**
 * @class watchlistUtils
 * @singleton
 */
var watchlistUtils = {};

/**
 * Convert an array of two or more objects for specific edits to the same page to one object
 * with the information grouped
 *
 * @param {Array} edits
 * @return {Object}
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
 * Ensure page creations are shown before normal edits
 *
 * If edits are not grouped, and a new page has edits to it, it is confusing to see the page
 * creation occur after the edits.
 *
 * @param {Array} allEdits
 * @return {Array}
 */
watchlistUtils.putNewPagesFirst = function ( allEdits ) {
	var newPages = [],
		realEdits = [];

	allEdits.forEach( function ( edit ) {
		if ( edit.newPage ) {
			newPages.push( edit );
		} else {
			realEdits.push( edit );
		}
	} );

	return newPages.concat( realEdits );
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
 *          to handle creating multiple links and returning the same was a single link does, since
 *          the caller doesn't know if the entry row is for a single action or multiple edits grouped
 * For each entry in editsByUser:
 *  - if the user was hidden, the output is hard-coded as the core message `rev-deleted-user` wrapped
 *    in a span for styling
 *  - if the user wasn't hidden, a link is shown. The text for the link is the username, and
 *      the target is the user page (for users) or the contributions page (for anonymous editors),
 *      just like at Special:Watchlist. See RCCacheEntryFactory::getUserLink and Linker::userLink.
 *  - if the user made multiple edits, or multiple edits were made by hidden users, the number of edits
 *      is appended after the link, using the `ntimes` core message. This is only the case when grouping
 *      results by page. See EnhancedChangesList::recentChangesBlockGroup
 *
 * @param {Object} editsByUser
 * @param {GlobalWatchlistLinker} linker
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
			userLink = '<span class="history-deleted">' + mw.msg( 'rev-deleted-user' ) + '</span>';
		} else {
			userLinkBase = editsByUser[ userMessage ].anon ?
				'Special:Contributions/' :
				'User:';
			userLinkURL = linker.linkPage( userLinkBase + userMessage );
			userLink = '<a href="' + userLinkURL + '" target="_blank">' + userMessage + '</a>';
		}
		if ( editsByUser[ userMessage ].editCount > 1 ) {
			userLink = userLink + ' ' + mw.msg( 'ntimes', editsByUser[ userMessage ].editCount );
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
 * @param {boolean} isAnon
 * @param {GlobalWatchlistLinker} linker
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
 * @param {string} site
 * @param {boolean} groupPage
 * @param {GlobalWatchlistLinker} linker
 * @return {Array}
 */
watchlistUtils.convertEdits = function ( editInfo, site, groupPage, linker ) {
	var finalEdits = [],
		finalSorted = [];

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
					fromRev: entry.old_revid,
					minor: entry.minor,
					newPage: entry.newPage,
					tags: entry.tags,
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

	finalSorted = watchlistUtils.putNewPagesFirst( finalEdits );
	return finalSorted;
};

/**
 * @param {Array} entries
 * @return {Array}
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

		if ( typeof entry.anon === 'undefined' ) {
			// Prior to MediaWiki 1.36, `anon` was only included if it was true.
			// In MediaWiki 1.36+, when using `formatversion=2`, it is always included,
			// but removing these few lines of code isn't important enough to bump the
			// extension's required version of MediaWiki to 1.36. Once it is raised,
			// this can be removed. See T259929
			entry.anon = false;
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
	} );
	return entries;
};

/**
 * Convert result from the API to format used by this extension
 *
 * This is the entry point for the JavaScript controlling Special:GlobalWatchlist and the
 * display of each site's changes
 *
 * @param {Array} entries
 * @param {string} site
 * @param {boolean} groupPage
 * @param {GlobalWatchlistLinker} linker
 * @return {Array}
 */
watchlistUtils.rawToSummary = function ( entries, site, groupPage, linker ) {
	var convertedEdits = [],
		edits = {},
		logEntries = [],
		everything = [],
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
				comment: entry.parsedcomment,
				entryType: entry.type,
				ns: entry.ns,
				tags: entry.tags,
				title: entry.title,
				logaction: entry.logaction,
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
	everything = convertedEdits.concat( logEntries );
	return everything;
};

// Only rawToSummary is needed, but the rest are exported for testability
module.exports = watchlistUtils;
