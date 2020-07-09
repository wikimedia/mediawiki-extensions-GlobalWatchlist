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
					anon: entry.anon || false,
					bot: entry.bot,
					comment: entry.parsedcomment || '',
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
			finalEdits.push( $.extend( {}, pagebase, {
				bot: page.each
					.map( function ( edit ) {
						return edit.bot;
					} )
					.reduce( function ( bot1, bot2 ) {
						return bot1 && bot2;
					} ),
				editCount: page.each.length,
				editsbyuser: userEntries.join( ', ' ),
				fromRev: page.each
					.map( function ( edit ) {
						return edit.old_revid;
					} )
					.reduce( function ( edit1, edit2 ) {
						return ( edit1 > edit2 ? edit2 : edit1 );
					} ),
				minor: page.each
					.map( function ( edit ) {
						return edit.minor;
					} )
					.reduce( function ( minor1, minor2 ) {
						return minor1 && minor2;
					} ),
				tags: [],
				toRev: page.each
					.map( function ( edit ) {
						return edit.revid;
					} )
					.reduce( function ( edit1, edit2 ) {
						return ( edit1 > edit2 ? edit1 : edit2 );
					} )
			} ) );
		}
	} );
	return finalEdits;
}

/**
 * @param {array} entries
 * @param {string} site
 * @param {bool} groupPage
 * @return arary
 */
function rawToSummary( entries, site, groupPage ) {
	var edits = {},
		logEntries = [],
		newPages = [],
		everything = [];

	entries.forEach( function ( entry ) {
		if ( entry.userhidden ) {
			entry.user = false;
		}
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
				anon: entry.anon || false,
				comment: entry.parsedcomment || '',
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

module.exports = {
	convertEdits: convertEdits,
	rawToSummary: rawToSummary
};
