'use strict';

const Page = require( 'wdio-mediawiki/Page' );

class GlobalWatchlist extends Page {
	// The content that is shown, for either version of the display
	get content() {
		return $( '.ext-globalwatchlist-content' );
	}

	async openDisplay() {
		return super.openTitle( 'Special:GlobalWatchlist' );
	}
}

module.exports = new GlobalWatchlist();
