<template>
	<div
		id="ext-globalwatchlist-vue-toolbar"
	>
		<global-watchlist-toggle
			v-bind:disabled="disableLiveUpdates"
			v-on:toggle="toggleLiveUpdates"
		>
			<wvui-icon
				class="ext-globalwatchlist-button-icon"
				v-bind:icon="iconLiveUpdates"
			>
			</wvui-icon>
			{{ $i18n( 'globalwatchlist-option-live' ).text() }}
		</global-watchlist-toggle>

		<global-watchlist-toggle
			v-bind:startactive="groupPageStartActive"
			v-bind:disabled="disableGroupPage"
			v-on:toggle="toggleGroupPage"
		>
			{{ $i18n( 'globalwatchlist-option-grouppage' ).text() }}
		</global-watchlist-toggle>

		<wvui-button
			action="progressive"
			v-bind:disabled="disableRefresh"
			v-on:click="triggerRefresh"
		>
			<span>
				<!-- TODO once T273493 is resolved, use `startIcon` instead of
					needing to specify one manually, here and below -->
				<wvui-icon
					class="ext-globalwatchlist-button-icon"
					v-bind:icon="icons.reload"
				>
				</wvui-icon>
				{{ $i18n( 'globalwatchlist-refresh' ).text() }}
			</span>
		</wvui-button>

		<wvui-button>
			<a
				v-bind:href="settingsUrl"
				target="_blank"
			>
				<!-- Icon is part of the link -->
				<wvui-icon
					class="ext-globalwatchlist-button-icon"
					v-bind:icon="icons.settings"
				>
				</wvui-icon>
				{{ $i18n( 'globalwatchlist-globalwatchlistsettingslink' ).text() }}
			</a>
		</wvui-button>

		<wvui-button
			action="destructive"
			v-bind:disabled="disableMarkAll"
			v-on:click="triggerMarkAll"
		>
			<span>
				<wvui-icon
					class="ext-globalwatchlist-button-icon"
					v-bind:icon="icons.checkAll"
				>
				</wvui-icon>
				{{ $i18n( 'globalwatchlist-markseen-all' ).text() }}
			</span>
		</wvui-button>
	</div>
</template>

<script>
var Toggle = require( './base/Toggle.vue' );

var WvuiButton = require( 'wvui' ).WvuiButton;
var WvuiIcon = require( 'wvui' ).WvuiIcon;

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
// @vue/component
module.exports = {
	components: {
		'global-watchlist-toggle': Toggle,
		'wvui-button': WvuiButton,
		'wvui-icon': WvuiIcon
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

	data: function () {
		// Need a local copy of liveUpdatesActive to control the displayed icon
		return {
			liveUpdatesActive: false
		};
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
		},

		icons: function () {
			return require( './icons.json' );
		},
		iconLiveUpdates: function () {
			// Icon that is shown changes depending of if live updates are running
			if ( this.liveUpdatesActive ) {
				return this.icons.pause;
			}
			return this.icons.play;
		}
	},

	methods: {
		toggleGroupPage: function ( isActive ) {
			this.$emit( 'toggle-group-page', isActive );
		},
		toggleLiveUpdates: function ( isActive ) {
			this.liveUpdatesActive = isActive;
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
