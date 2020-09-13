( function () {
	var GlobalWatchlistLinker = require( '../../../modules/Linker.js' );

	QUnit.module( 'ext.globalwatchlist.linker', QUnit.newMwEnvironment( {
		config: {
			wgArticlePath: '/wiki/$1/FooBar',
			wgScript: '/w/baz/index.php'
		}
	} ) );

	QUnit.test( 'linker.fixLocalLinks', function ( assert ) {
		var linker = new GlobalWatchlistLinker( 'en.wikipedia.org' );

		// [[PageName]]
		var localLink = '<a href="/wiki/PageName" title="PageName">PageName</a>';
		var foreignLink = '<a href="//en.wikipedia.org/wiki/PageName" title="PageName">PageName</a>';

		assert.strictEqual(
			linker.fixLocalLinks( localLink ),
			foreignLink,
			'Local links are converted to foreign links properly'
		);
	} );

	QUnit.test( 'linker.linkPage', function ( assert ) {
		var linker = new GlobalWatchlistLinker( 'en.wikipedia.org' );

		assert.strictEqual(
			linker.linkPage( 'PageTitle' ),
			'//en.wikipedia.org/wiki/PageTitle/FooBar',
			'linkPage matches expected'
		);
	} );

	QUnit.test( 'linker.linkQuery', function ( assert ) {
		var linker = new GlobalWatchlistLinker( 'en.wikipedia.org' );

		assert.strictEqual(
			linker.linkQuery( 'title=pagetitle&action=someaction' ),
			'//en.wikipedia.org/w/baz/index.php?title=pagetitle&action=someaction',
			'linkQuery matches expected'
		);
	} );

}() );
