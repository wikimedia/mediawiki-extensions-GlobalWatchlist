<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use MediaWikiUnitTestCase;
use Message;
use MessageLocalizer;

/**
 * @author DannyS712
 * @covers \MediaWiki\Extension\GlobalWatchlist\SettingsFormValidator
 */
class SettingsFormValidatorTest extends MediaWikiUnitTestCase {

	/**
	 * MessageLocalizer mock that expects to be called a single time
	 *
	 * @param string $key
	 * @param MockObject|Message|null $message Message object to use, or null for a mock to be created here
	 * @return MockObject|MessageLocalizer
	 */
	private function getMessageLocalizer( string $key, $message = null ) {
		if ( $message === null ) {
			$message = $this->createMock( Message::class );
		}

		$messageLocalizer = $this->createMock( MessageLocalizer::class );
		$messageLocalizer->expects( $this->once() )
			->method( 'msg' )
			->with( $this->equalTo( $key ) )
			->willReturn( $message );

		return $messageLocalizer;
	}

	public function testAnonBot() {
		$messageLocalizer = $this->getMessageLocalizer( 'globalwatchlist-settings-error-anon-bot' );
		$validator = new SettingsFormValidator( $messageLocalizer, 0, null );

		$res = $validator->validateAnonBot(
			SettingsManager::FILTER_REQUIRE,
			[ 'anon' => SettingsManager::FILTER_REQUIRE ]
		);
		$this->assertInstanceOf( Message::class, $res );

		$res = $validator->validateAnonBot( SettingsManager::FILTER_EITHER, [] );
		$this->assertTrue( $res );
	}

	public function testAnonMinor() {
		$messageLocalizer = $this->getMessageLocalizer( 'globalwatchlist-settings-error-anon-minor' );
		$validator = new SettingsFormValidator( $messageLocalizer, 0, null );

		$res = $validator->validateAnonMinor(
			SettingsManager::FILTER_REQUIRE,
			[ 'anon' => SettingsManager::FILTER_REQUIRE ]
		);
		$this->assertInstanceOf( Message::class, $res );

		$res = $validator->validateAnonMinor( SettingsManager::FILTER_EITHER, [] );
		$this->assertTrue( $res );
	}

	public function testAtLeastOneSite() {
		$messageLocalizer = $this->getMessageLocalizer( 'globalwatchlist-settings-error-no-sites' );
		$validator = new SettingsFormValidator( $messageLocalizer, 0, null );

		$res = $validator->validateSitesChosen(
			[ [ 'site' => 'text' ] ],
			[]
		);
		$this->assertTrue( $res );

		$res = $validator->validateSitesChosen(
			[ [ 'site' => '' ] ],
			[]
		);
		$this->assertInstanceOf( Message::class, $res );
	}

	public function testTooManySites() {
		// Trying with 2 sites, maximum allowed is 1
		$message = $this->createMock( Message::class );
		$message->expects( $this->once() )
			->method( 'numParams' )
			->with(
				$this->equalTo( 2 ),
				$this->equalTo( 1 )
			)
			->will( $this->returnSelf() );
		$messageLocalizer = $this->getMessageLocalizer(
			'globalwatchlist-settings-error-too-many-sites',
			$message
		);

		$validator = new SettingsFormValidator( $messageLocalizer, 1, null );

		$res = $validator->validateSitesChosen(
			[ [ 'site' => 'only one site, everything is okay' ] ],
			[]
		);
		$this->assertTrue( $res );

		$res = $validator->validateSitesChosen(
			[
				[ 'site' => 'first site, which would be okay' ],
				[ 'site' => 'second site, which causes problems' ]
			],
			[]
		);
		$this->assertInstanceOf( Message::class, $res );
	}

	public function testDuplicateSites() {
		// Also double check the normalization logic - the duplicates are only
		// duplicates after being normalized
		$message = $this->createMock( Message::class );
		$message->expects( $this->once() )
			->method( 'params' )
			->with( $this->equalTo( 'baz.net' ) )
			->will( $this->returnSelf() );
		$messageLocalizer = $this->getMessageLocalizer(
			'globalwatchlist-settings-error-duplicate-site',
			$message
		);

		$validator = new SettingsFormValidator( $messageLocalizer, 0, null );

		$res = $validator->validateSitesChosen(
			[ [ 'site' => 'baz.net' ] ],
			[]
		);
		$this->assertTrue( $res );

		$res = $validator->validateSitesChosen(
			[
				[ 'site' => 'baz.net' ],
				[ 'site' => 'https://baz.net' ]
			],
			[]
		);
		$this->assertInstanceOf( Message::class, $res );
	}

	public function testInvalidSite() {
		// Trying with 'foo.com' and 'bar.org', only the first is okay
		$message = $this->createMock( Message::class );
		$message->expects( $this->once() )
			->method( 'params' )
			->with( $this->equalTo( 'bar.org' ) )
			->will( $this->returnSelf() );
		$messageLocalizer = $this->getMessageLocalizer(
			'globalwatchlist-settings-error-invalid-site',
			$message
		);

		$validator = new SettingsFormValidator( $messageLocalizer, 0, [ 'foo.com' ] );

		$res = $validator->validateSitesChosen(
			[ [ 'site' => 'foo.com' ] ],
			[]
		);
		$this->assertTrue( $res );

		$res = $validator->validateSitesChosen(
			[
				[ 'site' => 'foo.com' ],
				[ 'site' => 'bar.org' ]
			],
			[]
		);
		$this->assertInstanceOf( Message::class, $res );
	}

	public function testShowingOneType() {
		$messageLocalizer = $this->getMessageLocalizer( 'globalwatchlist-settings-error-no-types' );
		$validator = new SettingsFormValidator( $messageLocalizer, 0, null );

		$res = $validator->requireShowingOneType( [], [] );
		$this->assertInstanceOf( Message::class, $res );

		$res = $validator->requireShowingOneType( [ 'edit' ], [] );
		$this->assertTrue( $res );
	}

}
