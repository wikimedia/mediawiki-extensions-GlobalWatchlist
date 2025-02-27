( function () {
	const GlobalWatchlistDebugger = require( 'ext.globalwatchlist.specialglobalwatchlist/Debug.js' );

	QUnit.module( 'ext.globalwatchlist.specialglobalwatchlist/Debug', QUnit.newMwEnvironment( {
		config: {
			wgGlobalWatchlistDevMode: true
		}
	} ) );

	QUnit.test( 'debug.console', ( assert ) => {
		const globalWatchlistDebug = new GlobalWatchlistDebugger();

		assert.strictEqual(
			globalWatchlistDebug.sendToConsole,
			true,
			'sendToConsole is based on wgGlobalWatchlistDevMode'
		);

	} );

	QUnit.test( 'debug.info', ( assert ) => {
		const globalWatchlistDebug = new GlobalWatchlistDebugger();

		globalWatchlistDebug.info( 'messageGoesHere', 'extraInfoGoesHere' );
		const expectedMessage = '0: messageGoesHere\t"extraInfoGoesHere"';

		assert.deepEqual(
			globalWatchlistDebug.debugLog,
			[ expectedMessage ],
			'Messages sent to the GlobalWatchlistDebugger should be added to the log'
		);
	} );

	QUnit.test( 'debug.error', function ( assert ) {
		const globalWatchlistDebug = new GlobalWatchlistDebugger();
		const originalError = new Error( 'ErrorStuffGoesHere' );

		const consoleError = this.sandbox.stub( console, 'error' );

		globalWatchlistDebug.error( 'errorInfoGoesHere', originalError );
		globalWatchlistDebug.error( 'errorInfoGoesHere', 'theThingThatWentWrong' );

		assert.strictEqual(
			consoleError.callCount,
			2,
			'GlobalWatchlistDebugger sends to console.error'
		);

		assert.strictEqual(
			globalWatchlistDebug.debugLog.length,
			2,
			'GlobalWatchlistDebugger also logs errors'
		);
	} );

}() );
