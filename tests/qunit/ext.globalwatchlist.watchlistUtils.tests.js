( function () {
	var watchlistUtils = require( '../../../modules/ext.globalwatchlist.watchlistUtils.js' );

	QUnit.module( 'ext.globalwatchlist.watchlistUtils', QUnit.newMwEnvironment() );

	/* eslint-disable camelcase */
	QUnit.test( 'watchlistUtils.mergePageEdits', function ( assert ) {
		var edit1 = {
			// Bot edit, minor edit, not a new page
			bot: true,
			old_revid: 1,
			minor: true,
			newPage: false,
			revid: 2
		};
		var edit2_a = {
			// Bot edit, minor edit, not a new page
			bot: true,
			old_revid: 2,
			minor: true,
			newPage: false,
			revid: 3
		};
		var edit2_b = {
			// Bot edit, not a minor edit, not a new page
			bot: true,
			old_revid: 2,
			minor: false,
			newPage: false,
			revid: 3
		};
		var edit2_c = {
			// Not a bot edit, minor edit, not a new page
			bot: false,
			old_revid: 2,
			minor: true,
			newPage: false,
			revid: 3
		};
		var edit2_d = {
			// Not a bot edit, not a minor edit, not a new page
			bot: false,
			old_revid: 2,
			minor: false,
			newPage: false,
			revid: 3
		};
		var edit2_e = {
			// Not a bot edit, not a minor edit, new page
			bot: false,
			old_revid: 0,
			minor: false,
			newPage: true,
			revid: 0
		};

		var mergedEdits_a = {
			// Both bot edits, both minor edits, neither new page
			bot: true,
			editCount: 2,
			fromRev: 1,
			minor: true,
			newPage: false,
			tags: [],
			toRev: 3
		};
		var mergedEdits_b = {
			// Both bot edits, only one minor edit, neither new page
			bot: true,
			editCount: 2,
			fromRev: 1,
			minor: false,
			newPage: false,
			tags: [],
			toRev: 3
		};
		var mergedEdits_c = {
			// Only one bot edit, both minor edits, neither new page
			bot: false,
			editCount: 2,
			fromRev: 1,
			minor: true,
			newPage: false,
			tags: [],
			toRev: 3
		};
		var mergedEdits_d = {
			// Only one bot edit, only one minor edit, neither new page
			bot: false,
			editCount: 2,
			fromRev: 1,
			minor: false,
			newPage: false,
			tags: [],
			toRev: 3
		};
		var mergedEdits_e = {
			// Only one bot edit, only one minor edit, one new page
			bot: false,
			editCount: 2,
			fromRev: 0,
			minor: false,
			newPage: true,
			tags: [],
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
			type: 'edit',
			user: ''
		};
		var normalizedEdit = {
			anon: true,
			parsedcomment: 'comment',
			tags: [],
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
			type: 'edit'
		};
		var normalizedHiddenEditor = {
			anon: false,
			userhidden: true,
			user: '##hidden##',
			parsedcomment: 'comment',
			tags: [],
			type: 'edit',
			newPage: false
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ hiddenEditor ] ),
			[ normalizedHiddenEditor ],
			'Edits by hidden users are flagged as user=##hidden##'
		);

		var userEdit = {
			parsedcomment: 'comment',
			tags: [],
			type: 'edit'
		};
		var normalizedUserEdit = {
			anon: false,
			parsedcomment: 'comment',
			tags: [],
			type: 'edit',
			newPage: false,
			user: ''
		};
		assert.deepEqual(
			watchlistUtils.normalizeEntries( [ userEdit ] ),
			[ normalizedUserEdit ],
			'Edits by users flagged as anon=false'
		);

		var editWithNoSummary = {
			anon: false,
			tags: [],
			type: 'edit'
		};
		var normalizedEditWithNoSummary = {
			anon: false,
			parsedcomment: '',
			tags: [],
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
			type: 'edit'
		};
		var normalizedEditWithNoTags = {
			anon: false,
			parsedcomment: '',
			tags: [],
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
			type: 'new'
		};
		var normalizedNewPage = {
			anon: true,
			parsedcomment: 'comment',
			tags: [],
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

	QUnit.test( 'watchlistUtils.putNewPagesFirst', function ( assert ) {
		var edit1 = { newPage: false },
			edit2 = { newPage: false },
			edit3 = { newPage: false },
			newPage1 = { newPage: true },
			newPage2 = { newPage: true },
			newPage3 = { newPage: true };

		assert.deepEqual(
			watchlistUtils.putNewPagesFirst( [ edit1, edit2, edit3 ] ),
			[ edit1, edit2, edit3 ],
			'Does not change the relative order of edits'
		);
		assert.deepEqual(
			watchlistUtils.putNewPagesFirst( [ newPage1, newPage2, edit1, edit2 ] ),
			[ newPage1, newPage2, edit1, edit2 ],
			'Correct order of entries is unchanged'
		);
		assert.deepEqual(
			watchlistUtils.putNewPagesFirst( [ newPage3, newPage2, newPage1 ] ),
			[ newPage3, newPage2, newPage1 ],
			'Does not change the relative order of new pages'
		);
		assert.deepEqual(
			watchlistUtils.putNewPagesFirst( [ edit1, newPage1, newPage2, edit2, edit3, newPage3 ] ),
			[ newPage1, newPage2, newPage3, edit1, edit2, edit3 ],
			'Puts new pages first, then edits, respecting relative order of each'
		);
	} );

	/* eslint-enable camelcase */
}() );
