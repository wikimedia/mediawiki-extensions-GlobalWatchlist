<?php

/**
 * Implements Special:GlobalWatchlistSettings
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * http://www.gnu.org/copyleft/gpl.html
 *
 * @file
 * @ingroup SpecialPage
 */

namespace MediaWiki\Extension\GlobalWatchlist;

use ExtensionRegistry;
use FormatJson;
use FormSpecialPage;
use HTMLForm;
use MediaWiki\Extension\CentralAuth\User\CentralAuthUser;
use MediaWiki\Logger\LoggerFactory;
use MediaWiki\SpecialPage\SpecialPageFactory;
use MediaWiki\User\UserOptionsLookup;
use MediaWiki\WikiMap\WikiMap;
use Psr\Log\LoggerInterface;
use Status;

/**
 * @ingroup SpecialPage
 * @author DannyS712
 */
class SpecialGlobalWatchlistSettings extends FormSpecialPage {

	/** @var LoggerInterface */
	private $logger;

	/** @var ExtensionRegistry */
	private $extensionRegistry;

	/** @var SettingsManager */
	private $settingsManager;

	/** @var SpecialPageFactory */
	private $specialPageFactory;

	/** @var UserOptionsLookup */
	private $userOptionsLookup;

	/**
	 * @param LoggerInterface $logger
	 * @param ExtensionRegistry $extensionRegistry
	 * @param SettingsManager $settingsManager
	 * @param SpecialPageFactory $specialPageFactory
	 * @param UserOptionsLookup $userOptionsLookup
	 */
	public function __construct(
		LoggerInterface $logger,
		ExtensionRegistry $extensionRegistry,
		SettingsManager $settingsManager,
		SpecialPageFactory $specialPageFactory,
		UserOptionsLookup $userOptionsLookup
	) {
		parent::__construct( 'GlobalWatchlistSettings', 'editmyoptions' );

		$this->logger = $logger;
		$this->extensionRegistry = $extensionRegistry;
		$this->settingsManager = $settingsManager;
		$this->specialPageFactory = $specialPageFactory;
		$this->userOptionsLookup = $userOptionsLookup;
	}

	/**
	 * Need a factory method to inject LoggerInstance and ExtensionRegistry,
	 * which are not available from the service container
	 *
	 * @param SettingsManager $settingsManager
	 * @param SpecialPageFactory $specialPageFactory
	 * @param UserOptionsLookup $userOptionsLookup
	 * @return SpecialGlobalWatchlistSettings
	 */
	public static function newFromGlobalState(
		SettingsManager $settingsManager,
		SpecialPageFactory $specialPageFactory,
		UserOptionsLookup $userOptionsLookup
	) {
		return new SpecialGlobalWatchlistSettings(
			LoggerFactory::getInstance( 'GlobalWatchlist' ),
			ExtensionRegistry::getInstance(),
			$settingsManager,
			$specialPageFactory,
			$userOptionsLookup
		);
	}

	/**
	 * @param string|null $par
	 */
	public function execute( $par ) {
		$this->addHelpLink( 'Extension:GlobalWatchlist' );

		$this->requireNamedUser( 'globalwatchlist-must-login' );

		$this->getOutput()->addModules( 'mediawiki.htmlform.ooui' );
		$this->getOutput()->addModuleStyles(
			'ext.globalwatchlist.specialglobalwatchlistsettings'
		);

		parent::execute( $par );
	}

	/**
	 * Get an HTMLForm descriptor array
	 * @return array
	 */
	protected function getFormFields() {
		$currentOptions = $this->userOptionsLookup->getOption(
			$this->getUser(),
			SettingsManager::PREFERENCE_NAME,
			false
		);

		// This should be kept in sync with getSettings.js in terms of defaults
		$server = $this->getConfig()->get( 'Server' );
		$defaultOptions = [
			'sites' => [
				preg_replace( '/.*?\/\//', '', $server )
			],
			'anonfilter' => SettingsManager::FILTER_EITHER,
			'botfilter' => SettingsManager::FILTER_EITHER,
			'minorfilter' => SettingsManager::FILTER_EITHER,
			'confirmallsites' => true,
			'fastmode' => false,
			'grouppage' => true,
			'showtypes' => [ 'edit', 'log', 'new' ],
		];

		if ( $currentOptions === false ) {
			$userOptions = $defaultOptions;
			$this->maybeLoadTour();
		} else {
			// User has options, try to handle them
			$parsedOptions = FormatJson::parse( $currentOptions );
			if ( $parsedOptions->isGood() ) {
				$userOptions = (array)$parsedOptions->getValue();
			} else {
				// Alert the user that their settings couldn't be used
				$this->getOutput()->addModules(
					'ext.globalwatchlist.getsettingserror'
				);

				$userOptions = $defaultOptions;
			}
		}

		$formValidator = new SettingsFormValidator(
			$this->getContext(),
			$this->getConfig()->get( 'GlobalWatchlistSiteLimit' ),
			$this->maybeGetValidSites()
		);

		return $this->getActualFormFields( $formValidator, $userOptions );
	}

	/**
	 * If $wgGlobalWatchlistEnableGuidedTour is true, and the GuidedTour extension is available,
	 * load the tour for the settings page
	 *
	 * Only called if the user does not currently have any settings saved (i.e. is a new user)
	 */
	private function maybeLoadTour() {
		if (
			$this->getConfig()->get( 'GlobalWatchlistEnableGuidedTour' ) &&
			$this->extensionRegistry->isLoaded( 'GuidedTour' )
		) {
			$this->getOutput()->addModules(
				'ext.guidedTour.globalWatchlistSettings'
			);
		}
	}

	/**
	 * Used to validate the site list provided against the wikis a user has an attached
	 * account on, if CentralAuth is available. If not, there is no validation.
	 *
	 * @codeCoverageIgnore
	 * @return ?array either an array of the sites that are okay, or null for no validation
	 */
	private function maybeGetValidSites(): ?array {
		if ( !$this->extensionRegistry->isLoaded( 'CentralAuth' ) ) {
			$this->logger->debug( 'CentralAuth is not installed, no site validation' );
			return null;
		}
		$this->logger->debug( 'CentralAuth is installed, validating against attached wikis' );
		$attachedWikis = CentralAuthUser::getInstance( $this->getUser() )->listAttached();

		return array_map(
			static function ( $dbName ) {
				$wiki = WikiMap::getWiki( $dbName );
				if ( !$wiki ) {
					// This should never happen, but just in case
					return '';
				}
				// WikiReference::getDisplayName() only returns the 'host' for
				// the server url, but we need to also handle sites that include
				// a port at the end, eg Vagrant wikis. See T289384
				$bits = wfParseUrl( $wiki->getCanonicalServer() );
				if ( !$bits ) {
					// Match behavior of WikiReference::getDisplayName()
					// Invalid server spec.
					// There's no sane thing to do here, so just return the canonical server name in full.
					return $wiki->getCanonicalServer();
				}
				$url = $bits['host'];
				if ( isset( $bits['port'] ) ) {
					$url .= ':' . $bits['port'];
				}
				return $url;
			},
			$attachedWikis
		);
	}

	/**
	 * Display form as OOUI
	 *
	 * @return string
	 */
	protected function getDisplayFormat() {
		return 'ooui';
	}

	/**
	 * Get message prefix for HTMLForm
	 *
	 * @return string
	 */
	protected function getMessagePrefix() {
		return 'globalwatchlist';
	}

	/**
	 * Set correct label for submit button
	 *
	 * @param HTMLForm $form
	 */
	protected function alterForm( HTMLForm $form ) {
		$form->setSubmitText(
			$this->msg( 'globalwatchlist-save' )->escaped()
		);

		// Enable cancel button, target is Special:GlobalWatchlist
		// See T268259
		$globalWatchlistSpecial = $this->specialPageFactory->getPage( 'GlobalWatchlist' );
		$form->showCancel();
		$form->setCancelTarget( $globalWatchlistSpecial->getPageTitle() );
	}

	/**
	 * Get form fields with defaults filled in based on $userOptions
	 *
	 * @param SettingsFormValidator $formValidator
	 * @param array $userOptions
	 * @return array
	 */
	private function getActualFormFields(
		SettingsFormValidator $formValidator,
		array $userOptions
	): array {
		$fields = [];

		// Due to the "implicit submission" feature of html forms, hitting enter
		// triggers the first submit button in the form - add an extra button at
		// the start, so that the button that is triggered is not the button
		// to remove the first site row from HTMLFormFieldCloner. Put that button
		// in the "sitelist" section so that it goes on top, and disable it so that
		// the "implicit submission" attempt doesn't actually submit the form.
		// We hide the button from the viewer via the css class, see styles in
		// the SpecialGlobalWatchlistSettings.css file. See T275588 for more
		// Known issue: only fixes the "implicit submission" from hitting enter
		// if the user is focused on one of the site rows, elsewhere in the form
		// enter still triggers the removal of the top site row (or the addition
		// of a new row if there are no existing rows).
		$fields['fake-submit'] = [
			'type' => 'submit',
			'disabled' => true,
			'section' => 'sitelist',
			'cssclass' => 'ext-globalwatchlist-settings-fakesubmit',
		];

		// ******** Site rows *******
		$siteFields = [
			'site' => [
				'type' => 'text',
				'size' => 200,
			],
			'delete' => [
				'type' => 'submit',
				'default' => $this->msg( 'globalwatchlist-remove' )->escaped(),
				'flags' => [ 'destructive' ],
			],
		];
		$sitesDefault = [];
		foreach ( $userOptions['sites'] as $defaultSite ) {
			$sitesDefault[] = [ 'site' => $defaultSite ];
		}
		$sitesDefault[] = [ 'site' => null ];
		$fields['sites'] = [
			'type' => 'cloner',
			'fields' => $siteFields,
			'section' => 'sitelist',
			'validation-callback' => [ $formValidator, 'validateSitesChosen' ],
			'default' => $sitesDefault,
			'create-button-message' => 'globalwatchlist-add',
		];

		// ******** Filters ********
		$fields['anon'] = [
			'type' => 'radio',
			'options' => [
				$this->msg( 'globalwatchlist-filter-either' )->escaped() => SettingsManager::FILTER_EITHER,
				$this->msg( 'globalwatchlist-filter-only-anon' )->escaped() => SettingsManager::FILTER_REQUIRE,
				$this->msg( 'globalwatchlist-filter-not-anon' )->escaped() => SettingsManager::FILTER_EXCLUDE,
			],
			'label-message' => 'globalwatchlist-filter-anon',
			'section' => 'filters',
			'default' => $userOptions['anonfilter'],
		];
		$fields['bot'] = [
			'type' => 'radio',
			'options' => [
				$this->msg( 'globalwatchlist-filter-either' )->escaped() => SettingsManager::FILTER_EITHER,
				$this->msg( 'globalwatchlist-filter-only-bot' )->escaped() => SettingsManager::FILTER_REQUIRE,
				$this->msg( 'globalwatchlist-filter-not-bot' )->escaped() => SettingsManager::FILTER_EXCLUDE,
			],
			'label-message' => 'globalwatchlist-filter-bot',
			'validation-callback' => [ $formValidator, 'validateAnonBot' ],
			'section' => 'filters',
			'default' => $userOptions['botfilter'],
		];
		$fields['minor'] = [
			'type' => 'radio',
			'options' => [
				$this->msg( 'globalwatchlist-filter-either' )->escaped() => SettingsManager::FILTER_EITHER,
				$this->msg( 'globalwatchlist-filter-only-minor' )->escaped() => SettingsManager::FILTER_REQUIRE,
				$this->msg( 'globalwatchlist-filter-not-minor' )->escaped() => SettingsManager::FILTER_EXCLUDE,
			],
			'label-message' => 'globalwatchlist-filter-minor',
			'validation-callback' => [ $formValidator, 'validateAnonMinor' ],
			'section' => 'filters',
			'default' => $userOptions['minorfilter'],
		];

		// ********** Other options ********
		$fields['types'] = [
			'type' => 'multiselect',
			'label-message' => 'globalwatchlist-changetypes',
			'options' => [
				$this->msg( 'globalwatchlist-show-edits' )->escaped() => 'edit',
				$this->msg( 'globalwatchlist-show-logentries' )->escaped() => 'log',
				$this->msg( 'globalwatchlist-show-newpages' )->escaped() => 'new',
			],
			'validation-callback' => [ $formValidator, 'requireShowingOneType' ],
			'section' => 'otheroptions',
			'default' => $userOptions['showtypes'],
		];

		$otherOptionsDefaults = [];
		if ( $userOptions['grouppage'] ) {
			$otherOptionsDefaults[] = 'grouppage';
		}
		if ( $userOptions['confirmallsites'] ) {
			$otherOptionsDefaults[] = 'confirmallsites';
		}
		if ( $userOptions['fastmode'] ) {
			$otherOptionsDefaults[] = 'fastmode';
		}
		$fields['otheroptions'] = [
			'type' => 'multiselect',
			'label-message' => 'globalwatchlist-otheroptions',
			'options' => [
				$this->msg( 'globalwatchlist-option-grouppage' )->escaped() => 'grouppage',
				$this->msg( 'globalwatchlist-option-confirmallsites' )->escaped() => 'confirmallsites',
				$this->msg( 'globalwatchlist-option-fastmode' )->escaped() => 'fastmode',
			],
			'section' => 'otheroptions',
			'default' => $otherOptionsDefaults,
		];

		return $fields;
	}

	/**
	 * @param array $data
	 * @param HTMLForm|null $form
	 * @return bool|string|array|Status
	 */
	public function onSubmit( array $data, HTMLForm $form = null ) {
		$this->logger->info(
			"Settings form submitted with {options}",
			[
				'options' => FormatJson::encode( $data )
			]
		);

		$sites = array_map(
			static function ( $row ) {
				// Accept and handle sites with a protocol, see T262762
				return preg_replace( '/^(?:https?:)?\/\//', '', trim( $row['site'] ) );
			},
			$data['sites']
		);

		// Use array_values to ensure we don't save the keys if there are empty sites,
		// keys don't matter and take up space in the database
		$sites = array_values(
			array_filter(
				$sites,
				static function ( $site ) {
					return ( $site !== '' );
				}
			)
		);

		$userOptions = [
			'sites' => $sites,
			'anonfilter' => (int)$data['anon'],
			'botfilter' => (int)$data['bot'],
			'minorfilter' => (int)$data['minor'],
			'confirmallsites' => in_array( 'confirmallsites', $data['otheroptions'] ),
			'fastmode' => in_array( 'fastmode', $data['otheroptions'] ),
			'grouppage' => in_array( 'grouppage', $data['otheroptions'] ),
			'showtypes' => $data['types'],
		];

		$this->settingsManager->saveUserOptions(
			$this->getUser(),
			$userOptions
		);
		return true;
	}

	/**
	 * Settings were saved successfully
	 */
	public function onSuccess() {
		$this->getOutput()->addWikiMsg( 'globalwatchlist-notify-settingssaved' );
	}

	/**
	 * @return bool
	 */
	public function doesWrites() {
		return true;
	}

	/**
	 * @return string
	 */
	protected function getGroupName() {
		return 'changes';
	}

	/**
	 * Only shown for logged in users
	 *
	 * @return bool
	 */
	public function isListed() {
		return $this->getUser()->isNamed();
	}

}
