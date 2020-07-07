<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use ApiTestCase;
use ApiUsageException;

/**
 * Tests settings are saved via the api
 *
 * @author DannyS712
 * @covers \MediaWiki\Extension\GlobalWatchlist\ApiGlobalWatchlistSettings
 * @group medium
 * @group API
 * @group Database
 */
class ApiGlobalWatchlistSettingsTest extends ApiTestCase {

	public function testApiGlobalWatchlistSettings() {
		$user = $this->getTestUser()->getUser();

		$this->doApiRequestWithToken(
			[
				'action' => 'globalwatchlistsettings',
				'sites' => 'en.wikipedia.org',
				'anonfilter' => '0',
				'botfilter' => '1',
				'minorfilter' => '2'
			],
			null,
			$user
		);

		// Test that the option was saved
		$result = $this->doApiRequest(
			[
				'action' => 'query',
				'meta' => 'userinfo',
				'uiprop' => 'options'
			],
			null,
			$user
		);

		$this->assertArrayHasKey( 'query', $result[0] );
		$this->assertArrayHasKey( 'userinfo', $result[0]['query'] );
		$this->assertArrayHasKey( 'options', $result[0]['query']['userinfo'] );

		$options = $result[0]['query']['userinfo']['options'];

		$this->assertArrayHasKey( SettingsManager::PREFERENCE_NAME, $options );
	}

	public function testInvalidSettings() {
		$user = $this->getTestUser()->getUser();

		$this->expectException( ApiUsageException::class );

		// Trying to filter for anonymous bot edits
		$this->doApiRequestWithToken(
			[
				'action' => 'globalwatchlistsettings',
				'sites' => 'en.wikipedia.org',
				'anonfilter' => '1',
				'botfilter' => '1',
				'minorfilter' => '0'
			],
			null,
			$user
		);
	}

}
