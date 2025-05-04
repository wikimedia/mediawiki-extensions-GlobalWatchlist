<template>
	<div id="ext-globalwatchlist-vue-specialpage">
		<global-watchlist-toolbar
			:live-updates-active="liveUpdatesActive"
			:group-page-active="resultsGrouped"
			:liveupdatesdisabled="disableLiveUpdates"
			:grouppagedisabled="disableGroupPage"
			:refreshdisabled="disableRefresh"
			:markalldisabled="disableMarkAll"
			@toggle-live-updates="toggleLiveUpdates"
			@toggle-group-page="toggleGroupPage"
			@click-refresh="refreshSites"
			@mark-all-sites-seen="markAllSitesSeen"
		>
		</global-watchlist-toolbar>
		<hr>

		<div
			v-if="inLoading"
			class="ext-globalwatchlist-vue-loading"
		>
			<wvui-progress-bar></wvui-progress-bar>
		</div>

		<div
			v-else
			class="ext-globalwatchlist-sitelist"
		>
			<label id="ext-globalwatchlist-vue-asof">{{ asOfLabelText }}</label>
			<div v-if="haveChangesToShow">
				<!-- Only show label if there are empty sites, T274720 -->
				<label v-if="haveEmptySites">
					{{ $i18n( 'globalwatchlist-changesfeed' ).text() }}
				</label>
				<global-watchlist-sites-with-changes
					v-for="withChanges in sitesWithChangesList"
					:key="withChanges.site"
					:site="withChanges.site"
					:entries="withChanges.entries"
					@unwatch-site-page="onUnwatchSitePage"
					@rewatch-site-page="onRewatchSitePage"
					@mark-site-seen="markSiteAsSeen"
				>
				</global-watchlist-sites-with-changes>
			</div>
			<div v-if="haveEmptySites">
				<global-watchlist-sites-without-changes
					:emptysitelist="sitesWithoutChangesList"
				>
				</global-watchlist-sites-without-changes>
			</div>
		</div>
	</div>
</template>

<script>
const Toolbar = require( './Toolbar.vue' ),
	WvuiProgressBar = require( 'wvui' ).WvuiProgressBar,
	SitesWithoutChanges = require( './SitesWithoutChanges.vue' ),
	Site = require( './Site.vue' );

const GlobalWatchlistDebugger = require( './../Debug.js' ),
	getSettings = require( './../getSettings.js' ),
	WatchedSite = require( './../SiteVue.js' ),
	MultiSiteWrapper = require( './../MultiSiteWrapper.js' );

const globalWatchlistDebug = new GlobalWatchlistDebugger();
const config = getSettings( globalWatchlistDebug );
config.time = new Date();

const watchedSites = new MultiSiteWrapper(
	WatchedSite,
	config,
	globalWatchlistDebug
);

const watchedSitesBySite = {};
watchedSites.siteList.forEach( ( watchedSite ) => {
	watchedSitesBySite[ watchedSite.site ] = watchedSite;
} );

// @vue/component
module.exports = {
	components: {
		'wvui-progress-bar': WvuiProgressBar,
		'global-watchlist-toolbar': Toolbar,
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
				'globalwatchlist-asof',
				this.config.time.toUTCString()
			).text();
		},
		resultsGrouped: function () {
			return this.config.groupPage;
		},
		disableLiveUpdates: function () {
			return this.inLoading;
		},
		disableGroupPage: function () {
			return ( this.liveUpdatesActive === true ) || this.inLoading;
		},
		disableRefresh: function () {
			return ( this.liveUpdatesActive === true ) || this.inLoading;
		},
		disableMarkAll: function () {
			return ( this.liveUpdatesActive === true ) || this.inLoading;
		}
	},

	methods: {
		toggleLiveUpdates: function ( isActive ) {
			this.liveUpdatesActive = isActive;
			this.globalWatchlistDebug.info( isActive ? 'Now running live updates' : 'Done running live updates' );

			// updateLive will only do anything if liveUpdatesActive is true
			this.updateLive();
		},
		toggleGroupPage: function ( isActive ) {
			this.config.groupPage = isActive; // To be passed in getWatchlist
			this.globalWatchlistDebug.info( isActive ? 'Now grouping by page' : 'Done grouping by page' );

			this.refreshSites();
		},
		updateLive: function () {
			if ( this.liveUpdatesActive === true ) {
				const that = this;
				this.backgroundRefresh().then( ( results ) => {
					if ( that.liveUpdatesActive === true ) {
						// Might have been turned off while the update
						// was being prepared
						that.sitesWithChangesList = results.withChanges;
						that.sitesWithoutChangesList = results.withoutChanges;

						// Call again in 7.5 seconds
						setTimeout( that.updateLive, 7500 );
					}
				} );
			}
		},
		refreshSites: function () {
			this.globalWatchlistDebug.info( 'Refreshing sites' );
			this.inLoading = true;
			this.sitesWithChangesList = [];
			this.sitesWithoutChangesList = [];

			const that = this;
			this.backgroundRefresh().then( ( results ) => {
				that.sitesWithChangesList = results.withChanges;
				that.sitesWithoutChangesList = results.withoutChanges;
			} ).then( () => {
				that.inLoading = false;
			} );
		},
		backgroundRefresh: function () {
			const that = this;
			this.config.time = new Date();

			return new Promise( ( resolve ) => {
				watchedSites.getAllWatchlists( that.config ).then( () => {
					const newSitesWithChanges = [];
					const newSitesWithoutChanges = [];

					watchedSites.siteList.forEach( ( site ) => {
						if ( site.isEmpty ) {
							newSitesWithoutChanges.push( site.site );
						} else {
							newSitesWithChanges.push( {
								site: site.site,
								entries: site.entries
							} );
						}
					} );
					const results = {
						withChanges: newSitesWithChanges,
						withoutChanges: newSitesWithoutChanges
					};
					resolve( results );
					return;
				} );
			} );
		},
		onUnwatchSitePage: function ( site, pageTitle ) {
			watchedSitesBySite[ site ].changeWatched( pageTitle, 'unwatch' );
		},
		onRewatchSitePage: function ( site, pageTitle ) {
			watchedSitesBySite[ site ].changeWatched( pageTitle, 'watch' );
		},
		markAllSitesSeen: function () {
			this.globalWatchlistDebug.info( 'Marking all sites as seen' );
			const that = this;

			watchedSites.markAllSitesSeen().then(
				() => {
					// Resolved, either confirmation wasn't needed or was given
					that.refreshSites();
				},
				() => {
					// Confirmation wasn't given
					that.globalWatchlistDebug.info( 'Not confirmed' );
				}
			);
		},
		markSiteAsSeen: function ( site ) {
			const that = this;

			watchedSitesBySite[ site ].markAsSeen().then( () => {
				// Re sync sitesWithChangesList, only the site that was marked as seen should change
				// we don't separately index sitesWithChangesList by site
				that.sitesWithChangesList.forEach( ( siteWithChanges ) => {
					siteWithChanges.entries = watchedSitesBySite[ siteWithChanges.site ].entries;
				} );
			} );
		}
	},

	mounted: function () {
		// Trigger initial refresh once mounted
		// Based on this.refreshSites() but with timing

		const loadStartTime = mw.now();
		this.inLoading = true;
		this.sitesWithChangesList = [];
		this.sitesWithoutChangesList = [];

		const that = this;
		this.backgroundRefresh().then( ( results ) => {
			that.sitesWithChangesList = results.withChanges;
			that.sitesWithoutChangesList = results.withoutChanges;
		} ).then( () => {
			that.inLoading = false;

			const metricName = that.config.fastMode ?
				'timing.MediaWiki.GlobalWatchlist.firstload.vue.fastmode' :
				'timing.MediaWiki.GlobalWatchlist.firstload.vue.normal';
			const loadEndTime = mw.now();
			const loadElapsedTime = loadEndTime - loadStartTime;
			mw.track( metricName, loadElapsedTime );
		} );

		// Only run live updates when the special page is being displayed
		// Note: the page visibility api isn't available for some of the
		// older versions of mobile browsers that MediaWiki still provides
		// Grade A support for, but its better than nothing. See T268266
		document.addEventListener( 'visibilitychange', () => {
			if ( document.visibilityState === 'hidden' ) {
				// Pause live updates
				if ( that.liveUpdatesActive === true ) {
					that.liveUpdatesActive = 'paused';
				}
			} else if ( document.visibilityState === 'visible' ) {
				// Unpause
				if ( that.liveUpdatesActive === 'paused' ) {
					that.liveUpdatesActive = true;
					that.updateLive();
				}
			}
		} );
	}
};
</script>

<style>
/* Ensure that this applies to links, see T245104 */
.ext-globalwatchlist-strike,
.ext-globalwatchlist-strike a {
	text-decoration: line-through;
}

#ext-globalwatchlist-vue-asof {
	text-align: center;
}

.ext-globalwatchlist-content hr {
	height: 2px;
	clear: both;
}

.ext-globalwatchlist-expiry-icon svg {
	/* Based on core watchlistexpiry.less */
	min-height: 13px;
	height: 13px;
	position: relative;
	opacity: 0.51;
}

/* Make sure the icon color is the same as the text */
.ext-globalwatchlist-button-icon {
	color: currentColor;
}

.ext-globalwatchlist-vue-loading .wvui-progress-bar {
	margin: auto;
	margin-top: 5px;
}

/*
 * Copy some core styles from mediawiki.interface.helpers.styles.less to match the normal watchlist:
 *
 * - auto-generated edit summaries
 * - formatting of message when a username is hidden from an edit
 *
 * See T288733
 */
.autocomment,
.autocomment a,
.autocomment a:visited {
	color: #72777d;
}

span.history-deleted {
	text-decoration: line-through;
	color: #72777d;
	font-style: italic;
}
</style>
