// Package files are needed because the individual files being tested
// are not available in a module, but it means that there is only one entry
// point, here. Individually `require` the different tests

require( './Debug.tests.js' );
require( './Linker.tests.js' );
require( './getSettings.tests.js' );
require( './watchlistUtils.tests.js' );
