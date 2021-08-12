( function () {

	/**
	 * To simplify testing WatchlistUtils.getFinalEntries(), allow checking
	 * part of the cleanup at a time by only checking some of the properties on
	 * the updated entries
	 *
	 * @param {Array} fullEntries the result of getFinalEntries()
	 * @param {Array} keysToInclude the keys of each entry that should be included
	 * @return {Array} Objects corresponding to fullEntries but with only the keys
	 *   that are included in keysToInclude
	 */
	function getFilteredEntries( fullEntries, keysToInclude ) {
		var filteredEntry;
		return fullEntries.map(
			function ( fullEntry ) {
				filteredEntry = {};
				keysToInclude.forEach(
					function ( keyToInclude ) {
						filteredEntry[ keyToInclude ] = fullEntry[ keyToInclude ];
					}
				);
				return filteredEntry;
			}
		);
	}
	var GlobalWatchlistWatchlistUtils = require( '../../../modules/WatchlistUtils.js' );
	var GlobalWatchlistLinker = require( '../../../modules/Linker.js' );

	// Set config variables so that the linker can be created properly
	QUnit.module( 'ext.globalwatchlist.WatchlistUtils', QUnit.newMwEnvironment( {
		config: {
			wgArticlePath: '/wiki/$1/FooBar',
			wgScript: '/w/baz/index.php'
		}
	} ) );

	// The linker is currently only needed for the addCommentDisplays() test
	var watchlistUtils = new GlobalWatchlistWatchlistUtils(
		new GlobalWatchlistLinker( 'en.wikipedia.org' )
	);

	/* eslint-disable camelcase */
	QUnit.test( 'watchlistUtils.mergePageEdits', function ( assert ) {
		var expectTimestampTitle = mw.msg( 'globalwatchlist-grouped-timestamp' );
		// Not testing timestamps as part of this, all edits set to the same timestamp
		// of 2020-08-31 12:00.
		var edit1 = {
			// Bot edit, minor edit, not a new page
			bot: true,
			expiry: false,
			old_revid: 1,
			minor: true,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 2
		};
		var edit2_a = {
			// Bot edit, minor edit, not a new page
			bot: true,
			expiry: false,
			old_revid: 2,
			minor: true,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		var edit2_b = {
			// Bot edit, not a minor edit, not a new page
			bot: true,
			expiry: false,
			old_revid: 2,
			minor: false,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		var edit2_c = {
			// Not a bot edit, minor edit, not a new page
			bot: false,
			expiry: false,
			old_revid: 2,
			minor: true,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		var edit2_d = {
			// Not a bot edit, not a minor edit, not a new page
			bot: false,
			expiry: false,
			old_revid: 2,
			minor: false,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		var edit2_e = {
			// Not a bot edit, not a minor edit, new page
			bot: false,
			expiry: false,
			old_revid: 0,
			minor: false,
			newPage: true,
			timestamp: '2020-08-31 12:00',
			revid: 0
		};

		var mergedEdits_a = {
			// Both bot edits, both minor edits, neither new page
			bot: true,
			comment: false,
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: true,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			timestampTitle: expectTimestampTitle,
			toRev: 3
		};
		var mergedEdits_b = {
			// Both bot edits, only one minor edit, neither new page
			bot: true,
			comment: false,
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: false,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			timestampTitle: expectTimestampTitle,
			toRev: 3
		};
		var mergedEdits_c = {
			// Only one bot edit, both minor edits, neither new page
			bot: false,
			comment: false,
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: true,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			timestampTitle: expectTimestampTitle,
			toRev: 3
		};
		var mergedEdits_d = {
			// Only one bot edit, only one minor edit, neither new page
			bot: false,
			comment: false,
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: false,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			timestampTitle: expectTimestampTitle,
			toRev: 3
		};
		var mergedEdits_e = {
			// Only one bot edit, only one minor edit, one new page
			bot: false,
			comment: false,
			editCount: 2,
			expiry: false,
			fromRev: 0,
			minor: false,
			newPage: true,
			tags: [],
			timestamp: '2020-08-31 12:00',
			timestampTitle: expectTimestampTitle,
			toRev: 2
		};

		assert.deepEqual(
			watchlistUtils.mergePageEdits( [ edit1, edit2_a ] ),
			mergedEdits_a,
			'Two minor bot edits -> minor bot edits'
		);
		assert.deepEqual(
			watchlistUtils.mergePageEdits( [ edit1, edit2_b ] ),
			mergedEdits_b,
			'Minor bot edit + bot edit -> bot edits'
		);
		assert.deepEqual(
			watchlistUtils.mergePageEdits( [ edit1, edit2_c ] ),
			mergedEdits_c,
			'Minor bot edit + minor edit -> minor edits'
		);
		assert.deepEqual(
			watchlistUtils.mergePageEdits( [ edit1, edit2_d ] ),
			mergedEdits_d,
			'Minor bot edit + normal edit -> normal edits'
		);
		assert.deepEqual(
			watchlistUtils.mergePageEdits( [ edit1, edit2_e ] ),
			mergedEdits_e,
			'Minor bot edit + new page -> normal new page'
		);
	} );

	QUnit.test( 'watchlistUtils.normalizeEntries', function ( assert ) {
		// Only fill in the parts that would otherwise be normalized
		var edit = {
			anon: true,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit',
			user: ''
		};
		var normalizedEdit = {
			anon: true,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit',
			newPage: false,
			user: ''
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ edit ] ),
			[ normalizedEdit ],
			'Edits are flagged as not new pages'
		);

		var hiddenEditor = {
			anon: false,
			userhidden: true,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit'
		};
		var normalizedHiddenEditor = {
			anon: false,
			userhidden: true,
			user: '##hidden##',
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit',
			newPage: false
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ hiddenEditor ] ),
			[ normalizedHiddenEditor ],
			'Edits by hidden users are flagged as user=##hidden##'
		);

		var editWithNoSummary = {
			anon: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit'
		};
		var normalizedEditWithNoSummary = {
			anon: false,
			parsedcomment: '',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit',
			newPage: false,
			user: ''
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ editWithNoSummary ] ),
			[ normalizedEditWithNoSummary ],
			'Edits without comments are normalized to parsedcomment=\'\''
		);

		var editWithNoTags = {
			anon: false,
			parsedcomment: '',
			timestamp: '2020-08-31 12:00',
			type: 'edit'
		};
		var normalizedEditWithNoTags = {
			anon: false,
			parsedcomment: '',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit',
			newPage: false,
			user: ''
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ editWithNoTags ] ),
			[ normalizedEditWithNoTags ],
			'Edits without tags are normalized to tags=[]'
		);

		var newPage = {
			anon: true,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'new'
		};
		var normalizedNewPage = {
			anon: true,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit',
			newPage: true,
			user: ''
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ newPage ] ),
			[ normalizedNewPage ],
			'New pages are normalized to edits with a flag'
		);
	} );

	QUnit.test( 'WatchlistUtils.getFinalEntries (entry flags)', function ( assert ) {
		var allEntries = [];
		var expectedEntries = [];
		var withoutFlags;
		var withFlags;
		var newPageFlag = mw.msg( 'newpageletter' );
		var minorFlag = mw.msg( 'minoreditletter' );
		var botFlag = mw.msg( 'boteditletter' );

		/* We use bitwise comparisons to simplify looping through all possible flag combinations */
		/* eslint-disable no-bitwise */
		for ( var iii = 0; iii <= 7; iii++ ) {
			withoutFlags = {
				newPage: ( ( iii & 1 ) === 1 ),
				minor: ( ( iii & 2 ) === 2 ),
				bot: ( ( iii & 4 ) === 4 )
			};
			allEntries.push( withoutFlags );

			// Expected result, includes the original properties
			withFlags = {
				newPage: ( ( iii & 1 ) === 1 ),
				minor: ( ( iii & 2 ) === 2 ),
				bot: ( ( iii & 4 ) === 4 )
			};
			if ( iii === 0 ) {
				// Would have no flags
				withFlags.flags = false;
			} else {
				withFlags.flags = (
					( ( ( iii & 1 ) === 1 ) ? newPageFlag : '' ) +
					( ( ( iii & 2 ) === 2 ) ? minorFlag : '' ) +
					( ( ( iii & 4 ) === 4 ) ? botFlag : '' )
				);
			}
			expectedEntries.push( withFlags );
		}
		/* eslint-enable no-bitwise */

		// Reduce the fully updated entries to just the parts we are checking
		var result = getFilteredEntries(
			watchlistUtils.getFinalEntries( allEntries, {} ),
			[ 'newPage', 'minor', 'bot', 'flags' ]
		);
		assert.deepEqual(
			result,
			expectedEntries,
			'Flags are added to entries marked as new pages / minor edits / bot actions'
		);
	} );

	QUnit.test( 'WatchlistUtils.getFinalEntries (truncate timestamps)', function ( assert ) {
		var originalEntries = [
			{ timestamp: false },
			{ timestamp: '2021-07-04T07:30:49Z' },
			{ timestamp: '2020-01-01T12:01:00Z' }
		];
		var expectedUpdatedEntries = [
			{ timestamp: false },
			{ timestamp: '2021-07-04 07:30' },
			{ timestamp: '2020-01-01 12:01' }
		];

		// Reduce the fully updated entries to just the parts we are checking
		var result = getFilteredEntries(
			watchlistUtils.getFinalEntries( originalEntries, {} ),
			[ 'timestamp' ]
		);
		assert.deepEqual(
			result,
			expectedUpdatedEntries,
			'Timestamps are truncated to display in the form YY-MM-DD HH:MM'
		);
	} );

	QUnit.test( 'WatchlistUtils.getFinalEntries (comment displays)', function ( assert ) {
		// First two are missing a comment, third doesn't have a link, third has
		// a link to [[PageName]]. This is for en.wikipedia.org, per configuration
		// of the linker above
		var originalEntries = [
			{ comment: false },
			{ comment: '' },
			{ comment: 'foo' },
			{ comment: '<a href="/wiki/PageName" title="PageName">PageName</a>' }
		];
		var expectedUpdatedEntries = [
			{ comment: false, commentDisplay: false },
			{ comment: '', commentDisplay: false },
			{ comment: 'foo', commentDisplay: ': foo' },
			{
				comment: '<a href="/wiki/PageName" title="PageName">PageName</a>',
				commentDisplay: ': <a href="//en.wikipedia.org/wiki/PageName" title="PageName">PageName</a>'
			}
		];

		// Reduce the fully updated entries to just the parts we are checking
		var result = getFilteredEntries(
			watchlistUtils.getFinalEntries( originalEntries, {} ),
			[ 'comment', 'commentDisplay' ]
		);
		assert.deepEqual(
			result,
			expectedUpdatedEntries,
			'leading ": " are added to comments, and links are updated, when there is a comment'
		);
	} );

	/* eslint-enable camelcase */
}() );
