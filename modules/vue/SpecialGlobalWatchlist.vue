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
			<global-watchlist-as-of
				v-bind:asof=refreshedTime
			>
			</global-watchlist-as-of>
			<div v-if="haveChangesToShow">
				<p>{{ $i18n( 'globalwatchlist-changesfeed' ) }}</p>
				<global-watchlist-sites-with-changes
					v-for="withChanges in sitesWithChangesList"
					v-bind:site=withChanges['site']
					v-bind:entries=withChanges['entries']
					v-on:unwatch-page="onUnwatch"
					v-on:rewatch-page="onRewatch"
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
var AsOf = require( './AsOf.vue' ),
	Toolbar = require( './Toolbar.vue' ),
	LoadingBar = require( './LoadingBar.vue' ),
	SitesWithoutChanges = require( './SitesWithoutChanges.vue' ),
	Site = require( './Site.vue' );

var GlobalWatchlistDebugger = require( './../ext.globalwatchlist.debug.js' ),
	getSettings = require( './../ext.globalwatchlist.getSettings.js' ),
	NotificationManager = require( './../ext.globalwatchlist.notifications.js' ),
	WatchedSite = require( './../SiteVue.js' ),
	watchlistUtils = require( './../ext.globalwatchlist.watchlistUtils.js' );

var globalWatchlistDebug = new GlobalWatchlistDebugger();
var notifications = new NotificationManager( globalWatchlistDebug );
var config = getSettings( notifications );
config.time = new Date();

var watchedSites = config.siteList.map( function ( site ) {
	return new WatchedSite(
		globalWatchlistDebug,
		config,
		new mw.ForeignApi( '//' + site + mw.util.wikiScript( 'api' ) ),
		watchlistUtils,
		site
	);
} );

var watchedSitesBySite = {};
watchedSites.forEach( function ( watchedSite ) {
	watchedSitesBySite[ watchedSite.site ] = watchedSite;
} );


module.exports = {
	components: {
		'global-watchlist-as-of': AsOf,
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
		refreshedTime: function () {
			return this.config.time.toUTCString();
		}
	},

	methods: {
		toggleLiveUpdates: function () {
			this.liveUpdatesActive = !( this.liveUpdatesActive );
			console.log( this.liveUpdatesActive ? 'Now running live updates' : 'Done running live updates' );
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
			Promise.all( watchedSites.map( function ( site ) {
				return site.getWatchlist( that.config );
			} ) ).then( function () {
				watchedSites.forEach( function ( site ) {
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
		onUnwatch: function ( info ) {
			var site = info[ 0 ];
			var pageTitle = info[ 1 ];
			console.log( 'Unwatching page (' + pageTitle + ') on site (' + site + ')' );
			watchedSitesBySite[ site ].changeWatched( pageTitle, 'unwatch' );
		},
		onRewatch: function ( info ) {
			var site = info[ 0 ];
			var pageTitle = info[ 1 ];
			console.log( 'Rewatching page (' + pageTitle + ') on site (' + site + ')' );
			watchedSitesBySite[ site ].changeWatched( pageTitle, 'watch' );
		},
		markAllSitesSeen: function () {
			console.log( 'Marking all sites as seen' );
			var that = this;
			// TODO restore confirmation
			Promise.all( watchedSites.map( function ( site ) {
				return site.markAsSeen();
			} ) ).then( function () {
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
