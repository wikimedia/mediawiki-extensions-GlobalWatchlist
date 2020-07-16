<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use DerivativeContext;
use MediaWikiIntegrationTestCase;
use OutputPage;
use User;
use UserNotLoggedIn;
use Wikimedia\TestingAccessWrapper;

/**
 * @covers \MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlistSettings
 * @author DannyS712
 */
class SpecialGlobalWatchlistSettingsTest extends MediaWikiIntegrationTestCase {

	public function testUserNotLoggedIn() {
		$specialPage = new SpecialGlobalWatchlistSettings();

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$anon = $this->createMock( User::class );
		$anon->method( 'isAnon' )->willReturn( true );

		$testContext->setUser( $anon );
		$specialPage->setContext( $testContext );

		$this->expectException( UserNotLoggedIn::class );
		$specialPage->execute( null );
	}

	public function testLoggedIn() {
		$specialPage = new SpecialGlobalWatchlistSettings();

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isAnon' )->willReturn( false );
		$testContext->setUser( $user );

		$output = $this->createMock( OutputPage::class );
		$output->expects( $this->atLeastOnce() )
			->method( 'addModules' )
			->with(
				$this->equalTo( 'ext.globalwatchlist.specialglobalwatchlistsettings' )
			);
		$output->expects( $this->atLeastOnce() )
			->method( 'addHTML' );
		$testContext->setOutput( $output );

		$specialPage->setContext( $testContext );

		$specialPage->execute( null );
	}

	public function testInfo() {
		$specialPage = new SpecialGlobalWatchlistSettings();

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
