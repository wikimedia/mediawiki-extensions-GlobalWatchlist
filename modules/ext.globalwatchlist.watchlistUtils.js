/**
 * Convert an array of two or more objects for specific edits to the same page to one object
 * with the information grouped
 *
 * @param {Array} edits
 * @return {Object}
 */
function mergePageEdits( edits ) {
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
}

/**
 * Ensure page creations are shown before normal edits
 *
 * If edits are not grouped, and a new page has edits to it, it is confusing to see the page
 * creation occur after the edits.
 *
 * TODO should probably consistently enforce ordering by timestamp
 *
 * @param {Array} allEdits
 * @return {Array}
 */
function putNewPagesFirst( allEdits ) {
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
}

/**
 * Convert what the api returns to what we need
 *
 * @param {Object} editInfo
 * @param {string} site
 * @param {boolean} groupPage
 * @return {Array}
 */
function convertEdits( editInfo, site, groupPage ) {
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
					anon: entry.anon,
					bot: entry.bot,
					comment: entry.parsedcomment,
					editCount: 1,
					fromRev: entry.old_revid,
					minor: entry.minor,
					newPage: entry.newPage,
					tags: entry.tags,
					toRev: entry.revid,
					user: entry.user
				} ) );
			} );
		} else {
			var distinctUsers = [],
				userEntries = [];

			page.each.forEach( function ( entry ) {
				if ( distinctUsers.indexOf( entry.user ) === -1 ) {
					distinctUsers.push( entry.user );
				}
			} );

			distinctUsers.forEach( function ( user ) {
				var userEdits = page.each.filter( function ( edit ) {
					return edit.user === user;
				} );
				var userLink;
				if ( userEdits[ 0 ].user === false ) {
					userLink = '<span class="history-deleted">' + mw.msg( 'rev-deleted-user' ) + '</span>';
				} else {
					// TODO refactor/rewrite this, have a linker instead of duplicating
					var userLinkBase = ( userEdits[ 0 ].anon || false ) ?
						'Special:Contributions/' :
						'User:';
					var href = '//' + site + mw.config.get( 'wgArticlePath' ).replace( '$1', userLinkBase + user );
					userLink = '<a href="' + href + '" target="_blank">' + user + '</a>';
				}
				userEntries.push( userLink + ( userEdits.length > 1 ? ( ' ' + mw.msg( 'ntimes', userEdits.length ) ) : '' ) );
			} );

			var mergedEditInfo = mergePageEdits( page.each );
			mergedEditInfo.editsbyuser = userEntries.join( ', ' );

			finalEdits.push( $.extend( {}, pagebase, mergedEditInfo ) );
		}
	} );

	finalSorted = putNewPagesFirst( finalEdits );
	return finalSorted;
}

/**
 * Normalize entries
 *
 * @param {Array} entries
 * @return {Array}
 */
function normalizeEntries( entries ) {
	entries.forEach( function ( entry ) {
		if ( entry.userhidden ) {
			entry.user = false;
		}
		if ( typeof entry.anon === 'undefined' ) {
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
}

/**
 * @param {Array} entries
 * @param {string} site
 * @param {boolean} groupPage
 * @return {Array}
 */
function rawToSummary( entries, site, groupPage ) {
	var convertedEdits = [],
		edits = {},
		logEntries = [],
		everything = [],
		cleanedEntries = normalizeEntries( entries );

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
				anon: entry.anon,
				comment: entry.parsedcomment,
				entryType: entry.type,
				ns: entry.ns,
				tags: entry.tags,
				title: entry.title,
				user: entry.user,
				logaction: entry.logaction,
				logtype: entry.logtype
			} );
		}
	} );

	convertedEdits = convertEdits( edits, site, groupPage );
	everything = convertedEdits.concat( logEntries );
	return everything;
}

// Only convertEdits is needed, but the rest are exported for testability
module.exports = {
	convertEdits: convertEdits,
	mergePageEdits: mergePageEdits,
	normalizeEntries: normalizeEntries,
	putNewPagesFirst: putNewPagesFirst,
	rawToSummary: rawToSummary
};
