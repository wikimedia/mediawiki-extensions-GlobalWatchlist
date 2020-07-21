// Package files are needed because the individual files being tested
// are not available in a module, but it means that there is only one entry
// point, here. Individually `require` the different tests

require( './ext.globalwatchlist.linker.tests.js' );
require( './ext.globalwatchlist.getSettings.tests.js' );
require( './ext.globalwatchlist.watchlistUtils.tests.js' );
