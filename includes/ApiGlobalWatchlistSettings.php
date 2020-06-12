<?php

/**
 * Implements the GlobalWatchlist settings API
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
 */

namespace MediaWiki\Extension\GlobalWatchlist;

use ApiBase;
use ApiMain;

/**
 * @author DannyS712
 */
class ApiGlobalWatchlistSettings extends ApiBase {

	/** @var SettingsManager */
	private $settingsManager;

	/**
	 * @param ApiMain $apiMain
	 * @param string $name
	 * @param SettingsManager $settingsManager
	 */
	public function __construct(
		ApiMain $apiMain,
		string $name,
		SettingsManager $settingsManager
	) {
		parent::__construct( $apiMain, $name );
		$this->settingsManager = $settingsManager;
	}

	/**
	 * @param ApiMain $apiMain
	 * @param string $name
	 * @param SettingsManager $settingsManager
	 * @return ApiGlobalWatchlistSettings
	 */
	public static function newFromGlobalState(
		ApiMain $apiMain,
		string $name,
		SettingsManager $settingsManager
	) : ApiGlobalWatchlistSettings {
		return new self( $apiMain, $name, $settingsManager );
	}

	/**
	 * Save the settings
	 *
	 * TODO add validation
	 */
	public function execute() {
		$params = $this->extractRequestParams();

		$settings = [
			'sites' => $params['sites'],
			'anonfilter' => (int)$params['anonfilter'],
			'botfilter' => (int)$params['botfilter'],
			'minorfilter' => (int)$params['minorfilter'],
			'confirmallsites' => $params['confirmallsites'],
			'fastmode' => $params['fastmode'],
			'grouppage' => $params['grouppage'],
			'showtypes' => $params['showtypes'],
		];
		$this->settingsManager->saveUserOptions( $this->getUser(), $settings );

		$result = [ 'result' => 'Success' ];
		$this->getResult()->addValue( null, $this->getModuleName(), $result );
	}

	/**
	 * @inheritDoc
	 */
	public function getAllowedParams() {
		return [
			'sites' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true,
				ApiBase::PARAM_ISMULTI => true
			],
			'anonfilter' => [
				ApiBase::PARAM_TYPE => [ '0', '1', '2' ],
				ApiBase::PARAM_REQUIRED => true
			],
			'botfilter' => [
				ApiBase::PARAM_TYPE => [ '0', '1', '2' ],
				ApiBase::PARAM_REQUIRED => true
			],
			'minorfilter' => [
				ApiBase::PARAM_TYPE => [ '0', '1', '2' ],
				ApiBase::PARAM_REQUIRED => true
			],
			'confirmallsites' => false,
			'fastmode' => false,
			'grouppage' => false,
			'showtypes' => [
				ApiBase::PARAM_TYPE => [ 'edit', 'new', 'log' ],
				ApiBase::PARAM_ISMULTI => true,
				ApiBase::PARAM_DFLT => 'edit|new|log',
			]
		];
	}

	/**
	 * @inheritDoc
	 */
	public function isInternal() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function mustBePosted() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function isWriteMode() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function needsToken() {
		return 'csrf';
	}

	/**
	 * @inheritDoc
	 */
	public function getHelpUrls() {
		return 'https://www.mediawiki.org/wiki/Extension:GlobalWatchlist';
	}

	/**
	 * @inheritDoc
	 */
	protected function getExamplesMessages() {
		return [];
	}

}
