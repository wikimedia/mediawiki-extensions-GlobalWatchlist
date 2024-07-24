<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Integration;

use IBufferingStatsdDataFactory;
use MediaWiki\Context\DerivativeContext;
use MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlist;
use MediaWiki\Output\OutputPage;
use MediaWiki\Request\FauxRequest;
use MediaWiki\User\User;
use MediaWikiIntegrationTestCase;
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

	public function testExecute() {
		// $wgGlobalWatchlistDevMode is true so we can test handling of displayversion
		$this->overrideConfigValues( [
			'GlobalWatchlistWikibaseSite' => 'GlobalWatchlistWikibaseSiteGoesHere',
			'GlobalWatchlistDevMode' => true,
		] );

		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );
		$statsdDataFactory->expects( $this->once() )
			->method( 'increment' )
			->with( 'globalwatchlist.load_special_page' );

		$specialPage = new SpecialGlobalWatchlist( $statsdDataFactory );

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isNamed' )->willReturn( true );
		$testContext->setUser( $user );

		$module = 'ext.globalwatchlist.specialglobalwatchlist';
		$output = $this->createMock( OutputPage::class );
		$output->expects( $this->atLeastOnce() )
			->method( 'addModules' )
			->with( $module );
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

		$request = new FauxRequest( [] );
		$testContext->setRequest( $request );

		$specialPage->setContext( $testContext );

		$specialPage->execute( null );
	}

	public function testInfo() {
		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );

		$specialPage = new SpecialGlobalWatchlist( $statsdDataFactory );

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isNamed' )->willReturn( true );

		$testContext->setUser( $user );
		$specialPage->setContext( $testContext );

		$this->assertTrue( $specialPage->isListed() );

		$this->assertSame(
			'changes',
			TestingAccessWrapper::newFromObject( $specialPage )->getGroupName()
		);
	}
}
