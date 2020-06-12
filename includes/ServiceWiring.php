<?php

use MediaWiki\Extension\GlobalWatchlist\SettingsManager;
use MediaWiki\Logger\LoggerFactory;
use MediaWiki\MediaWikiServices;

return [
	'GlobalWatchlistSettingsManager' => function (
		MediaWikiServices $services
	) : SettingsManager {
		/** @var JavascriptContentHandler $contentHandler */
		$contentHandler = $services->getContentHandlerFactory()
			->getContentHandler( CONTENT_MODEL_JAVASCRIPT );
		'@phan-var JavascriptContentHandler $contentHandler';

		return new SettingsManager(
			LoggerFactory::getInstance( 'GlobalWatchlist' ),
			$contentHandler
		);
	},
];
