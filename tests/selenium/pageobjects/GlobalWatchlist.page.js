'use strict';

const Page = require( 'wdio-mediawiki/Page' );

class GlobalWatchlist extends Page {
	// The content that is shown, for either version of the display
	get content() {
		return $( '.ext-globalwatchlist-content' );
	}

	openDisplay( displayVersion ) {
		// When the `mw-globalwatchlist-selenium-test` cookie is set, the `displayversion`
		// parameter can override $wgGlobalWatchlistUseVue, allowing us to test both versions
		// of the display.
		super.openTitle( 'Special:GlobalWatchlist', { displayversion: displayVersion } );
	}
}

module.exports = new GlobalWatchlist();
