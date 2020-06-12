<?php

namespace MediaWiki\Extension\GlobalWatchlist;

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

		$manager = new SettingsManager(
			$logger,
			$javaScriptContentHandler
		);
		$accessManager = TestingAccessWrapper::newFromObject( $manager );

		$accessManager->saveOptionsInternal( $user, $wikiPage, $newOptions );

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

}
