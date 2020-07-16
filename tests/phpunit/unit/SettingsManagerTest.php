<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use FormatJson;
use IBufferingStatsdDataFactory;
use MediaWiki\User\UserOptionsManager;
use MediaWikiUnitTestCase;
use Psr\Log\LogLevel;
use TestLogger;
use User;
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
		$accessManager = TestingAccessWrapper::newFromObject( $manager );
		return $accessManager;
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
			$validSettings + [ 'version' => SettingsManager::PREFERENCE_VERSION ]
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

		$res = $manager->saveUserOptions( $user, $validSettings );

		$this->assertArrayEquals(
			[],
			$res,
			'No errors saving settings'
		);

		$debugEntries = [
			[ LogLevel::DEBUG, 'Validating user options' ],
			[ LogLevel::DEBUG, 'No issues found' ],
			[ LogLevel::DEBUG, "Saving options for {username}: {userOptions}" ],
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

	public function provideTestLogSettingsChange() {
		return [
			'no existing settings' => [ false ],
			'with existing settings' => [ true ]
		];
	}

	/**
	 * @dataProvider provideTestSaveOptions_invalid
	 * @param bool $noTypes
	 * @param bool $anonBot
	 * @param bool $anonMinor
	 */
	public function testSaveOptions_invalid(
		bool $noTypes,
		bool $anonBot,
		bool $anonMinor
	) {
		// If a user tries to save invalid options, they should nevet get to the point
		// of options being saved
		$userOptionsManager = $this->createNoOpMock( UserOptionsManager::class );

		$logger = new TestLogger( true );
		$manager = $this->getManager( $logger );

		$invalidSettings = [
			'sites' => [ 'en.wikipedia.org' ],
			'showtypes' => $noTypes ? [] : [ 'edit' ],
			'anonfilter' => SettingsManager::FILTER_REQUIRE,
			'botfilter' => $anonBot ?
				SettingsManager::FILTER_REQUIRE :
				SettingsManager::FILTER_EITHER,
			'minorfilter' => $anonMinor ?
				SettingsManager::FILTER_REQUIRE :
				SettingsManager::FILTER_EITHER,
		];

		$user = $this->createMock( User::class );
		$status = $manager->saveUserOptions( $user, $invalidSettings );

		$errors = [];
		$debugEntries = [ [ LogLevel::DEBUG, 'Validating user options' ] ];
		if ( $noTypes ) {
			$errors[] = 'no-types';
			$debugEntries[] = [ LogLevel::DEBUG, 'No types of changes chosen' ];
		}
		if ( $anonBot ) {
			$errors[] = 'anon-bot';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-bot edits' ];
		}
		if ( $anonMinor ) {
			$errors[] = 'anon-minor';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-minor edits' ];
		}

		$this->assertArrayEquals( $errors, $status );

		$this->assertSame( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function provideTestSaveOptions_invalid() {
		return [
			'only no types' => [ true, false, false ],
			'only anon-bot' => [ false, true, false ],
			'only anon-minor' => [ false, false, true ],
			'everything' => [ true, true, true ],
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
			[ LogLevel::DEBUG, "Saving options for {username}: {userOptions}" ],
		], $logger->getBuffer() );
		$logger->clearBuffer();
	}

	/**
	 * @dataProvider provideTestValidateSettings
	 * @param bool $noTypes
	 * @param bool $anonBot
	 * @param bool $anonMinor
	 */
	public function testValidateSettings(
		bool $noTypes,
		bool $anonBot,
		bool $anonMinor
	) {
		$logger = new TestLogger( true );
		$manager = $this->getManager( $logger );

		$invalidSettings = [
			'sites' => [ 'en.wikipedia.org' ],
			'showtypes' => $noTypes ? [] : [ 'edit' ],
			'anonfilter' => SettingsManager::FILTER_REQUIRE,
			'botfilter' => $anonBot ?
				SettingsManager::FILTER_REQUIRE :
				SettingsManager::FILTER_EITHER,
			'minorfilter' => $anonMinor ?
				SettingsManager::FILTER_REQUIRE :
				SettingsManager::FILTER_EITHER,
		];

		$status = $manager->validateSettings( $invalidSettings );

		$errors = [];
		$debugEntries = [ [ LogLevel::DEBUG, 'Validating user options' ] ];
		if ( $noTypes ) {
			$errors[] = 'no-types';
			$debugEntries[] = [ LogLevel::DEBUG, 'No types of changes chosen' ];
		}
		if ( $anonBot ) {
			$errors[] = 'anon-bot';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-bot edits' ];
		}
		if ( $anonMinor ) {
			$errors[] = 'anon-minor';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-minor edits' ];
		}
		if ( !( $noTypes || $anonBot || $anonMinor ) ) {
			$debugEntries[] = [ LogLevel::DEBUG, 'No issues found' ];
		}

		$this->assertArrayEquals( $errors, $status );

		$this->assertSame( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function provideTestValidateSettings() {
		return [
			'no errors' => [ false, false, false ],
			'only no types' => [ true, false, false ],
			'only anon-bot' => [ false, true, false ],
			'only anon-minor' => [ false, false, true ],
			'everything' => [ true, true, true ],
		];
	}

	public function testValidateSettings_noSites() {
		$logger = new TestLogger( true );
		$manager = $this->getManager( $logger );

		$invalidSettings = [
			'sites' => [],
			'showtypes' => [ 'edit' ],
			'anonfilter' => SettingsManager::FILTER_REQUIRE,
			'botfilter' => SettingsManager::FILTER_EITHER,
			'minorfilter' => SettingsManager::FILTER_EXCLUDE,
		];

		$status = $manager->validateSettings( $invalidSettings );

		$this->assertSame(
			$status,
			[ 'no-sites' ]
		);

		$this->assertSame( [
			[ LogLevel::DEBUG, 'Validating user options' ],
			[ LogLevel::DEBUG, 'No sites provided' ],
		], $logger->getBuffer() );
		$logger->clearBuffer();
	}

}
