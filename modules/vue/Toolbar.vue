<template>
	<div
		id="mw-globalwatchlist-vue-toolbar"
	>
		<global-watchlist-toggle
			v-bind:text="$i18n( 'globalwatchlist-option-live' )"
			v-on:toggle="toggleLiveUpdates"
		>
		</global-watchlist-toggle>

		<global-watchlist-toggle
			v-bind:text="$i18n( 'globalwatchlist-option-grouppage' )"
			v-bind:startactive="groupPageStartActive"
			v-on:toggle="toggleGroupPage"
		>
		</global-watchlist-toggle>

		<global-watchlist-button
			v-bind:text="$i18n( 'globalwatchlist-refresh' )"
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
		}
	},

	computed: {
		settingsUrl: function () {
			return mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:GlobalWatchlistSettings' );
		},
		groupPageStartActive: function () {
			return this.startresultsgrouped;
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
