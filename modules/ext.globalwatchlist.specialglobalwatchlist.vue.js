/* eslint-disable no-jquery/no-global-selector */
/*
 * Javascript for loading the Vue version of Special:GlobalWatchlist
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
				$( '<div>' )
					.attr( 'id', 'mw-globalwatchlist-vue' )
			);

		var Vue = require( 'vue' ),
			vuePage = require( './vue/SpecialGlobalWatchlist.vue' );

		mw.globalwatchlist = {};
		mw.globalwatchlist.vue = new Vue( {
			el: '#mw-globalwatchlist-vue',
			render: function ( createElement ) {
				return createElement( vuePage );
			}
		} );
	} );
}() );
