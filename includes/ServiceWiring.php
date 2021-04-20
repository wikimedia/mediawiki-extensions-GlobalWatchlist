<?php

use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWiki\Logger\LoggerFactory;
use MediaWiki\MediaWikiServices;

// PHPUnit doesn't understand code coverage for code outside of classes/functions,
// like service wiring files. This *is* tested though, see
// tests/phpunit/integration/ServiceWiringTest.php
// @codeCoverageIgnoreStart

return [
	'GlobalWatchlistSettingsManager' => static function (
		MediaWikiServices $services
	) : SettingsManager {
		return new SettingsManager(
			LoggerFactory::getInstance( 'GlobalWatchlist' ),
			$services->getUserOptionsManager(),
			$services->getStatsdDataFactory()
		);
	},
];

// @codeCoverageIgnoreEnd
