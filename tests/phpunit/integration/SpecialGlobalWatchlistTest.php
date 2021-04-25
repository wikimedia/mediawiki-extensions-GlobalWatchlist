<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Integration;

use DerivativeContext;
use FauxRequest;
use IBufferingStatsdDataFactory;
use MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlist;
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
	 * @dataProvider provideExecute
	 * @param bool $useVueConfig
	 * @param string|null $displayVersionRequestParam
	 * @param bool $expectVueLoad
	 */
	public function testExecute( $useVueConfig, $displayVersionRequestParam, $expectVueLoad ) {
		// $wgGlobalWatchlistDevMode is true so we can test handling of displayversion
		$this->setMwGlobals( [
			'wgGlobalWatchlistWikibaseSite' => 'GlobalWatchlistWikibaseSiteGoesHere',
			'wgGlobalWatchlistDevMode' => true,
			'wgGlobalWatchlistUseVue' => $useVueConfig
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

		$module = $expectVueLoad ?
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

		$requestParams = [];
		if ( $displayVersionRequestParam !== null ) {
			$requestParams['displayversion'] = $displayVersionRequestParam;
		}
		$request = new FauxRequest( $requestParams );
		$testContext->setRequest( $request );

		$specialPage->setContext( $testContext );

		$specialPage->execute( null );
	}

	public function provideExecute() {
		// configuration value, displayversion request parameter, vue expected or not
		return [
			'Config is normal, no request param' => [ false, null, false ],
			'Config is normal, normal requested' => [ false, 'normal', false ],
			'Config is normal, vue requested' => [ false, 'vue', true ],
			'Config is vue, no request param' => [ true, null, true ],
			'Config is vue, normal requested' => [ true, 'normal', false ],
			'Config is vue, vue requested' => [ true, 'vue', true ],
		];
	}

	public function testInfo() {
		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );

		$specialPage = new SpecialGlobalWatchlist( $statsdDataFactory );

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isRegistered' )->willReturn( true );

		$testContext->setUser( $user );
		$specialPage->setContext( $testContext );

		$this->assertTrue( $specialPage->isListed() );

		$this->assertSame(
			TestingAccessWrapper::newFromObject( $specialPage )->getGroupName(),
			'changes'
		);
	}
}
