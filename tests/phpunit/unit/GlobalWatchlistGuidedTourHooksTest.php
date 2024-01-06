<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Unit;

use ExtensionRegistry;
use MediaWiki\Config\HashConfig;
use MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistGuidedTourHooks;
use MediaWiki\ResourceLoader\ResourceLoader;
use MediaWikiUnitTestCase;

/**
 * Tests for the hook handler
 *
 * @author DannyS712
 * @covers \MediaWiki\Extension\GlobalWatchlist\GlobalWatchlistGuidedTourHooks
 */
class GlobalWatchlistGuidedTourHooksTest extends MediaWikiUnitTestCase {
	/**
	 * @dataProvider provideTestModuleRegistration
	 * @param bool $configEnabled
	 * @param bool $extensionEnabled
	 * @param bool $expectRegister
	 */
	public function testModuleRegistration( $configEnabled, $extensionEnabled, $expectRegister ) {
		$extensionRegistry = $this->createMock( ExtensionRegistry::class );
		$extensionRegistry->method( 'isLoaded' )
			->with(
				$this->equalTo( 'GuidedTour' )
			)
			->willReturn( $extensionEnabled );

		$hookHandler = new GlobalWatchlistGuidedTourHooks( $extensionRegistry );

		$config = new HashConfig( [
			'GlobalWatchlistEnableGuidedTour' => $configEnabled,
		] );
		$resourceLoader = $this->createMock( ResourceLoader::class );
		$resourceLoader->expects( $this->once() )
			->method( 'getConfig' )
			->willReturn( $config );

		$expectRegisterCall = $expectRegister ? $this->once() : $this->never();
		$resourceLoader->expects( $expectRegisterCall )
			->method( 'register' );

		$hookHandler->onResourceLoaderRegisterModules( $resourceLoader );
	}

	public static function provideTestModuleRegistration() {
		return [
			'Disabled, no extension' => [ false, false, false ],
			'Disabled, yes extension' => [ false, true, false ],
			'Enabled, no extension' => [ true, false, false ],
			'Enabled, yes extension' => [ true, true, true ],
		];
	}

}
