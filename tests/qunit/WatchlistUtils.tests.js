( function () {
	var GlobalWatchlistWatchlistUtils = require( '../../../modules/WatchlistUtils.js' );
	var GlobalWatchlistLinker = require( '../../../modules/Linker.js' );

	// Set config variables so that the linker can be created properly
	QUnit.module( 'ext.globalwatchlist.WatchlistUtils', QUnit.newMwEnvironment( {
		config: {
			wgArticlePath: '/wiki/$1/FooBar',
			wgScript: '/w/baz/index.php'
		}
	} ) );

	// The linker isn't actually needed for anything that we are testing, but needs to be
	// provided
	var watchlistUtils = new GlobalWatchlistWatchlistUtils(
		new GlobalWatchlistLinker( 'en.wikipedia.org' )
	);

	/* eslint-disable camelcase */
	QUnit.test( 'watchlistUtils.mergePageEdits', function ( assert ) {
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
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: true,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			toRev: 3
		};
		var mergedEdits_b = {
			// Both bot edits, only one minor edit, neither new page
			bot: true,
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: false,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			toRev: 3
		};
		var mergedEdits_c = {
			// Only one bot edit, both minor edits, neither new page
			bot: false,
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: true,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			toRev: 3
		};
		var mergedEdits_d = {
			// Only one bot edit, only one minor edit, neither new page
			bot: false,
			editCount: 2,
			expiry: false,
			fromRev: 1,
			minor: false,
			newPage: false,
			tags: [],
			timestamp: '2020-08-31 12:00',
			toRev: 3
		};
		var mergedEdits_e = {
			// Only one bot edit, only one minor edit, one new page
			bot: false,
			editCount: 2,
			expiry: false,
			fromRev: 0,
			minor: false,
			newPage: true,
			tags: [],
			timestamp: '2020-08-31 12:00',
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
			old_revid: 0,
			revid: 0,
			user: ''
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ newPage ] ),
			[ normalizedNewPage ],
			'New pages are normalized to entries with a flag'
		);
	} );

	/* eslint-enable camelcase */
}() );
