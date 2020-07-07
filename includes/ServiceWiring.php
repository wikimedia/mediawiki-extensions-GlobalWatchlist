<?php

use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWiki\Logger\LoggerFactory;
use MediaWiki\MediaWikiServices;

return [
	'GlobalWatchlistSettingsManager' => function (
		MediaWikiServices $services
	) : SettingsManager {
		return new SettingsManager(
			LoggerFactory::getInstance( 'GlobalWatchlist' ),
			$services->getUserOptionsManager()
		);
	},
];
