<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use MediaWiki\MediaWikiServices;
use MediaWikiIntegrationTestCase;

/**
 * Test that service wiring worked and service is registered and available
 *
 * @author DannyS712
 * @coversNothing Not possible to cover non-classes/functions
 */
class ServiceWiringTest extends MediaWikiIntegrationTestCase {

	public function testServices() {
		$settingsManager = MediaWikiServices::getInstance()
			->getService( 'GlobalWatchlistSettingsManager' );

		$this->assertInstanceOf( SettingsManager::class, $settingsManager );
	}

}
