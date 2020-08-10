<template>
	<div
		id="mw-globalwatchlist-vue-toolbar"
	>
		<global-watchlist-button
			v-bind:text="$i18n( 'globalwatchlist-option-live' )"
			v-on:click="toggleLiveUpdates"
		>
		</global-watchlist-button>

		<global-watchlist-button
			v-bind:text="$i18n( 'globalwatchlist-option-grouppage' )"
			v-on:click="toggleGroupPage"
		>
		</global-watchlist-button>

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
var Button = require( './base/Button.vue' );

module.exports = {
	components: {
		'global-watchlist-button': Button
	},

	computed: {
		settingsUrl: function () {
			return mw.config.get( 'wgArticlePath' ).replace( '$1', 'Special:GlobalWatchlistSettings' );
		}
	},

	methods: {
		toggleGroupPage: function () {
			this.$emit( 'toggle-group-page' );
		},
		toggleLiveUpdates: function () {
			this.$emit( 'toggle-live-updates' );
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
