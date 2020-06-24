<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use InvalidArgumentException;
use JavaScriptContent;
use JavaScriptContentHandler;
use MediaWikiUnitTestCase;
use Psr\Log\LogLevel;
use Status;
use TestLogger;
use User;
use Wikimedia\TestingAccessWrapper;
use WikiPage;

/**
 * Test internals of SettingsManager
 *
 * @author DannyS712
 * @covers \MediaWiki\Extension\GlobalWatchlist\SettingsManager
 */
class SettingsManagerTest extends MediaWikiUnitTestCase {

	private function getManager(
		$logger,
		$javascriptContentHandler = null
	) {
		if ( $javascriptContentHandler === null ) {
			$javascriptContentHandler = $this->createMock( JavascriptContentHandler::class );
		}
		$manager = new SettingsManager(
			$logger,
			$javascriptContentHandler
		);
		$accessManager = TestingAccessWrapper::newFromObject( $manager );
		return $accessManager;
	}

	/**
	 * @dataProvider provideTestValidateSettings
	 * @param bool $emptySite
	 * @param bool $noTypes
	 * @param bool $anonBot
	 * @param bool $anonMinor
	 */
	public function testSaveOptions_invalid(
		bool $emptySite,
		bool $noTypes,
		bool $anonBot,
		bool $anonMinor
	) {
		// If a user tries to save invalid options, they should nevet get to the point
		// of `getUserPage` being called
		$user = $this->createMock( User::class );
		$user->expects( $this->never() )
			->method( 'getUserPage' );

		$logger = new TestLogger( true );
		$manager = $this->getManager( $logger );

		$invalidSettings = [
			'sites' => [
				$emptySite ? ' ' : 'en.wikipedia.org'
			],
			'showtypes' => $noTypes ? [] : [ 'edit' ],
			'anonfilter' => 1,
			'botfilter' => $anonBot ? 1 : 0,
			'minorfilter' => $anonMinor ? 1 : 0,
		];

		$status = $manager->saveUserOptions( $user, $invalidSettings );

		$fatals = [];
		$debugEntries = [ [ LogLevel::DEBUG, 'Validating user options' ] ];
		if ( $emptySite ) {
			$fatals[] = 'globalwatchlist-settings-empty-site';
			$debugEntries[] = [ LogLevel::DEBUG, 'Empty site detected' ];
		}
		if ( $noTypes ) {
			$fatals[] = 'globalwatchlist-settings-no-types';
			$debugEntries[] = [ LogLevel::DEBUG, 'No types of changes chosen' ];
		}
		if ( $anonBot ) {
			$fatals[] = 'globalwatchlist-settings-anon-bot';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-bot edits' ];
		}
		if ( $anonMinor ) {
			$fatals[] = 'globalwatchlist-settings-anon-minor';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-minor edits' ];
		}

		$this->assertFalse( $status->isGood() );

		$errors = $status->getErrors();
		$errorMessages = array_map(
			function ( $error ) {
				return $error['message'];
			},
			$errors
		);

		$this->assertArrayEquals( $fatals, $errorMessages );

		$this->assertSame( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	/**
	 * @dataProvider proviteTestSaveOptionsInternal
	 * @param bool $hasContent
	 */
	public function testSaveOptionsInternal( $hasContent ) {
		$logger = new TestLogger( true );
		$newOptions = 'NewOptionsGoHere';

		$newContent = $this->createMock( JavaScriptContent::class );
		$javaScriptContentHandler = $this->createMock( JavaScriptContentHandler::class );
		$javaScriptContentHandler->expects( $this->once() )
			->method( 'unserializeContent' )
			->with( $this->equalTo(
				"window.GlobalWatchlistSettings = $newOptions;\n"
			) )
			->willReturn( $newContent );

		if ( $hasContent ) {
			// Has existing content, but its an empty string
			$currentContent = $this->createMock( JavaScriptContent::class );
			$currentContent->expects( $this->once() )
				->method( 'getText' )
				->willReturn( '' );
		} else {
			$currentContent = null;
		}

		$user = $this->createMock( User::class );
		$user->expects( $this->once() )
			->method( 'getName' )
			->willReturn( 'unused' );

		$wikiPage = $this->createMock( WikiPage::class );
		$wikiPage->expects( $this->once() )
			->method( 'getContent' )
			->willReturn( $currentContent );
		$wikiPage->expects( $this->once() )
			->method( 'doEditContent' )
			->with(
				$this->equalTo( $newContent ),
				$this->equalTo( 'Automatically updating GlobalWatchlist settings' ),
				$this->equalTo( 0 ),
				$this->equalTo( false ),
				$this->equalTo( $user )
			)
			->willReturn( Status::newGood() );

		$manager = $this->getManager(
			$logger,
			$javaScriptContentHandler
		);

		$manager->saveOptionsInternal( $user, $wikiPage, $newOptions );

		$this->assertSame( [
			[ LogLevel::DEBUG, "Saving options for {username}: {userOptions}" ],
		], $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function proviteTestSaveOptionsInternal() {
		return [
			'has existing content' => [ true ],
			'no existing content' => [ false ],
		];
	}

	/**
	 * @dataProvider provideTestValidateSettings
	 * @param bool $emptySite
	 * @param bool $noTypes
	 * @param bool $anonBot
	 * @param bool $anonMinor
	 */
	public function testValidateSettings(
		bool $emptySite,
		bool $noTypes,
		bool $anonBot,
		bool $anonMinor
	) {
		$logger = new TestLogger( true );
		$manager = $this->getManager( $logger );

		$invalidSettings = [
			'sites' => [
				$emptySite ? ' ' : 'en.wikipedia.org'
			],
			'showtypes' => $noTypes ? [] : [ 'edit' ],
			'anonfilter' => 1,
			'botfilter' => $anonBot ? 1 : 0,
			'minorfilter' => $anonMinor ? 1 : 0,
		];

		$status = $manager->validateSettings( $invalidSettings );

		$fatals = [];
		$debugEntries = [ [ LogLevel::DEBUG, 'Validating user options' ] ];
		if ( $emptySite ) {
			$fatals[] = 'globalwatchlist-settings-empty-site';
			$debugEntries[] = [ LogLevel::DEBUG, 'Empty site detected' ];
		}
		if ( $noTypes ) {
			$fatals[] = 'globalwatchlist-settings-no-types';
			$debugEntries[] = [ LogLevel::DEBUG, 'No types of changes chosen' ];
		}
		if ( $anonBot ) {
			$fatals[] = 'globalwatchlist-settings-anon-bot';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-bot edits' ];
		}
		if ( $anonMinor ) {
			$fatals[] = 'globalwatchlist-settings-anon-minor';
			$debugEntries[] = [ LogLevel::DEBUG, 'Invalid combination: anon-minor edits' ];
		}

		$this->assertFalse( $status->isGood() );

		$errors = $status->getErrors();
		$errorMessages = array_map(
			function ( $error ) {
				return $error['message'];
			},
			$errors
		);

		$this->assertArrayEquals( $fatals, $errorMessages );

		$this->assertSame( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function provideTestValidateSettings() {
		return [
			'only empty site' => [ true, false, false, false ],
			'only no types' => [ false, true, false, false ],
			'only anon-bot' => [ false, false, true, false ],
			'only anon-minor' => [ false, false, false, true ],
			'everything' => [ true, true, true, true ],
		];
	}

	public function testValidateSettings_good() {
		$logger = new TestLogger( true );
		$manager = $this->getManager( $logger );

		$validSettings = [
			'sites' => [
				'en.wikipedia.org'
			],
			'showtypes' => 'edit|new|log',
			'anonfilter' => 0,
			'botfilter' => 0,
			'minorfilter' => 0,
		];
		$status = $manager->validateSettings( $validSettings );

		$this->assertTrue( $status->isGood() );

		$this->assertSame( [
			[ LogLevel::DEBUG, 'Validating user options' ],
			[ LogLevel::DEBUG, 'No issues found' ],
		], $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function testValidateSettings_invalid() {
		$logger = new TestLogger( true );
		$manager = $this->getManager( $logger );

		$invalidSettings = [
			'sites' => [],
		];

		try {
			$status = $manager->validateSettings( $invalidSettings );
			$this->fail( 'Exception should have been shown' );
		} catch ( InvalidArgumentException $e ) {
			// Test continues
		}

		$this->assertSame( [
			[ LogLevel::DEBUG, 'Validating user options' ],
			[ LogLevel::DEBUG, 'Error - no sites provided' ],
		], $logger->getBuffer() );
		$logger->clearBuffer();
	}

}
