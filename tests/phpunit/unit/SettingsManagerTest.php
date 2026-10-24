<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Unit;

use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWiki\Json\FormatJson;
use MediaWiki\User\Options\UserOptionsManager;
use MediaWiki\User\User;
use MediaWikiUnitTestCase;
use Psr\Log\LogLevel;
use TestLogger;
use Wikimedia\TestingAccessWrapper;

/**
 * @author DannyS712
 * @covers \MediaWiki\Extension\GlobalWatchlist\SettingsManager
 */
class SettingsManagerTest extends MediaWikiUnitTestCase {

	private function getManager(
		$logger,
		$userOptionsManager = null
	) {
		if ( $userOptionsManager === null ) {
			$userOptionsManager = $this->createMock( UserOptionsManager::class );
		}
		$manager = new SettingsManager(
			$logger,
			$userOptionsManager
		);

		return TestingAccessWrapper::newFromObject( $manager );
	}

	public function testSaveSettings() {
		// Save settings, user does not have existing settings
		$logger = new TestLogger( true );

		$user = $this->createMock( User::class );

		$validSettings = [
			'sites' => [ 'en.wikipedia.org' ],
			'showtypes' => [ 'edit' ],
			'anonfilter' => SettingsManager::FILTER_EITHER,
			'botfilter' => SettingsManager::FILTER_EITHER,
			'minorfilter' => SettingsManager::FILTER_EITHER,
		];
		$strSettings = FormatJson::encode(
			[ 'version' => SettingsManager::PREFERENCE_VERSION ] + $validSettings
		);

		$userOptionsManager = $this->createMock( UserOptionsManager::class );
		$userOptionsManager->expects( $this->once() )
			->method( 'setOption' )
			->with(
				$user,
				SettingsManager::PREFERENCE_NAME,
				$strSettings
			);
		$userOptionsManager->expects( $this->once() )
			->method( 'saveOptions' )
			->with( $user );

		$manager = $this->getManager( $logger, $userOptionsManager );

		$manager->saveUserOptions( $user, $validSettings );

		$debugEntries = [
			[ LogLevel::INFO, "Saving options for {username}: {userOptions}" ],
		];
		$this->assertArrayEquals( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function testSaveOptionsInternal() {
		$logger = new TestLogger( true );
		$newOptions = 'NewOptionsGoHere';

		$user = $this->createMock( User::class );

		$userOptionsManager = $this->createMock( UserOptionsManager::class );
		$userOptionsManager->expects( $this->once() )
			->method( 'setOption' )
			->with(
				$user,
				SettingsManager::PREFERENCE_NAME,
				$newOptions
			);
		$userOptionsManager->expects( $this->once() )
			->method( 'saveOptions' )
			->with( $user );

		$manager = $this->getManager(
			$logger,
			$userOptionsManager
		);

		$manager->saveOptionsInternal( $user, $newOptions );

		$this->assertSame( [
			[ LogLevel::INFO, "Saving options for {username}: {userOptions}" ],
		], $logger->getBuffer() );
		$logger->clearBuffer();
	}

}
