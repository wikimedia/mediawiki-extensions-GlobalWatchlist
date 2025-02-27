( function () {
	const GlobalWatchlistLinker = require( 'ext.globalwatchlist.specialglobalwatchlist/Linker.js' );

	QUnit.module( 'ext.globalwatchlist.specialglobalwatchlist/Linker', QUnit.newMwEnvironment( {
		config: {
			wgArticlePath: '/wiki/$1/FooBar',
			wgScript: '/w/baz/index.php'
		}
	} ) );

	QUnit.test( 'linker.fixLocalLinks', ( assert ) => {
		const linker = new GlobalWatchlistLinker( 'en.wikipedia.org' );

		// [[PageName]]
		const localLink = '<a href="/wiki/PageName" title="PageName">PageName</a>';
		const foreignLink = '<a href="//en.wikipedia.org/wiki/PageName" title="PageName">PageName</a>';

		assert.strictEqual(
			linker.fixLocalLinks( localLink ),
			foreignLink,
			'Local links are converted to foreign links properly'
		);
	} );

	QUnit.test( 'linker.linkPage', ( assert ) => {
		const linker = new GlobalWatchlistLinker( 'en.wikipedia.org' );

		assert.strictEqual(
			linker.linkPage( 'PageTitle' ),
			'//en.wikipedia.org/wiki/PageTitle/FooBar',
			'linkPage matches expected'
		);
	} );

	QUnit.test( 'linker.linkQuery', ( assert ) => {
		const linker = new GlobalWatchlistLinker( 'en.wikipedia.org' );

		assert.strictEqual(
			linker.linkQuery( 'title=pagetitle&action=someaction' ),
			'//en.wikipedia.org/w/baz/index.php?title=pagetitle&action=someaction',
			'linkQuery matches expected'
		);
	} );

}() );
