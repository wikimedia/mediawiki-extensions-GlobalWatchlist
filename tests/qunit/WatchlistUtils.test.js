( function () {

	/**
	 * To simplify testing WatchlistUtils.getFinalEntries(), allow checking
	 * part of the cleanup at a time by only checking some of the properties on
	 * the updated entries
	 *
	 * @param {GlobalWatchlistEntryBase[]} fullEntries the result of getFinalEntries()
	 * @param {Array} keysToInclude the keys of each entry that should be included
	 * @return {Array} Objects corresponding to fullEntries but with only the keys
	 *   that are included in keysToInclude
	 */
	function getFilteredEntries( fullEntries, keysToInclude ) {
		let filteredEntry;
		return fullEntries.map(
			( fullEntry ) => {
				filteredEntry = {};
				keysToInclude.forEach(
					( keyToInclude ) => {
						filteredEntry[ keyToInclude ] = fullEntry[ keyToInclude ];
					}
				);
				return filteredEntry;
			}
		);
	}
	const WatchlistUtils = require( 'ext.globalwatchlist.specialglobalwatchlist/WatchlistUtils.js' );
	const Linker = require( 'ext.globalwatchlist.specialglobalwatchlist/Linker.js' );

	// For the getFinalEntries tests, all of the properties we care about are being set on
	// the base GlobalWatchlistEntryBase class, so even though that is meant to be abstract,
	// since that isn't enforced in JavaScript lets use that
	const GlobalWatchlistEntryBase = require( 'ext.globalwatchlist.specialglobalwatchlist/EntryBase.js' );

	// Set config variables so that the linker can be created properly
	QUnit.module( 'ext.globalwatchlist.specialglobalwatchlist/WatchlistUtils', QUnit.newMwEnvironment( {
		config: {
			wgArticlePath: '/wiki/$1/FooBar',
			wgScript: '/w/baz/index.php'
		}
	} ) );

	// The linker is currently only needed for the addCommentDisplays() test
	const watchlistUtils = new WatchlistUtils(
		new Linker( 'en.wikipedia.org' )
	);

	/* eslint-disable camelcase */
	QUnit.test( 'watchlistUtils.mergePageEdits', ( assert ) => {
		const expectTimestampTitle = mw.msg( 'globalwatchlist-grouped-timestamp' );
		// Not testing timestamps as part of this, all edits set to the same timestamp
		// of 2020-08-31 12:00.
		const edit1 = {
			// Bot edit, minor edit, not a new page
			bot: true,
			expiry: false,
			old_revid: 1,
			minor: true,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 2
		};
		const edit2_a = {
			// Bot edit, minor edit, not a new page
			bot: true,
			expiry: false,
			old_revid: 2,
			minor: true,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		const edit2_b = {
			// Bot edit, not a minor edit, not a new page
			bot: true,
			expiry: false,
			old_revid: 2,
			minor: false,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		const edit2_c = {
			// Not a bot edit, minor edit, not a new page
			bot: false,
			expiry: false,
			old_revid: 2,
			minor: true,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		const edit2_d = {
			// Not a bot edit, not a minor edit, not a new page
			bot: false,
			expiry: false,
			old_revid: 2,
			minor: false,
			newPage: false,
			timestamp: '2020-08-31 12:00',
			revid: 3
		};
		const edit2_e = {
			// Not a bot edit, not a minor edit, new page
			bot: false,
			expiry: false,
			old_revid: 0,
			minor: false,
			newPage: true,
			timestamp: '2020-08-31 12:00',
			revid: 0
		};

		const mergedEdits_a = {
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
		const mergedEdits_b = {
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
		const mergedEdits_c = {
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
		const mergedEdits_d = {
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
		const mergedEdits_e = {
			// Only one bot edit, only one minor edit, one new page
			bot: false,
			comment: false,
			editCount: 2,
			expiry: false,
			fromRev: 1,
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

	QUnit.test( 'watchlistUtils.normalizeEntries', ( assert ) => {
		// Only fill in the parts that would otherwise be normalized
		const edit = {
			anon: true,
			temp: false,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit',
			user: ''
		};
		const normalizedEdit = {
			anon: true,
			temp: false,
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

		const hiddenEditor = {
			anon: false,
			temp: false,
			userhidden: true,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit'
		};
		const normalizedHiddenEditor = {
			anon: false,
			temp: false,
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

		const editWithNoSummary = {
			anon: false,
			temp: true,
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'edit'
		};
		const normalizedEditWithNoSummary = {
			anon: false,
			temp: true,
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

		const editWithNoTags = {
			anon: false,
			temp: false,
			parsedcomment: '',
			timestamp: '2020-08-31 12:00',
			type: 'edit'
		};
		const normalizedEditWithNoTags = {
			anon: false,
			temp: false,
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

		const newPage = {
			anon: true,
			temp: true,
			parsedcomment: 'comment',
			tags: [],
			timestamp: '2020-08-31 12:00',
			type: 'new'
		};
		const normalizedNewPage = {
			anon: true,
			temp: true,
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

	QUnit.test( 'WatchlistUtils.getFinalEntries (entry flags)', ( assert ) => {
		const allEntries = [];
		const expectedEntries = [];
		let withoutFlags;
		let withFlags;
		const newPageFlag = mw.msg( 'newpageletter' );
		const minorFlag = mw.msg( 'minoreditletter' );
		const botFlag = mw.msg( 'boteditletter' );

		/* We use bitwise comparisons to simplify looping through all possible flag combinations */
		/* eslint-disable no-bitwise */
		for ( let iii = 0; iii <= 7; iii++ ) {
			withoutFlags = {
				newPage: ( ( iii & 1 ) === 1 ),
				minor: ( ( iii & 2 ) === 2 ),
				bot: ( ( iii & 4 ) === 4 )
			};
			allEntries.push( withoutFlags );

			// Expected result, only the `flags` is saved (GlobalWatchlistEntryEdits also
			// saves the `newPage` prop, but since it isn't changed we can just focus on
			// testing that the `flags` was computed properly;includes the original properties
			withFlags = {};
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
		const result = getFilteredEntries(
			watchlistUtils.getFinalEntries( allEntries, {}, GlobalWatchlistEntryBase ),
			[ 'flags' ]
		);
		assert.deepEqual(
			result,
			expectedEntries,
			'Flags are added to entries marked as new pages / minor edits / bot actions'
		);
	} );

	QUnit.test( 'WatchlistUtils.getFinalEntries (truncate timestamps)', ( assert ) => {
		const originalEntries = [
			{ timestamp: false },
			{ timestamp: '2021-07-04T07:30:49Z' },
			{ timestamp: '2020-01-01T12:01:00Z' }
		];
		const expectedUpdatedEntries = [
			{ timestamp: false },
			{ timestamp: '2021-07-04 07:30' },
			{ timestamp: '2020-01-01 12:01' }
		];

		// Reduce the fully updated entries to just the parts we are checking
		const result = getFilteredEntries(
			watchlistUtils.getFinalEntries( originalEntries, {}, GlobalWatchlistEntryBase ),
			[ 'timestamp' ]
		);
		assert.deepEqual(
			result,
			expectedUpdatedEntries,
			'Timestamps are truncated to display in the form YY-MM-DD HH:MM'
		);
	} );

	QUnit.test( 'WatchlistUtils.getFinalEntries (comment displays)', ( assert ) => {
		// First two are missing a comment, third doesn't have a link, third has
		// a link to [[PageName]]. This is for en.wikipedia.org, per configuration
		// of the linker above
		const originalEntries = [
			{ comment: false },
			{ comment: '' },
			{ comment: 'foo' },
			{ comment: '<a href="/wiki/PageName" title="PageName">PageName</a>' }
		];
		// Expected result, only the `commentDisplay` is saved
		const expectedUpdatedEntries = [
			{ commentDisplay: false },
			{ commentDisplay: false },
			{ commentDisplay: ': foo' },
			{ commentDisplay: ': <a target="_blank" href="//en.wikipedia.org/wiki/PageName" title="PageName">PageName</a>' }
		];

		// Reduce the fully updated entries to just the parts we are checking
		const result = getFilteredEntries(
			watchlistUtils.getFinalEntries( originalEntries, {}, GlobalWatchlistEntryBase ),
			[ 'commentDisplay' ]
		);
		assert.deepEqual(
			result,
			expectedUpdatedEntries,
			'leading ": " are added to comments, and links are updated, when there is a comment'
		);
	} );

	/* eslint-enable camelcase */
}() );
