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
		$userGlobalJS = $user->getUserPage()->getSubPage( 'global.js' );

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

		// Test that it was created properly:
		$result = $this->doApiRequest(
			[
				'action' => 'query',
				'prop' => 'revisions',
				'titles' => $userGlobalJS->getPrefixedText(),
				'rvprop' => 'content',
				'rvslots' => 'main'
			]
		);

		$this->assertArrayHasKey( 'query', $result[0] );
		$this->assertArrayHasKey( 'pages', $result[0]['query'] );
		$pages = array_values( $result[0]['query']['pages'] );

		$this->assertArrayHasKey( 'revisions', $pages[0] );
		$slot = $pages[0]['revisions'][0]['slots']['main'];

		$content = $slot['content'];

		$this->assertStringContainsString(
			"window.GlobalWatchlistSettings =",
			$content,
			'Settings were added to the user global.js page'
		);
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
