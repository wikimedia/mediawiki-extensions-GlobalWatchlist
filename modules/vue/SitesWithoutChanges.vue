<template>
	<div id="ext-globalwatchlist-vue-sites-without-changes">
		<hr>
		<label>{{ $i18n( 'globalwatchlist-emptyfeed' ).text() }}</label>
		<global-watchlist-collapsible-wrapper
			v-bind:startcollapsed="true"
		>
			<ul id="ext-globalwatchlist-vue-sites-without-changes-list">
				<li
					v-for="site in emptysiterows"
					v-bind:key="site['site-name']"
				>
					<!-- eslint-disable max-len -->
					<a v-bind:href="site['special-watchlist-url']" target="_blank">{{ site['site-name'] }}</a>
					(<a v-bind:href="site['special-edit-watchlist-url']" target="_blank">{{ site['edit-watchlist-msg'] }}</a>)
					<!-- eslint-enable max-len -->
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
					'edit-watchlist-msg': that.$i18n( 'globalwatchlist-editwatchlist' ).text()
				};
			} );
			return rows;
		}
	}
};
</script>
