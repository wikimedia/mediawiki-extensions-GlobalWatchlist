/* eslint-disable no-jquery/no-global-selector */
/*
 * Javascript for loading the Vue version of Special:GlobalWatchlist
 */
( function () {
	'use strict';

	// On ready initialization
	$( () => {
		$( '.ext-globalwatchlist-content' )
			.empty()
			.append(
				$( '<div>' )
					.attr( 'id', 'ext-globalwatchlist-vue' )
			);

		const Vue = require( 'vue' ),
			vuePage = require( './vue/SpecialGlobalWatchlist.vue' );

		mw.globalwatchlist = {};
		mw.globalwatchlist.vue = new Vue( {
			el: '#ext-globalwatchlist-vue',
			render: function ( createElement ) {
				return createElement( vuePage );
			}
		} );
	} );
}() );
