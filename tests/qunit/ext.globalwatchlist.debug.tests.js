( function () {
	var GlobalWatchlistDebugger = require( '../../../modules/ext.globalwatchlist.debug.js' );

	QUnit.module( 'ext.globalwatchlist.debug', QUnit.newMwEnvironment( {
		config: {
			wgGlobalWatchlistDevMode: true
		}
	} ) );

	QUnit.test( 'debug.console', function ( assert ) {
		var globalWatchlistDebug = new GlobalWatchlistDebugger();

		assert.strictEqual(
			globalWatchlistDebug.sendToConsole,
			true,
			'sendToConsole is based on wgGlobalWatchlistDevMode'
		);

	} );

	QUnit.test( 'debug.info', function ( assert ) {
		var globalWatchlistDebug = new GlobalWatchlistDebugger();

		globalWatchlistDebug.info( 'messageGoesHere', 'extraInfoGoesHere' );
		var expectedMessage = '0: messageGoesHere\t"extraInfoGoesHere"';

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
