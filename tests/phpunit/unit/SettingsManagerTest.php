<?php

namespace MediaWiki\Extension\GlobalWatchlist;

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
		$userOptionsManager = null
	) {
		if ( $userOptionsManager === null ) {
			$userOptionsManager = $this->createMock( UserOptionsManager::class );
		}
		$manager = new SettingsManager(
			$logger,
			$userOptionsManager
		);
		$accessManager = TestingAccessWrapper::newFromObject( $manager );
		return $accessManager;
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
			'anonfilter' => 1,
			'botfilter' => $anonBot ? 1 : 0,
			'minorfilter' => $anonMinor ? 1 : 0,
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
			'anonfilter' => 1,
			'botfilter' => $anonBot ? 1 : 0,
			'minorfilter' => $anonMinor ? 1 : 0,
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
			'anonfilter' => 1,
			'botfilter' => 0,
			'minorfilter' => 0,
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
