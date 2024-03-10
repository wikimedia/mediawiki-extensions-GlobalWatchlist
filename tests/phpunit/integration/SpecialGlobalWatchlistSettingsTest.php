<?php

namespace MediaWiki\Extension\GlobalWatchlist\Tests\Integration;

use DerivativeContext;
use ExtensionRegistry;
use HTMLForm;
use MediaWiki\Config\HashConfig;
use MediaWiki\Extension\GlobalWatchlist\SettingsFormValidator;
use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlistSettings;
use MediaWiki\Logger\LoggerFactory;
use MediaWiki\Output\OutputPage;
use MediaWiki\SpecialPage\SpecialPage;
use MediaWiki\SpecialPage\SpecialPageFactory;
use MediaWiki\Title\Title;
use MediaWiki\User\Options\UserOptionsLookup;
use MediaWiki\User\User;
use MediaWikiIntegrationTestCase;
use Psr\Log\LogLevel;
use TestLogger;
use UserNotLoggedIn;
use Wikimedia\TestingAccessWrapper;

/**
 * @covers \MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlistSettings
 * @author DannyS712
 * @group Database
 * @todo Use Authority instead of User and remove this test from the Database group once core's SpecialPage and
 * FormSpecialPage move away from User.
 */
class SpecialGlobalWatchlistSettingsTest extends MediaWikiIntegrationTestCase {

	private function getSpecialPage( $options = [] ) {
		$logger = $options['logger'] ??
			LoggerFactory::getInstance( 'GlobalWatchlist' );
		$extensionRegistry = $options['extensionRegistry'] ??
			$this->createMock( ExtensionRegistry::class );
		$settingsManager = $options['settingsManager'] ??
			$this->createMock( SettingsManager::class );
		$specialPageFactory = $options['specialPageFactory'] ??
			$this->getSpecialPageFactory( false );
		$userOptionsLookup = $options['userOptionsLookup'] ??
			$this->createMock( UserOptionsLookup::class );

		$specialPage = new SpecialGlobalWatchlistSettings(
			$logger,
			$extensionRegistry,
			$settingsManager,
			$specialPageFactory,
			$userOptionsLookup
		);

		return TestingAccessWrapper::newFromObject( $specialPage );
	}

	private function getOptionsLookup( $user, $result ) {
		$userOptionsLookup = $this->createMock( UserOptionsLookup::class );
		$userOptionsLookup->expects( $this->once() )
			->method( 'getOption' )
			->with(
				$user,
				SettingsManager::PREFERENCE_NAME,
				false
			)
			->willReturn( $result );
		return $userOptionsLookup;
	}

	private function getSpecialPageFactory( bool $called ) {
		$mockFactory = $this->createMock( SpecialPageFactory::class );
		if ( $called === false ) {
			$mockFactory->expects( $this->never() )
				->method( 'getPage' );
			return $mockFactory;
		}

		$mockSpecial = $this->createMock( SpecialPage::class );
		$mockTitle = $this->createMock( Title::class );
		$mockSpecial->expects( $this->once() )
			->method( 'getPageTitle' )
			->willReturn( $mockTitle );
		$mockFactory->expects( $this->once() )
			->method( 'getPage' )
			->with( 'GlobalWatchlist' )
			->willReturn( $mockSpecial );
		return $mockFactory;
	}

	private function assertDefaultSite( $fields, $defaultSite ) {
		$this->assertIsArray( $fields );
		$this->assertArrayHasKey( 'sites', $fields );
		$this->assertIsArray( $fields['sites'] );
		$this->assertArrayHasKey( 'default', $fields['sites'] );

		$sitesDefault = $fields['sites']['default'];

		$expectedDefault = [
			[ 'site' => $defaultSite ],
			[ 'site' => null ],
		];
		$this->assertArrayEquals( $expectedDefault, $sitesDefault );
	}

	public function testNewFromGlobalState() {
		$specialPage = SpecialGlobalWatchlistSettings::newFromGlobalState(
			$this->createMock( SettingsManager::class ),
			$this->createMock( SpecialPageFactory::class ),
			$this->createMock( UserOptionsLookup::class )
		);

		$this->assertInstanceOf(
			SpecialGlobalWatchlistSettings::class,
			$specialPage
		);
	}

	public function testUserNotLoggedIn() {
		$specialPage = $this->getSpecialPage();

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$anon = $this->createMock( User::class );
		$anon->method( 'isAnon' )->willReturn( true );

		$testContext->setUser( $anon );
		$specialPage->setContext( $testContext );

		$this->expectException( UserNotLoggedIn::class );
		$specialPage->execute( null );
	}

	public function testExecute() {
		$this->setMwGlobals( [
			'wgGlobalWatchlistEnableGuidedTour' => true,
		] );

		// Execute validates user settings, manually mocking the User is complicated
		$user = $this->getTestUser()->getUser();

		// ::execute results in creating the form, need to have the UserOptionsLookup available
		// return false for user settings, because we aren't testing that right now,
		// and expect that the tour is loaded, because the user settings are false and
		// the tour is enabled
		$extensionRegistry = $this->createMock( ExtensionRegistry::class );
		$extensionRegistry->method( 'isLoaded' )
			// Only GuidedTour
			->willReturnCallback( static function ( $extensionName ) {
				return $extensionName === 'GuidedTour';
			} );

		$specialPageFactory = $this->getSpecialPageFactory( true );
		$userOptionsLookup = $this->getOptionsLookup( $user, false );
		$specialPage = $this->getSpecialPage( [
			'extensionRegistry' => $extensionRegistry,
			'specialPageFactory' => $specialPageFactory,
			'userOptionsLookup' => $userOptionsLookup,
		] );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );

		// Can't easily mock OutputPage to ensure that `addModules` is called //at some point//
		// with the right modules (ext.globalwatchlist.specialglobalwatchlistsettings and
		// ext.guidedTour.globalWatchlistSettings) so instead test at the end that they were added.
		// Call ::setOutput to ensure that the reference we have remains the correct one
		$output = $testContext->getOutput();
		// Ensure output page has title set, T327342
		$title = SpecialPage::getTitleFor( 'GlobalWatchlistSettings' );
		$output->setTitle( $title );
		$testContext->setOutput( $output );

		// Without a title set, causes:
		// Error: Call to a member function getPrefixedText() on null
		$testContext->setTitle( $title );

		$specialPage->setContext( $testContext );

		$specialPage->execute( null );

		$modules = $output->getModules();
		$this->assertContains(
			'mediawiki.htmlform.ooui',
			$modules
		);
		$this->assertContains(
			'ext.guidedTour.globalWatchlistSettings',
			$modules
		);
		// ext.globalwatchlist.specialglobalwatchlistsettings should be available even
		// if the viewer doesn't have JavaScript, for T275588
		$this->assertContains(
			'ext.globalwatchlist.specialglobalwatchlistsettings',
			$output->getModuleStyles(),
			'specialglobalwatchlistsettings is loaded as a style module'
		);
	}

	public function testGetFormFields_defaults() {
		// Defaults are used if user has no settings set
		$this->setMwGlobals( [
			'wgServer' => '//example.com'
		] );

		$user = $this->createMock( User::class );

		$userOptionsLookup = $this->getOptionsLookup( $user, false );
		$specialPage = $this->getSpecialPage( [
			'userOptionsLookup' => $userOptionsLookup,
		] );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );

		$specialPage->setContext( $testContext );

		$fields = $specialPage->getFormFields();

		// The actual fields are checked in the tests for getActualFormFields
		// Here just make sure that the defaults were used
		$this->assertDefaultSite( $fields, 'example.com' );
	}

	public function testGetFormFields_settings() {
		// User settings are used
		$this->setMwGlobals( [
			'wgServer' => '//example.com'
		] );

		$user = $this->createMock( User::class );

		// phpcs:ignore Generic.Files.LineLength.TooLong
		$validJson = '{"sites":["en.wikipedia.org"],"anonfilter":0,"botfilter":0,"minorfilter":0,"confirmallsites":true,"fastmode":false,"grouppage":true,"showtypes":["edit","log","new"],"version":1}';
		$userOptionsLookup = $this->getOptionsLookup( $user, $validJson );

		$specialPage = $this->getSpecialPage( [
			'userOptionsLookup' => $userOptionsLookup,
		] );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );

		$specialPage->setContext( $testContext );

		$fields = $specialPage->getFormFields();

		// The actual fields are checked in the tests for getActualFormFields
		// Here just make sure that the user options were used
		$this->assertDefaultSite( $fields, 'en.wikipedia.org' );
	}

	public function testGetFormFields_invalid() {
		// Defaults are used if user has invalid settings set
		$this->setMwGlobals( [
			'wgServer' => '//example.com'
		] );

		$user = $this->createMock( User::class );

		// phpcs:ignore Generic.Files.LineLength.TooLong
		$invalidJson = '{"sites":"en.wikipedia.org"],"anonfilter":0,"botfilter":0,"minorfilter":0,"confirmallsites":true,"fastmode":false,"grouppage":true,"showtypes":["edit","log","new"],"version":1}';
		$userOptionsLookup = $this->getOptionsLookup( $user, $invalidJson );

		$specialPage = $this->getSpecialPage( [
			'userOptionsLookup' => $userOptionsLookup,
		] );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );

		$output = $this->createMock( OutputPage::class );
		$output->expects( $this->atLeastOnce() )
			->method( 'addModules' )
			->with( 'ext.globalwatchlist.getsettingserror' );
		$testContext->setOutput( $output );

		$specialPage->setContext( $testContext );

		$fields = $specialPage->getFormFields();

		// The actual fields are checked in the tests for getActualFormFields
		// Here just make sure that the defaults were used
		$this->assertDefaultSite( $fields, 'example.com' );
	}

	public function testAlterForm() {
		$specialPage = $this->getSpecialPage( [
			'specialPageFactory' => $this->getSpecialPageFactory( true )
		] );

		$form = $this->createMock( HTMLForm::class );
		$form->expects( $this->once() )
			->method( 'setSubmitText' );
		$form->expects( $this->once() )
			->method( 'showCancel' );
		$form->expects( $this->once() )
			->method( 'setCancelTarget' );

		$specialPage->alterForm( $form );
	}

	public function testGetActualFormFields() {
		$specialPage = $this->getSpecialPage();

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$validator = new SettingsFormValidator( $testContext, 0, null );

		$userOptions = [
			'sites' => [ 'en.wikipedia.org' ],
			'anonfilter' => SettingsManager::FILTER_EITHER,
			'botfilter' => SettingsManager::FILTER_EITHER,
			'minorfilter' => SettingsManager::FILTER_EITHER,
			'confirmallsites' => true,
			'fastmode' => true,
			'grouppage' => true,
			'showtypes' => [ 'edit', 'log', 'new' ]
		];

		$fields = $specialPage->getActualFormFields( $validator, $userOptions );

		$this->assertArrayHasKey( 'sites', $fields );
		$this->assertArrayHasKey( 'anon', $fields );
		$this->assertArrayHasKey( 'bot', $fields );
		$this->assertArrayHasKey( 'minor', $fields );
		$this->assertArrayHasKey( 'types', $fields );
		$this->assertArrayHasKey( 'otheroptions', $fields );
	}

	public function testOnSubmit() {
		$settingsManager = $this->createMock( SettingsManager::class );
		$user = $this->createMock( User::class );

		$submitted = [
			'sites' => [
				[ 'site' => 'https://www.example.com' ],
				[ 'site' => '' ],
			],
			'anon' => 9,
			'bot' => 8,
			'minor' => 7,
			'otheroptions' => [
				'confirmallsites',
				'grouppage',
			],
			'types' => [ 'edit' ],
		];
		$expectedOptions = [
			'sites' => [ 'www.example.com' ],
			'anonfilter' => 9,
			'botfilter' => 8,
			'minorfilter' => 7,
			'confirmallsites' => true,
			'fastmode' => false,
			'grouppage' => true,
			'showtypes' => [ 'edit' ],
		];

		$settingsManager->expects( $this->once() )
			->method( 'saveUserOptions' )
			->with( $user, $expectedOptions );

		$logger = new TestLogger( true );

		$specialPage = $this->getSpecialPage( [
			'logger' => $logger,
			'settingsManager' => $settingsManager
		] );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );
		$specialPage->setContext( $testContext );

		$res = $specialPage->onSubmit( $submitted, null );
		$this->assertTrue( $res );

		$debugEntries = [
			[ LogLevel::INFO, "Settings form submitted with {options}" ],
		];
		$this->assertArrayEquals( $debugEntries, $logger->getBuffer() );
		$logger->clearBuffer();
	}

	public function testOnSuccess() {
		$specialPage = $this->getSpecialPage();

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$output = $this->createMock( OutputPage::class );
		$output->expects( $this->once() )
			->method( 'addWikiMsg' )
			->with( 'globalwatchlist-notify-settingssaved' );
		$testContext->setOutput( $output );

		$specialPage->setContext( $testContext );

		$specialPage->onSuccess();
	}

	public function testInfo() {
		$specialPage = $this->getSpecialPage();

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isNamed' )->willReturn( true );

		$testContext->setUser( $user );
		$specialPage->setContext( $testContext );

		$this->assertSame( 'ooui', $specialPage->getDisplayFormat() );
		$this->assertSame( 'globalwatchlist', $specialPage->getMessagePrefix() );
		$this->assertTrue( $specialPage->doesWrites() );
		$this->assertSame( 'changes', $specialPage->getGroupName() );
		$this->assertTrue( $specialPage->isListed() );
	}

	/**
	 * @dataProvider provideTestMaybeLoadTour
	 * @param bool $configEnabled
	 * @param bool $extensionEnabled
	 * @param bool $expectLoad
	 */
	public function testMaybeLoadTour( $configEnabled, $extensionEnabled, $expectLoad ) {
		$extensionRegistry = $this->createMock( ExtensionRegistry::class );
		$extensionRegistry->method( 'isLoaded' )
			->with( 'GuidedTour' )
			->willReturn( $extensionEnabled );

		$specialPage = $this->getSpecialPage( [
			'extensionRegistry' => $extensionRegistry,
		] );

		$user = $this->createMock( User::class );
		$user->method( 'isRegistered' )->willReturn( true );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );

		$config = new HashConfig( [
			'GlobalWatchlistEnableGuidedTour' => $configEnabled,
		] );
		$testContext->setConfig( $config );

		$output = $this->createMock( OutputPage::class );
		$outputExpectation = $expectLoad ? $this->once() : $this->never();
		$output->expects( $outputExpectation )
			->method( 'addModules' )
			->with( 'ext.guidedTour.globalWatchlistSettings' );
		$testContext->setOutput( $output );

		$specialPage->setContext( $testContext );

		$specialPage->maybeLoadTour();
	}

	public static function provideTestMaybeLoadTour() {
		return [
			'Disabled, no extension' => [ false, false, false ],
			'Disabled, yes extension' => [ false, true, false ],
			'Enabled, no extension' => [ true, false, false ],
			'Enabled, yes extension' => [ true, true, true ],
		];
	}
}
