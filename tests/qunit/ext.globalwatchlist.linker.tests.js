( function () {
	var GlobalWatchlistLinker = require( '../../../modules/ext.globalwatchlist.linker.js' );

	QUnit.module( 'ext.globalwatchlist.linker', QUnit.newMwEnvironment( {
		config: {
			wgArticlePath: '/wiki/$1/FooBar',
			wgScript: '/w/baz/index.php'
		}
	} ) );

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
