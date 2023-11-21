<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Integration;

use MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistGuidedTourHooks;
use MediaWikiIntegrationTestCase;

/**
 * Tests for the hook handler
 * @covers \MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistGuidedTourHooks
 */
class GlobalWatchlistGuidedTourHooksTest extends MediaWikiIntegrationTestCase {

	public function testNewFromGlobalState() {
		$hookHandler = GlobalWatchlistGuidedTourHooks::newFromGlobalState();
		$this->assertInstanceOf(
			GlobalWatchlistGuidedTourHooks::class,
			$hookHandler
		);
	}

}
