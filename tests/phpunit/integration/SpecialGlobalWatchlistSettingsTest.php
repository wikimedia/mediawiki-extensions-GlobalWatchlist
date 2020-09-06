<?php

namespace MediaWiki\Extension\GlobalWatchlist;

use DerivativeContext;
use ExtensionRegistry;
use HTMLForm;
use MediaWiki\Logger\LoggerFactory;
use MediaWiki\User\UserOptionsManager;
use MediaWikiIntegrationTestCase;
use OutputPage;
use Psr\Log\LogLevel;
use SpecialPage;
use TestLogger;
use User;
use UserNotLoggedIn;
use Wikimedia\TestingAccessWrapper;

/**
 * @covers \MediaWiki\Extension\GlobalWatchlist\SpecialGlobalWatchlistSettings
 * @author DannyS712
 */
class SpecialGlobalWatchlistSettingsTest extends MediaWikiIntegrationTestCase {

	private function getSpecialPage( $options = [] ) {
		$logger = $options['logger'] ??
			LoggerFactory::getInstance( 'GlobalWatchlist' );
		$extensionRegistry = $options['extensionRegistry'] ??
			$this->createMock( ExtensionRegistry::class );
		$settingsManager = $options['settingsManager'] ??
			$this->createMock( SettingsManager::class );
		$userOptionsManager = $options['userOptionsManager'] ??
			$this->createMock( UserOptionsManager::class );

		$specialPage = new SpecialGlobalWatchlistSettings(
			$logger,
			$extensionRegistry,
			$settingsManager,
			$userOptionsManager
		);

		return TestingAccessWrapper::newFromObject( $specialPage );
	}

	private function getOptionsManager( $user, $result ) {
		$userOptionsManager = $this->createMock( UserOptionsManager::class );
		$userOptionsManager->expects( $this->once() )
			->method( 'getOption' )
			->with(
				$this->equalTo( $user ),
				$this->equalTo( SettingsManager::PREFERENCE_NAME ),
				$this->equalTo( false )
			)
			->willReturn( $result );
		return $userOptionsManager;
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
			$this->createMock( UserOptionsManager::class )
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
		// Execute validates user settings, manually mocking the User is complicated
		$user = $this->getTestUser()->getUser();

		// ::execute results in creating the form, need to have the UserOptionsManager available
		// return false for user settings, because we aren't testing that right now,
		// and expect that the tour is loaded, because the user settings are false
		$extensionRegistry = $this->createMock( ExtensionRegistry::class );
		$extensionRegistry->expects( $this->once() )
			->method( 'isLoaded' )
			->with(
				$this->equalTo( 'GuidedTour' )
			)
			->willReturn( true );

		$userOptionsManager = $this->getOptionsManager( $user, false );
		$specialPage = $this->getSpecialPage( [
			'extensionRegistry' => $extensionRegistry,
			'userOptionsManager' => $userOptionsManager
		] );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );

		// Can't easily mock OutputPage to ensure that `addModules` is called //at some point//
		// with the right modules (ext.globalwatchlist.specialglobalwatchlistsettings and
		// ext.guidedTour.globalWatchlistSettings) so instead test at the end that they were added.
		// Call ::setOutput to ensure that the reference we have remains the correct one
		$output = $testContext->getOutput();
		$testContext->setOutput( $output );

		// Without a title set, causes:
		// Error: Call to a member function getPrefixedText() on null
		$testContext->setTitle( SpecialPage::getTitleFor( 'GlobalWatchlistSettings' ) );

		$specialPage->setContext( $testContext );

		$specialPage->execute( null );

		$modules = $output->getModules();
		$this->assertContains(
			'ext.globalwatchlist.specialglobalwatchlistsettings',
			$modules
		);
		$this->assertContains(
			'ext.guidedTour.globalWatchlistSettings',
			$modules
		);
	}

	public function testGetFormFields_defaults() {
		// Defaults are used if user has no settings set
		$this->setMwGlobals( [
			'wgServer' => '//example.com'
		] );

		$user = $this->createMock( User::class );

		$userOptionsManager = $this->getOptionsManager( $user, false );
		$specialPage = $this->getSpecialPage( [
			'userOptionsManager' => $userOptionsManager
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
		$userOptionsManager = $this->getOptionsManager( $user, $validJson );

		$specialPage = $this->getSpecialPage( [
			'userOptionsManager' => $userOptionsManager
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
		$userOptionsManager = $this->getOptionsManager( $user, $invalidJson );

		$specialPage = $this->getSpecialPage( [
			'userOptionsManager' => $userOptionsManager
		] );

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$testContext->setUser( $user );

		$output = $this->createMock( OutputPage::class );
		$output->expects( $this->atLeastOnce() )
			->method( 'addModules' )
			->with(
				$this->equalTo( 'ext.globalwatchlist.getsettingserror' )
			);
		$testContext->setOutput( $output );

		$specialPage->setContext( $testContext );

		$fields = $specialPage->getFormFields();

		// The actual fields are checked in the tests for getActualFormFields
		// Here just make sure that the defaults were used
		$this->assertDefaultSite( $fields, 'example.com' );
	}

	public function testAlterForm() {
		$specialPage = $this->getSpecialPage();

		$form = $this->createMock( HTMLForm::class );
		$form->expects( $this->once() )
			->method( 'setSubmitText' );

		$specialPage->alterForm( $form );
	}

	public function testGetActualFormFields() {
		$specialPage = $this->getSpecialPage();

		$testContext = new DerivativeContext( $specialPage->getContext() );
		$validator = new SettingsFormValidator( $testContext );

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
				[ 'site' => 'siteGoesHere' ],
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
			'sites' => [ 'siteGoesHere' ],
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
			->with(
				$this->equalTo( $user ),
				$this->equalTo( $expectedOptions )
			);

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
			[ LogLevel::DEBUG, "Settings form submitted with {options}" ],
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
			->with(
				$this->equalTo( 'globalwatchlist-notify-settingssaved' )
			);
		$testContext->setOutput( $output );

		$specialPage->setContext( $testContext );

		$specialPage->onSuccess();
	}

	public function testInfo() {
		$specialPage = $this->getSpecialPage();

		$testContext = new DerivativeContext( $specialPage->getContext() );

		$user = $this->createMock( User::class );
		$user->method( 'isLoggedIn' )->willReturn( true );

		$testContext->setUser( $user );
		$specialPage->setContext( $testContext );

		$this->assertSame( $specialPage->getDisplayFormat(), 'ooui' );
		$this->assertSame( $specialPage->getMessagePrefix(), 'globalwatchlist' );
		$this->assertTrue( $specialPage->doesWrites() );
		$this->assertSame( $specialPage->getGroupName(), 'changes' );
		$this->assertTrue( $specialPage->isListed() );
	}
}
