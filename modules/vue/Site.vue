<template>
	<div class="ext-globalwatchlist-vue-site">
		<h3>
			<a
				v-bind:href="specialWatchlistUrl"
				target="_blank"
			>{{ site }}</a>
			(<!--
				Avoid a space
			--><a
				v-bind:href="specialEditWatchlistUrl"
				target="_blank"
			>{{ $i18n( 'globalwatchlist-editwatchlist' ).text() }}</a><!--
				Avoid a space
			-->)
		</h3>
		<p v-if="hasApiError">
			{{ $i18n( 'globalwatchlist-fetch-site-failure' ).text() }}
		</p>
		<global-watchlist-collapsible-wrapper v-else>
			<global-watchlist-button
				v-on:click="markChangesSeen"
			>
				{{ $i18n( 'globalwatchlist-markseen' ).text() }}
			</global-watchlist-button>
			<global-watchlist-entry-row
				v-for="(rowInfo, index) in entries"
				v-bind:key="index"
				v-bind:entry="rowInfo"
				v-bind:pagewatched="rowInfo.pageWatched"
				v-bind:site="site"
				v-on:unwatch-page="onUnwatchPage"
				v-on:rewatch-page="onRewatchPage"
			>
			</global-watchlist-entry-row>
		</global-watchlist-collapsible-wrapper>
	</div>
</template>

<script>
var GlobalWatchlistLinker = require( './../Linker.js' );

var Button = require( './base/Button.vue' ),
	CollapsibleWrapper = require( './base/CollapsibleWrapper.vue' ),
	EntryRow = require( './EntryRow.vue' );

/**
 * Output for a specific site
 *
 * Inputs:
 *  - entries, array of objects for EntryRow
 *  - site, string (url) for the site in question
 *
 * Emits:
 *  - `unwatch-site-page` when unwatching a page.
 *     Parameters: site (url), title
 *  - `rewatch-site-page` when rewatching a page.
 *     Parameters: site (url), title
 *  - `mark-site-seen` when marking a site as seen.
 *     Parameters: site (url)
 */
module.exports = {
	components: {
		'global-watchlist-button': Button,
		'global-watchlist-collapsible-wrapper': CollapsibleWrapper,
		'global-watchlist-entry-row': EntryRow
	},

	props: {
		entries: {
			type: Array,
			required: true
		},
		site: {
			type: String,
			required: true
		}
	},

	computed: {
		hasApiError: function () {
			// If this is created but has no entries, its because something went wrong
			return this.entries.length === 0;
		},
		linker: function () {
			return new GlobalWatchlistLinker( this.site );
		},
		specialWatchlistUrl: function () {
			return this.linker.linkPage( 'Special:Watchlist' );
		},
		specialEditWatchlistUrl: function () {
			return this.linker.linkPage( 'Special:EditWatchlist' );
		}
	},

	methods: {
		onUnwatchPage: function ( eventTitle ) {
			this.$emit( 'unwatch-site-page', this.site, eventTitle );
			this.entries.forEach( function ( entryInfo ) {
				if ( entryInfo.title === eventTitle ) {
					entryInfo.pageWatched = false;
					// To remove the clock
					entryInfo.expiry = false;
				}
			} );
			this.$forceUpdate();
		},
		onRewatchPage: function ( eventTitle ) {
			this.$emit( 'rewatch-site-page', this.site, eventTitle );
			this.entries.forEach( function ( entryInfo ) {
				if ( entryInfo.title === eventTitle ) {
					entryInfo.pageWatched = true;
				}
			} );
			this.$forceUpdate();
		},
		markChangesSeen: function () {
			this.$emit( 'mark-site-seen', this.site );
		}
	}
};
</script>
