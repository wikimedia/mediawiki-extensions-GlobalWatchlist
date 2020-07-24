<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use DerivativeContext;
use MediaWiki\User\UserOptionsManager;
use MediaWikiIntegrationTestCase;
use Psr\Log\LogLevel;
use TestLogger;
use User;
use UserNotLoggedIn;
use Wikimedia\TestingAccessWrapper;

/**
 * @covers \MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlistSettings
 * @author DannyS712
 */
class SpecialGlobalWatchlistSettingsTest extends MediaWikiIntegrationTestCase {

	public function testUserNotLoggedIn() {
		$specialPage = SpecialGlobalWatchlistSettings::newFromGlobalState(
			$this->createMock( SettingsManager::class ),
			$this->createMock( UserOptionsManager::class )
		);

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$anon = $this->createMock( User::class );
		$anon->method( 'isAnon' )->willReturn( true );

		$testContext->setUser( $anon );
		$specialPage->setContext( $testContext );

		$this->expectException( UserNotLoggedIn::class );
		$specialPage->execute( null );
	}

	public function testOnSubmit() {
		$settingsManager = $this->createMock( SettingsManager::class );
		$user = $this->createMock( User::class );

		$submitted = [
			'sites' => [
				[ 'site' => 'siteGoesHere' ],
				[ 'site' => '' ],
			],
			'anon' => 9,
			'bot' => 8,
			'minor' => 7,
			'otheroptions' => [
				'confirmallsites',
				'grouppage',
			],
			'types' => [ 'edit' ],
		];
		$expectedOptions = [
			'sites' => [ 'siteGoesHere' ],
			'anonfilter' => 9,
			'botfilter' => 8,
			'minorfilter' => 7,
			'confirmallsites' => true,
			'fastmode' => false,
			'grouppage' => true,
			'showtypes' => [ 'edit' ],
		];

		$settingsManager->expects( $this->once() )
			->method( 'saveUserOptions' )
			->with(
				$this->equalTo( $user ),
				$this->equalTo( $expectedOptions )
			);

		$logger = new TestLogger( true );

		$specialPage = new SpecialGlobalWatchlistSettings(
			$logger,
			$settingsManager,
			$this->createMock( UserOptionsManager::class )
		);

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );
		$specialPage->setContext( $testContext );

		$res = $specialPage->onSubmit( $submitted, null );
		$this->assertTrue( $res );

		$debugEntries = [
			[ LogLevel::DEBUG, "Settings form submitted with {options}" ],
		];
		$this->assertArrayEquals( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function testInfo() {
		$specialPage = SpecialGlobalWatchlistSettings::newFromGlobalState(
			$this->createMock( SettingsManager::class ),
			$this->createMock( UserOptionsManager::class )
		);

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isLoggedIn' )->willReturn( true );

		$testContext->setUser( $user );
		$specialPage->setContext( $testContext );

		$this->assertTrue( $specialPage->isListed() );

		$this->assertSame(
			TestingAccessWrapper::newFromObject( $specialPage )->getGroupName(),
			'changes'
		);
	}
}
