<template>
	<div
		id="mw-globalwatchlist-vue-toolbar"
	>
		<global-watchlist-toggle
			v-bind:text="$i18n( 'globalwatchlist-option-live' )"
			v-bind:disabled="disableLiveUpdates"
			v-on:toggle="toggleLiveUpdates"
		>
		</global-watchlist-toggle>

		<global-watchlist-toggle
			v-bind:text="$i18n( 'globalwatchlist-option-grouppage' )"
			v-bind:startactive="groupPageStartActive"
			v-bind:disabled="disableGroupPage"
			v-on:toggle="toggleGroupPage"
		>
		</global-watchlist-toggle>

		<global-watchlist-button
			v-bind:text="$i18n( 'globalwatchlist-refresh' )"
			v-bind:disabled="disableRefresh"
			v-on:click="triggerRefresh"
		>
		</global-watchlist-button>

		<a
			v-bind:href=settingsUrl
			target="_blank"
		>
			{{ $i18n( 'globalwatchlist-globalwatchlistsettingslink' ) }}
		</a>

		<global-watchlist-button
			v-bind:text="$i18n( 'globalwatchlist-markseen-all' )"
			v-bind:disabled="disableMarkAll"
			v-on:click="triggerMarkAll"
		>
		</global-watchlist-button>
	</div>
</template>

<script>
var Button = require( './base/Button.vue' ),
	Toggle = require( './base/Toggle.vue' );

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
