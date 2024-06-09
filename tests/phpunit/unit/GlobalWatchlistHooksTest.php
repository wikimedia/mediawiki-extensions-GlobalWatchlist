<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Unit;

use ApiOptions;
use IBufferingStatsdDataFactory;
use MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistHooks;
use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWiki\HTMLForm\Field\HTMLInfoField;
use MediaWiki\Message\Message;
use MediaWiki\SpecialPage\SpecialPage;
use MediaWiki\SpecialPage\SpecialPageFactory;
use MediaWiki\Title\Title;
use MediaWiki\User\User;
use MediaWikiUnitTestCase;
use Skin;

/**
 * Tests for the hook handler
 *
 * @author DannyS712
 * @covers \MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistHooks
 */
class GlobalWatchlistHooksTest extends MediaWikiUnitTestCase {

	private function getHookHandler( $options = [] ) {
		$specialPageFactory = $options['specialPageFactory'] ??
			$this->createNoOpMock( SpecialPageFactory::class );
		$statsdDataFactory = $options['statsdDataFactory'] ??
			$this->createMock( IBufferingStatsdDataFactory::class );

		return new GlobalWatchlistHooks(
			$specialPageFactory,
			$statsdDataFactory
		);
	}

	public function testApiOptions() {
		$statsdDataFactory = $this->createMock( IBufferingStatsdDataFactory::class );
		$statsdDataFactory->expects( $this->once() )
			->method( 'increment' )
			->with(
				'globalwatchlist.settings.manualchange'
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
			->with( 'Watchlist' )
			->willReturn( false );

		$skin = $this->createMock( Skin::class );
		$skin->expects( $this->once() )
			->method( 'getTitle' )
			->willReturn( $title );

		$sidebar = [];
		$hookHandler->onSidebarBeforeOutput( $skin, $sidebar );
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
			->with( 'GlobalWatchlist' )
			->willReturn( $specialGlobalWatchlist );

		$hookHandler = $this->getHookHandler( [
			'specialPageFactory' => $specialPageFactory
		] );

		$title = $this->createMock( Title::class );
		$title->expects( $this->once() )
			->method( 'isSpecial' )
			->with( 'Watchlist' )
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
			->willReturnMap( [
				[ 'globalwatchlist-gotoglobal', $textMessage ],
				[ 'globalwatchlist-gotoglobal-tooltip', $titleMessage ]
			] );

		$sidebar = [];
		$sidebar['navigation'] = [];

		$hookHandler->onSidebarBeforeOutput( $skin, $sidebar );

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
					'class' => HTMLInfoField::class,
					'section' => 'watchlist/globalwatchlist',
					'label-message' => 'globalwatchlist-prefs-settings'
				]
			],
			$preferences
		);
	}

}
