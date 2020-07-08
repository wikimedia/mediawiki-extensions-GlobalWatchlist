/**
 * Convert an array of two or more objects for specific edits to the same page to one object
 * with the information grouped
 *
 * @param {array} edits
 * @return {object}
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
 * Convert what the api returns to what we need
 *
 * @param {object} editInfo
 * @param {string} site
 * @param {bool} groupPage
 * @return {array}
 */
function convertEdits( editInfo, site, groupPage ) {
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
					anon: entry.anon,
					bot: entry.bot,
					comment: entry.parsedcomment,
					editCount: 1,
					fromRev: entry.old_revid,
					minor: entry.minor,
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
	return finalEdits;
}

/**
 * Normalize entries
 * @param {array} entries
 * @return {array}
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
	} );
	return entries;
}

/**
 * @param {array} entries
 * @param {string} site
 * @param {bool} groupPage
 * @return array
 */
function rawToSummary( entries, site, groupPage ) {
	var edits = {},
		logEntries = [],
		newPages = [],
		everything = [],
		cleanedEntries = normalizeEntries( entries );

	cleanedEntries.forEach( function ( entry ) {
		if ( entry.type === 'edit' ) {
			if ( typeof edits[ entry.pageid ] === 'undefined' ) {
				edits[ entry.pageid ] = {
					each: [ entry ],
					ns: entry.ns,
					title: entry.title
				};
			} else {
				edits[ entry.pageid ].each.push( entry );
			}
		} else {
			var entryBase = {
				anon: entry.anon,
				comment: entry.parsedcomment,
				entryType: entry.type,
				ns: entry.ns,
				tags: entry.tags,
				title: entry.title,
				user: entry.user
			};
			if ( entry.type === 'new' ) {
				newPages.push( entryBase );
			} else if ( entry.type === 'log' ) {
				logEntries.push( $.extend( entryBase, {
					logaction: entry.logaction,
					logtype: entry.logtype
				} ) );
			}
		}
	} );

	everything = newPages.concat( convertEdits( edits, site, groupPage ) ).concat( logEntries );
	return everything;
}

// Only convertEdits is needed, but the rest are exported for testability
module.exports = {
	convertEdits: convertEdits,
	mergePageEdits: mergePageEdits,
	normalizeEntries: normalizeEntries,
	rawToSummary: rawToSummary
};
