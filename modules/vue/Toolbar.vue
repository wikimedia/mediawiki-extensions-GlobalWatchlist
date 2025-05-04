<template>
	<div
		id="ext-globalwatchlist-vue-toolbar"
	>
		<wvui-toggle-button
			:is-active="liveUpdatesActive"
			:disabled="disableLiveUpdates"
			@change="toggleLiveUpdates"
		>
			<wvui-icon
				class="ext-globalwatchlist-button-icon"
				:icon="iconLiveUpdates"
			>
			</wvui-icon>
			{{ $i18n( 'globalwatchlist-option-live' ).text() }}
		</wvui-toggle-button>

		<wvui-toggle-button
			:is-active="groupPageActive"
			:disabled="disableGroupPage"
			@change="toggleGroupPage"
		>
			{{ $i18n( 'globalwatchlist-option-grouppage' ).text() }}
		</wvui-toggle-button>

		<wvui-button
			action="progressive"
			:disabled="disableRefresh"
			@click="triggerRefresh"
		>
			<span>
				<!-- TODO once T273493 is resolved, use `startIcon` instead of
					needing to specify one manually, here and below -->
				<wvui-icon
					class="ext-globalwatchlist-button-icon"
					:icon="icons.reload"
				>
				</wvui-icon>
				{{ $i18n( 'globalwatchlist-refresh' ).text() }}
			</span>
		</wvui-button>

		<wvui-button>
			<a
				:href="settingsUrl"
				target="_blank"
			>
				<!-- Icon is part of the link -->
				<wvui-icon
					class="ext-globalwatchlist-button-icon"
					:icon="icons.settings"
				>
				</wvui-icon>
				{{ $i18n( 'globalwatchlist-globalwatchlistsettingslink' ).text() }}
			</a>
		</wvui-button>

		<wvui-button
			action="destructive"
			:disabled="disableMarkAll"
			@click="triggerMarkAll"
		>
			<span>
				<wvui-icon
					class="ext-globalwatchlist-button-icon"
					:icon="icons.checkAll"
				>
				</wvui-icon>
				{{ $i18n( 'globalwatchlist-markseen-all' ).text() }}
			</span>
		</wvui-button>
	</div>
</template>

<script>

const WvuiButton = require( 'wvui' ).WvuiButton;
const WvuiIcon = require( 'wvui' ).WvuiIcon;
const WvuiToggleButton = require( 'wvui' ).WvuiToggleButton;

/**
 * Toolbar at the top of the page
 *
 * Inputs:
 *  - liveUpdatesActive, boolean for whether currently in live updates
 *  - liveupdatesdisabled, boolean for whether to disable the live updates toggle
 *  - groupPageActive, boolean for whether to grouping results by page
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
		'wvui-toggle-button': WvuiToggleButton,
		'wvui-button': WvuiButton,
		'wvui-icon': WvuiIcon
	},

	props: {
		liveUpdatesActive: {
			type: Boolean,
			default: false
		},
		liveupdatesdisabled: {
			type: Boolean,
			default: false
		},
		groupPageActive: {
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
