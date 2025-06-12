<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Integration;

use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWikiIntegrationTestCase;

/**
 * Test that service wiring worked and service is registered and available
 *
 * @author DannyS712
 * @coversNothing Not possible to cover non-classes/functions
 */
class ServiceWiringTest extends MediaWikiIntegrationTestCase {

	public function testServices() {
		$settingsManager = $this->getServiceContainer()
			->getService( 'GlobalWatchlistSettingsManager' );

		$this->assertInstanceOf( SettingsManager::class, $settingsManager );
	}

}
