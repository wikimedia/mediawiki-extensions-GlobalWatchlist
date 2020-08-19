<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use DerivativeContext;
use IBufferingStatsdDataFactory;
use MediaWikiIntegrationTestCase;
use OutputPage;
use User;
use UserNotLoggedIn;
use Wikimedia\TestingAccessWrapper;

/**
 * @covers \MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlist
 * @author DannyS712
 */
class SpecialGlobalWatchlistTest extends MediaWikiIntegrationTestCase {

	public function testUserNotLoggedIn() {
		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );

		$specialPage = new SpecialGlobalWatchlist( $statsdDataFactory );

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$anon = $this->createMock( User::class );
		$anon->method( 'isAnon' )->willReturn( true );

		$testContext->setUser( $anon );
		$specialPage->setContext( $testContext );

		$this->expectException( UserNotLoggedIn::class );
		$specialPage->execute( null );
	}

	/**
	 * @dataProvider provideTestLoggedIn
	 * @param bool $useVue
	 */
	public function testLoggedIn( $useVue ) {
		$this->setMwGlobals( [
			'wgGlobalWatchlistWikibaseSite' => 'GlobalWatchlistWikibaseSiteGoesHere',
			'wgGlobalWatchlistDevMode' => true,
			'wgGlobalWatchlistUseVue' => $useVue
		] );

		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );
		$statsdDataFactory->expects( $this->once() )
			->method( 'increment' )
			->with(
				$this->equalTo( 'globalwatchlist.load_special_page' )
			);

		$specialPage = new SpecialGlobalWatchlist( $statsdDataFactory );

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isAnon' )->willReturn( false );
		$testContext->setUser( $user );

		$module = $useVue ?
			'ext.globalwatchlist.specialglobalwatchlist.vue' :
			'ext.globalwatchlist.specialglobalwatchlist';
		$output = $this->createMock( OutputPage::class );
		$output->expects( $this->atLeastOnce() )
			->method( 'addModules' )
			->with(
				$this->equalTo( $module )
			);
		$output->expects( $this->atLeastOnce() )
			->method( 'addJsConfigVars' )
			->with(
				$this->equalTo( [
					'wgGlobalWatchlistWikibaseSite' => 'GlobalWatchlistWikibaseSiteGoesHere',
					'wgGlobalWatchlistDevMode' => true
				] )
			);
		$output->expects( $this->atLeastOnce() )
			->method( 'addHTML' );
		$testContext->setOutput( $output );

		$specialPage->setContext( $testContext );

		$specialPage->execute( null );
	}

	public function provideTestLoggedIn() {
		return [
			'Not using Vue' => [ false ],
			'Using Vue' => [ true ]
		];
	}

	public function testInfo() {
		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );

		$specialPage = new SpecialGlobalWatchlist( $statsdDataFactory );

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
