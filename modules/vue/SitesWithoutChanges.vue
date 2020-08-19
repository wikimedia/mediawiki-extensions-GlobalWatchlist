<template>
	<div id="mw-globalwatchlist-vue-sites-without-changes">
		<hr>
		<!-- Maybe implement a label component at some point? -->
		<p>{{ $i18n( 'globalwatchlist-emptyfeed' ) }}</p>
		<global-watchlist-collapsible-wrapper
			startcollapsed=true
		>
			<ul id="mw-globalwatchlist-vue-sites-without-changes-list">
				<li
					v-for="site in emptysiterows"
					v-bind:key=site['site-name']
				>
					<a v-bind:href=site['special-watchlist-url'] target="_blank">{{ site['site-name'] }}</a>
					(<a v-bind:href=site['special-edit-watchlist-url'] target="_blank">{{ site['edit-watchlist-msg'] }}</a>)
				</li>
			</ul>
		</global-watchlist-collapsible-wrapper>
	</div>
</template>

<script>
var CollapsibleWrapper = require( './base/CollapsibleWrapper.vue' );
/**
 * Component for the block of sites that have no changes
 *
 * Inputs:
 *  - emptysitelist, array of sites (url form) with no changes
 */
module.exports = {
	components: {
		'global-watchlist-collapsible-wrapper': CollapsibleWrapper
	},

	props: {
		emptysitelist: {
			type: Array,
			default: [ 'missing.site.list' ]
		}
	},

	computed: {
		emptysiterows: function () {
			var that = this;
			var rows = this.emptysitelist.map( function ( site ) {
				return {
					'special-watchlist-url': '//' + site + mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:Watchlist' ),
					'site-name': site,
					'special-edit-watchlist-url': '//' + site + mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:EditWatchlist' ),
					'edit-watchlist-msg': that.$i18n( 'globalwatchlist-editwatchlist' )
				};
			} );
			return rows;
		}
	}
};
</script>
