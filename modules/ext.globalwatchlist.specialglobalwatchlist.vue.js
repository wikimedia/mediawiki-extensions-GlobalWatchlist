/* eslint-disable no-jquery/no-global-selector */
/*
 * Javascript for (eventually) loading the Vue version of Special:GlobalWatchlist
 *
 * For now, just displays a note that it was loaded
 */
( function () {
	'use strict';

	// On ready initialization
	$( function () {
		/* eslint-disable-next-line no-console */
		console.log( 'GlobalWatchlist Vue code loaded' );

		$( '.globalwatchlist-content' )
			.empty()
			.append(
				$( '<p>' )
					.text( 'GlobalWatchlist Vue code loaded' )
			);
	} );
}() );
