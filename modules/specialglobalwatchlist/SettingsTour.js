/*
 * GuidedTour introduction to Special:GlobalWatchlistSettings
 */
( function () {
	'use strict';

	mw.globalwatchlist = {};

	const tour = new mw.guidedTour.TourBuilder( {
		name: 'GlobalWatchlistSettings',

		// Only used on [[Special:GlobalWatchlistSettings]], don't need to track current
		// step via cookies
		isSinglePage: true,

		// Log events for the tour
		shouldLog: true
	} );
	mw.globalwatchlist.tour = tour;

	// Tour steps, in order:
	// - introduction
	// - sitelist
	// - addsite
	// - filters
	// - types
	// - fastmode
	// - help

	const intro = {
		name: 'intro',
		titlemsg: 'globalwatchlist-tour-intro',
		descriptionmsg: 'globalwatchlist-tour-intro-description',
		overlay: true
	};
	tour.firstStep( intro )
		.next( 'sitelist' );

	// Attaching it to the overall input <ul> element results in the dialogue being centered
	// horizontally on the page, but it should be over the actual list entries. Use the first
	// text box for positioning.
	const sitelist = {
		name: 'sitelist',
		titlemsg: 'globalwatchlist-tour-sitelist',
		descriptionmsg: 'globalwatchlist-tour-sitelist-description',
		attachTo: '#mw-htmlform-cloner-list-mw-input-wpsites > li > div > div:first',
		position: 'top'
	};
	tour.step( sitelist )
		.next( 'addsite' )
		.back( 'intro' );

	// TODO after T258935 sets a maximum number of sites that can be included, add that to
	// the description
	const addsite = {
		name: 'addsite',
		titlemsg: 'globalwatchlist-tour-addsite',
		descriptionmsg: 'globalwatchlist-tour-addsite-description',
		attachTo: '#mw-input-wpsites--create',
		position: 'bottom'
	};
	tour.step( addsite )
		.back( 'sitelist' )
		.next( 'filters' );

	// Avoid centering on the entire page, but rather over the middle label.
	const filters = {
		name: 'filters',
		titlemsg: 'globalwatchlist-tour-filters',
		descriptionmsg: 'globalwatchlist-tour-filters-description',
		attachTo: '#mw-htmlform-filters > div > div > span > label:eq(1)',
		position: 'top'
	};
	tour.step( filters )
		.back( 'addsite' )
		.next( 'types' );

	// Avoid centering on the entire page, but rather on the list of change
	// types specifically. Use the label for positioning.
	const types = {
		name: 'types',
		titlemsg: 'globalwatchlist-tour-types',
		descriptionmsg: 'globalwatchlist-tour-types-description',
		attachTo: '#mw-htmlform-otheroptions > div > div > span > label:first',
		position: 'top'
	};
	tour.step( types )
		.back( 'filters' )
		.next( 'fastmode' );

	const fastmode = {
		name: 'fastmode',
		titlemsg: 'globalwatchlist-tour-fastmode',
		descriptionmsg: 'globalwatchlist-tour-fastmode-description',
		attachTo: 'input[value="fastmode"]',
		position: 'top'
	};
	tour.step( fastmode )
		.back( 'types' )
		.next( 'help' );

	const help = {
		name: 'help',
		titlemsg: 'globalwatchlist-tour-help',
		descriptionmsg: 'globalwatchlist-tour-help-description',
		attachTo: '#mw-indicator-mw-helplink',
		position: 'left'
	};
	tour.step( help )
		.back( 'fastmode' );

	// Start automatically, since this code is only loaded if the tour should be shown
	tour.tour.start();
}() );
