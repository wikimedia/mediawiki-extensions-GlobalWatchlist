<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use ApiOptions;
use ExtensionRegistry;
use IBufferingStatsdDataFactory;
use MediaWiki\SpecialPage\SpecialPageFactory;
use MediaWikiUnitTestCase;
use Message;
use ResourceLoader;
use Skin;
use SpecialPage;
use Title;
use User;

/**
 * Tests for the hook handler
 *
 * @author DannyS712
 * @covers MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistHooks
 */
class GlobalWatchlistHooksTest extends MediaWikiUnitTestCase {

	private function getHookHandler( $options = [] ) {
		$extensionRegistry = $options['extensionRegistry'] ??
			$this->createMock( ExtensionRegistry::class );
		$specialPageFactory = $options['specialPageFactory'] ??
			$this->createNoOpMock( SpecialPageFactory::class );
		$statsdDataFactory = $options['statsdDataFactory'] ??
			$this->createMock( IBufferingStatsdDataFactory::class );

		return new GlobalWatchlistHooks(
			$extensionRegistry,
			$specialPageFactory,
			$statsdDataFactory
		);
	}

	public function testNewFromGlobalState() {
		$hookHandler = GlobalWatchlistHooks::newFromGlobalState(
			$this->createMock( SpecialPageFactory::class ),
			$this->createMock( IBufferingStatsdDataFactory::class )
		);
		$this->assertInstanceOf(
			GlobalWatchlistHooks::class,
			$hookHandler
		);
	}

	public function testApiOptions() {
		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );
		$statsdDataFactory->expects( $this->once() )
			->method( 'increment' )
			->with(
				$this->equalTo( 'globalwatchlist.settings.manualchange' )
			);
		$hookHandler = $this->getHookHandler( [
			'statsdDataFactory' => $statsdDataFactory
		] );

		$apiModule = $this->createMock( ApiOptions::class );
		$user = $this->createMock( User::class );
		$changes = [
			SettingsManager::PREFERENCE_NAME => 'Value does not matter'
		];
		$resetKinds = [];

		$hookHandler->onApiOptions( $apiModule, $user, $changes, $resetKinds );
	}

	public function testLinkNotAdded() {
		$hookHandler = $this->getHookHandler();

		$title = $this->createMock( Title::class );
		$title->expects( $this->once() )
			->method( 'isSpecial' )
			->with( $this->equalTo( 'Watchlist' ) )
			->willReturn( false );

		$skin = $this->createMock( Skin::class );
		$skin->expects( $this->once() )
			->method( 'getTitle' )
			->willReturn( $title );

		$sidebar = [];
		$hookHandler->onSkinBuildSidebar( $skin, $sidebar );
		$this->assertArrayEquals(
			[],
			$sidebar,
			'If not on Special:Watchlist, the sidebar should not change'
		);
	}

	public function testLinkAdded() {
		$globalWatchlistTitle = $this->createMock( Title::class );
		$globalWatchlistTitle->expects( $this->once() )
			->method( 'getLinkURL' )
			->willReturn( 'Special:GlobalWatchlist href goes here' );

		$specialGlobalWatchlist = $this->createMock( SpecialPage::class );
		$specialGlobalWatchlist->expects( $this->once() )
			->method( 'getPageTitle' )
			->willReturn( $globalWatchlistTitle );

		$specialPageFactory = $this->createMock( SpecialPageFactory::class );
		$specialPageFactory->expects( $this->once() )
			->method( 'getPage' )
			->with( $this->equalTo( 'GlobalWatchlist' ) )
			->willReturn( $specialGlobalWatchlist );

		$hookHandler = $this->getHookHandler( [
			'specialPageFactory' => $specialPageFactory
		] );

		$title = $this->createMock( Title::class );
		$title->expects( $this->once() )
			->method( 'isSpecial' )
			->with( $this->equalTo( 'Watchlist' ) )
			->willReturn( true );

		$textMessage = $this->createMock( Message::class );
		$textMessage->expects( $this->once() )
			->method( 'text' )
			->willReturn( 'Link text goes here' );
		$titleMessage = $this->createMock( Message::class );
		$titleMessage->expects( $this->once() )
			->method( 'text' )
			->willReturn( 'Tooltip text goes here' );

		$skin = $this->createMock( Skin::class );
		$skin->expects( $this->once() )
			->method( 'getTitle' )
			->willReturn( $title );
		$skin->expects( $this->exactly( 2 ) )
			->method( 'msg' )
			->withConsecutive(
				[ $this->equalTo( 'globalwatchlist-gotoglobal' ) ],
				[ $this->equalTo( 'globalwatchlist-gotoglobal-tooltip' ) ]
			)
			->will(
				$this->onConsecutiveCalls(
					$textMessage,
					$titleMessage
				)
			);

		$sidebar = [];
		$sidebar['navigation'] = [];

		$hookHandler->onSkinBuildSidebar( $skin, $sidebar );

		$expectedSidebar = [
			'navigation' => [
				[
					'text' => 'Link text goes here',
					'href' => 'Special:GlobalWatchlist href goes here',
					'title' => 'Tooltip text goes here'
				]
			]
		];

		$this->assertArrayEquals(
			$expectedSidebar,
			$sidebar,
			'If on Special:Watchlist, the sidebar should have a link added'
		);
	}

	public function testLoginMessageAdded() {
		$hookHandler = $this->getHookHandler();

		$messages = [ 'foo', 'bar' ];
		$hookHandler->onLoginFormValidErrorMessages( $messages );

		$this->assertArrayEquals(
			[ 'foo', 'bar', 'globalwatchlist-must-login' ],
			$messages
		);
	}

	public function testPreferencesAdded() {
		$hookHandler = $this->getHookHandler();

		$preferences = [];
		$user = $this->createMock( User::class );
		$hookHandler->onGetPreferences( $user, $preferences );

		$this->assertArrayEquals(
			[
				SettingsManager::PREFERENCE_NAME => [
					'type' => 'api'
				],
				"globalwatchlist-prefs" => [
					'class' => 'HTMLInfoField',
					'section' => 'watchlist/globalwatchlist',
					'label-message' => 'globalwatchlist-prefs-settings'
				]
			],
			$preferences
		);
	}

	public function testModuleRegistration() {
		$extensionRegistry = $this->createMock( ExtensionRegistry::class );
		$extensionRegistry->expects( $this->exactly( 2 ) )
			->method( 'isLoaded' )
			->withConsecutive(
				[ $this->equalTo( 'GuidedTour' ) ],
				[ $this->equalTo( 'GuidedTour' ) ]
			)
			->will(
				$this->onConsecutiveCalls(
					false,
					true
				)
			);

		$hookHandler = $this->getHookHandler( [
			'extensionRegistry' => $extensionRegistry
		] );

		// First extension registry call returns false, module should not be added
		$resourceLoader = $this->createMock( ResourceLoader::class );
		$resourceLoader->expects( $this->never() )
			->method( 'register' );
		$hookHandler->onResourceLoaderRegisterModules( $resourceLoader );

		// Secord extension registry call returns true, module should be added
		$resourceLoader = $this->createMock( ResourceLoader::class );
		$resourceLoader->expects( $this->once() )
			->method( 'register' );
		$hookHandler->onResourceLoaderRegisterModules( $resourceLoader );
	}

}
