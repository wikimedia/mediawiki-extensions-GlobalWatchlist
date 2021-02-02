<template>
	<div
		id="ext-globalwatchlist-vue-toolbar"
	>
		<global-watchlist-toggle
			v-bind:disabled="disableLiveUpdates"
			v-on:toggle="toggleLiveUpdates"
		>
			{{ $i18n( 'globalwatchlist-option-live' ).text() }}
		</global-watchlist-toggle>

		<global-watchlist-toggle
			v-bind:startactive="groupPageStartActive"
			v-bind:disabled="disableGroupPage"
			v-on:toggle="toggleGroupPage"
		>
			{{ $i18n( 'globalwatchlist-option-grouppage' ).text() }}
		</global-watchlist-toggle>

		<global-watchlist-button
			v-bind:disabled="disableRefresh"
			v-on:click="triggerRefresh"
		>
			{{ $i18n( 'globalwatchlist-refresh' ).text() }}
		</global-watchlist-button>

		<a
			v-bind:href="settingsUrl"
			target="_blank"
		>
			{{ $i18n( 'globalwatchlist-globalwatchlistsettingslink' ).text() }}
		</a>

		<global-watchlist-button
			v-bind:disabled="disableMarkAll"
			v-on:click="triggerMarkAll"
		>
			{{ $i18n( 'globalwatchlist-markseen-all' ).text() }}
		</global-watchlist-button>
	</div>
</template>

<script>
var Button = require( './base/Button.vue' ),
	Toggle = require( './base/Toggle.vue' );

/**
 * Toolbar at the top of the page
 *
 * Inputs:
 *  - startresultsgrouped, boolean for whether to starting with results grouped by page
 *  - liveupdatesdisabled, boolean for whether to disable the live updates toggle
 *  - grouppagedisabled, boolean for whether to disable the group results by page toggle
 *  - refreshdisabled, boolean for whether to disable the refresh button
 *  - markalldisabled, boolean for whether to disable the button to mark all sites as seen
 *
 * Emits:
 *  - `toggle-group-page` when toggling grouping results by page
 *     Parameters: boolean for whether the toggle is now active
 *  - `toggle-live-updates` when toggling grouping live updates
 *     Parameters: boolean for whether the toggle is now active
 *  - `click-refresh` when the refresh button is clicked
 *  - `mark-all-sites-seen` when the button to mark all sites as seen is clicked
 */
module.exports = {
	components: {
		'global-watchlist-button': Button,
		'global-watchlist-toggle': Toggle
	},

	props: {
		startresultsgrouped: {
			type: Boolean,
			default: false
		},
		liveupdatesdisabled: {
			type: Boolean,
			default: false
		},
		grouppagedisabled: {
			type: Boolean,
			default: false
		},
		refreshdisabled: {
			type: Boolean,
			default: false
		},
		markalldisabled: {
			type: Boolean,
			default: false
		}
	},

	computed: {
		settingsUrl: function () {
			return mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:GlobalWatchlistSettings' );
		},
		groupPageStartActive: function () {
			return this.startresultsgrouped;
		},
		disableLiveUpdates: function () {
			return this.liveupdatesdisabled;
		},
		disableGroupPage: function () {
			return this.grouppagedisabled;
		},
		disableRefresh: function () {
			return this.refreshdisabled;
		},
		disableMarkAll: function () {
			return this.markalldisabled;
		}
	},

	methods: {
		toggleGroupPage: function ( isActive ) {
			this.$emit( 'toggle-group-page', isActive );
		},
		toggleLiveUpdates: function ( isActive ) {
			this.$emit( 'toggle-live-updates', isActive );
		},
		triggerRefresh: function () {
			this.$emit( 'click-refresh' );
		},
		triggerMarkAll: function () {
			this.$emit( 'mark-all-sites-seen' );
		}
	}
};
</script>
