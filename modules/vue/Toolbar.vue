<template>
	<div
		id="mw-globalwatchlist-vue-toolbar"
	>
		<global-watchlist-button
			name="live-updates"
			text="Live updates"
			v-on:click="toggleLiveUpdates"
		>
		</global-watchlist-button>

		<global-watchlist-button
			name="group-results"
			text="Group results by page"
			v-on:click="toggleGroupPage"
		>
		</global-watchlist-button>

		<global-watchlist-button
			name="refresh-sites"
			text="Refresh"
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
			name="mark-all-seen"
			text="Mark all sites as seen"
			v-on:click="triggerMarkAll"
		>
		</global-watchlist-button>
	</div>
</template>

<script>
var Button = require( './Button.vue' );

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
