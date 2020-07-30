( function () {
	var GlobalWatchlistDebugger = require( '../../../modules/ext.globalwatchlist.debug.js' );

	QUnit.module( 'ext.globalwatchlist.debug', QUnit.newMwEnvironment() );

	QUnit.test( 'debug.debugLevel', function ( assert ) {
		var globalWatchlistDebug = new GlobalWatchlistDebugger();

		assert.strictEqual(
			globalWatchlistDebug.debugLevel,
			100,
			'debugLevel has a default (100)'
		);

		globalWatchlistDebug = new GlobalWatchlistDebugger( 1 );

		assert.strictEqual(
			globalWatchlistDebug.debugLevel,
			1,
			'When constructing a new GlobalWatchlistDebugger the debugLevel can be set'
		);

	} );

	QUnit.test( 'debug.info', function ( assert ) {
		var globalWatchlistDebug = new GlobalWatchlistDebugger();

		globalWatchlistDebug.info( 'keyGoesHere', 'messageGoesHere', 1 );
		var expectedMessage = '0: keyGoesHere\t"messageGoesHere"';

		assert.deepEqual(
			globalWatchlistDebug.debugLog,
			[ expectedMessage ],
			'Messages sent to the GlobalWatchlistDebugger should be added to the log'
		);
	} );

	QUnit.test( 'debug.error', function ( assert ) {
		var globalWatchlistDebug = new GlobalWatchlistDebugger();
		var originalError = new Error( 'ErrorStuffGoesHere' );

		assert.throws(
			function () {
				globalWatchlistDebug.error(
					'errorInfoGoesHere',
					originalError
				);
			},
			function ( err ) {
				return err.toString() === originalError.toString()
			},
			'Errors sent to the GlobalWatchlistDebugger should be thrown'
		);

		assert.throws(
			function () {
				globalWatchlistDebug.error(
					'errorInfoGoesHere',
					'theThingThatWentWrong'
				);
			},
			/GlobalWatchlistError/,
			'GlobalWatchlistDebugger creates an error if called without one'
		);

		assert.strictEqual(
			globalWatchlistDebug.debugLog.length,
			2,
			'GlobalWatchlistDebugger also logs errors'
		);
	} );

}() );
