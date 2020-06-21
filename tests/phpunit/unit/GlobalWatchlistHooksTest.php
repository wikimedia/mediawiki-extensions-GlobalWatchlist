<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use MediaWiki\SpecialPage\SpecialPageFactory;
use MediaWikiUnitTestCase;
use Message;
use Skin;
use SpecialPage;
use Title;

/**
 * Tests for the hook handler
 *
 * @author DannyS712
 * @covers MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistHooks
 */
class GlobalWatchlistHooksTest extends MediaWikiUnitTestCase {

	public function testLinkNotAdded() {
		$specialPageFactory = $this->createNoOpMock( SpecialPageFactory::class );
		$hookHandler = new GlobalWatchlistHooks( $specialPageFactory );

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

		$hookHandler = new GlobalWatchlistHooks( $specialPageFactory );

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
		$specialPageFactory = $this->createMock( SpecialPageFactory::class );
		$hookHandler = new GlobalWatchlistHooks( $specialPageFactory );

		$messages = [ 'foo', 'bar' ];
		$hookHandler->onLoginFormValidErrorMessages( $messages );

		$this->assertArrayEquals(
			[ 'foo', 'bar', 'globalwatchlist-must-login' ],
			$messages
		);
	}

}
