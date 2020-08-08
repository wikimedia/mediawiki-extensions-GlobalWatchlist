<template>
	<div id="mw-globalwatchlist-vue-specialpage">
		<global-watchlist-toolbar
			v-on:toggle-live-updates="toggleLiveUpdates"
			v-on:toggle-group-page="toggleGroupPage"
			v-on:click-refresh="refreshSites"
			v-on:mark-all-sites-seen="markAllSitesSeen"
		>
		</global-watchlist-toolbar>
		<hr>


		<div
			v-if="inLoading"
			class="mw-globalwatchlist-vue-loading"
		>
			<global-watchlist-loading-bar></global-watchlist-loading-bar>
		</div>

		<div
			v-else
			class="mw-globalwatchlist-sitelist"
		>
			<global-watchlist-label
				v-bind:text=asOfLabelText
			>
			</global-watchlist-label>
			<div v-if="haveChangesToShow">
				<p>{{ $i18n( 'globalwatchlist-changesfeed' ) }}</p>
				<global-watchlist-sites-with-changes
					v-for="withChanges in sitesWithChangesList"
					v-bind:key=withChanges['site']
					v-bind:site=withChanges['site']
					v-bind:entries=withChanges['entries']
					v-on:unwatch-site-page="onUnwatchSitePage"
					v-on:rewatch-site-page="onRewatchSitePage"
					v-on:mark-site-seen="markSiteAsSeen"
				>
				</global-watchlist-sites-with-changes>
			</div>
			<div v-if="haveEmptySites">
				<global-watchlist-collapsible-wrapper>
					<global-watchlist-sites-without-changes
						v-bind:emptysitelist="sitesWithoutChangesList"
					>
					</global-watchlist-sites-without-changes>
				</global-watchlist-collapsible-wrapper>
			</div>
		</div>
	</div>
</template>

<script>
/* eslint-disable no-console */

var Toolbar = require( './Toolbar.vue' ),
	Label = require( './base/Label.vue' ),
	LoadingBar = require( './base/LoadingBar.vue' ),
	SitesWithoutChanges = require( './SitesWithoutChanges.vue' ),
	Site = require( './Site.vue' );

var GlobalWatchlistDebugger = require( './../ext.globalwatchlist.debug.js' ),
	getSettings = require( './../ext.globalwatchlist.getSettings.js' ),
	NotificationManager = require( './../ext.globalwatchlist.notifications.js' ),
	WatchedSite = require( './../SiteVue.js' ),
	MultiSiteWrapper = require( './../MultiSiteWrapper.js' );

var globalWatchlistDebug = new GlobalWatchlistDebugger();
var notifications = new NotificationManager( globalWatchlistDebug );
var config = getSettings( notifications );
config.time = new Date();

var watchedSites = new MultiSiteWrapper(
	WatchedSite,
	config,
	globalWatchlistDebug
);

var watchedSitesBySite = {};
watchedSites.siteList.forEach( function ( watchedSite ) {
	watchedSitesBySite[ watchedSite.site ] = watchedSite;
} );


module.exports = {
	components: {
		'global-watchlist-label': Label,
		'global-watchlist-toolbar': Toolbar,
		'global-watchlist-loading-bar': LoadingBar,
		'global-watchlist-sites-with-changes': Site,
		'global-watchlist-sites-without-changes': SitesWithoutChanges
	},

	data: function () {
		// For debugging purposes, we may need to access the debug log
		// attach the debugger here so that it can be accessed from the console
		return {
			inLoading: false,
			sitesWithChangesList: [],
			sitesWithoutChangesList: [],
			config: config,
			globalWatchlistDebug: globalWatchlistDebug,
			groupPageActive: false,
			liveUpdatesActive: false
		};
	},

	computed: {
		haveChangesToShow: function () {
			return this.sitesWithChangesList.length > 0;
		},
		haveEmptySites: function () {
			return this.sitesWithoutChangesList.length > 0;
		},
		asOfLabelText: function () {
			return this.$i18n(
				'globalwatchlist-as-of',
				this.config.time.toUTCString()
			);
		}
	},

	methods: {
		toggleLiveUpdates: function () {
			this.liveUpdatesActive = !( this.liveUpdatesActive );
			console.log( this.liveUpdatesActive ? 'Now running live updates' : 'Done running live updates' );

			/* eslint-disable-next-line no-alert */
			alert( 'Live updates do not work in the Vue version yet' );
		},
		toggleGroupPage: function () {
			this.groupPageActive = !this.groupPageActive;
			this.config.groupPage = this.groupPageActive; // To be passed in getWatchlist
			console.log( this.groupPageActive ? 'Now grouping by page' : 'Done grouping by page' );
			this.refreshSites();
		},
		refreshSites: function () {
			console.log( 'Refreshing sites' );
			this.inLoading = true;
			this.sitesWithChangesList = [];
			this.sitesWithoutChangesList = [];
			this.config.time = new Date();

			var that = this;
			watchedSites.getAllWatchlists( that.config ).then( function () {
				watchedSites.siteList.forEach( function ( site ) {
					if ( site.isEmpty ) {
						that.sitesWithoutChangesList.push( site.site );
					} else {
						that.sitesWithChangesList.push( {
							site: site.site,
							entries: site.entries
						} );
					}
				} );
			} ).then( function () {
				that.inLoading = false;
			} );
		},
		onUnwatchSitePage: function ( site, pageTitle ) {
			watchedSitesBySite[ site ].changeWatched( pageTitle, 'unwatch' );
		},
		onRewatchSitePage: function ( site, pageTitle ) {
			watchedSitesBySite[ site ].changeWatched( pageTitle, 'watch' );
		},
		markAllSitesSeen: function () {
			console.log( 'Marking all sites as seen' );
			var that = this;
			// TODO restore confirmation
			watchedSites.markAllSitesSeen().then( function () {
				that.refreshSites();
			} );
		},
		markSiteAsSeen: function ( site ) {
			console.log( 'Marking site as seen: ' + site );
			var that = this;

			watchedSitesBySite[ site ].markAsSeen().then( function () {
				// Re sync sitesWithChangesList, only the site that was marked as seen should change
				// we don't separately index sitesWithChangesList by site
				that.sitesWithChangesList.forEach( function ( siteWithChanges ) {
					siteWithChanges.entries = watchedSitesBySite[ siteWithChanges.site ].entries;
				} );
			} );
		}
	},

	mounted: function () {
		this.groupPageActive = this.config.groupPage;
		// Trigger initial refresh once mounted
		this.refreshSites();
	}
};
</script>

<style>
/* Ensure that this applies to links, see T245104 */
.ext-globalwatchlist-strike,
.ext-globalwatchlist-strike a {
	text-decoration: line-through;
}
</style>
