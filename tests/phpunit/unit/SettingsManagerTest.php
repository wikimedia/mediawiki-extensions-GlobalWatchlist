<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Unit;

use FormatJson;
use IBufferingStatsdDataFactory;
use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWiki\User\Options\UserOptionsManager;
use MediaWiki\User\User;
use MediaWikiUnitTestCase;
use Psr\Log\LogLevel;
use TestLogger;
use Wikimedia\TestingAccessWrapper;

/**
 * Test internals of SettingsManager
 *
 * @author DannyS712
 * @covers \MediaWiki\Extension\GlobalWatchlist\SettingsManager
 */
class SettingsManagerTest extends MediaWikiUnitTestCase {

	private function getManager(
		$logger,
		$userOptionsManager = null,
		$statsdDataFactory = null
	) {
		if ( $userOptionsManager === null ) {
			$userOptionsManager = $this->createMock( UserOptionsManager::class );
		}
		if ( $statsdDataFactory === null ) {
			$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );
		}
		$manager = new SettingsManager(
			$logger,
			$userOptionsManager,
			$statsdDataFactory
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
			->method( 'getOption' )
			->with(
				$this->equalTo( $user ),
				$this->equalTo( SettingsManager::PREFERENCE_NAME ),
				$this->equalTo( false )
			)
			->willReturn( false );
		$userOptionsManager->expects( $this->once() )
			->method( 'setOption' )
			->with(
				$this->equalTo( $user ),
				$this->equalTo( SettingsManager::PREFERENCE_NAME ),
				$this->equalTo( $strSettings )
			);
		$userOptionsManager->expects( $this->once() )
			->method( 'saveOptions' )
			->with(
				$this->equalTo( $user )
			);

		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );
		$statsdDataFactory->expects( $this->once() )
			->method( 'increment' )
			->with( 'globalwatchlist.settings.new' );

		$manager = $this->getManager( $logger, $userOptionsManager, $statsdDataFactory );

		$manager->saveUserOptions( $user, $validSettings );

		$debugEntries = [
			[ LogLevel::INFO, "Saving options for {username}: {userOptions}" ],
		];
		$this->assertArrayEquals( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	/**
	 * @dataProvider provideTestLogSettingsChange
	 * @param bool $hasExistingSettings
	 */
	public function testLogSettingsChange( bool $hasExistingSettings ) {
		$logger = new TestLogger();

		$user = $this->createMock( User::class );

		$userOptionsManager = $this->createMock( UserOptionsManager::class );
		$userOptionsManager->expects( $this->once() )
			->method( 'getOption' )
			->with(
				$this->equalTo( $user ),
				$this->equalTo( SettingsManager::PREFERENCE_NAME ),
				$this->equalTo( false )
			)
			->willReturn( $hasExistingSettings );

		$metric = $hasExistingSettings ?
			'globalwatchlist.settings.change' :
			'globalwatchlist.settings.new';

		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );
		$statsdDataFactory->expects( $this->once() )
			->method( 'increment' )
			->with( $metric );

		$manager = $this->getManager( $logger, $userOptionsManager, $statsdDataFactory );

		$manager->logSettingsChange( $user );
	}

	public static function provideTestLogSettingsChange() {
		return [
			'no existing settings' => [ false ],
			'with existing settings' => [ true ]
		];
	}

	public function testSaveOptionsInternal() {
		$logger = new TestLogger( true );
		$newOptions = 'NewOptionsGoHere';

		$user = $this->createMock( User::class );

		$userOptionsManager = $this->createMock( UserOptionsManager::class );
		$userOptionsManager->expects( $this->once() )
			->method( 'setOption' )
			->with(
				$this->equalTo( $user ),
				$this->equalTo( SettingsManager::PREFERENCE_NAME ),
				$this->equalTo( $newOptions )
			);
		$userOptionsManager->expects( $this->once() )
			->method( 'saveOptions' )
			->with(
				$this->equalTo( $user )
			);

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
