<template>
	<div class="mw-globalwatchlist-vue-site">
		<h3>
			<a
				v-bind:href=specialWatchlistUrl
				target="_blank"
			>{{ site }}</a>
			(<!--
				Avoid a space
			--><a
				v-bind:href=specialEditWatchlistUrl
				target="_blank"
			>{{ $i18n( 'globalwatchlist-editwatchlist' ) }}</a><!--
				Avoid a space
			-->)
		</h3>
		<global-watchlist-button
			name="mark-site-seen"
			text="Mark as seen"
			v-on:click="markChangesSeen"
		>
		</global-watchlist-button>
		<global-watchlist-entry-row
			v-for="(rowInfo, index) in entries"
			v-bind:entry=rowInfo
			v-bind:pagewatched=rowInfo.pageWatched
			v-bind:site=site
			v-bind:key=index
			v-on:unwatch="onUnwatch( $event )"
			v-on:rewatch="onRewatch( $event )"
		>
		</global-watchlist-entry-row>
	</div>
</template>

<script>
var GlobalWatchlistLinker = require( './../ext.globalwatchlist.linker.js' );

var Button = require( './base/Button.vue' ),
	EntryRow = require( './EntryRow.vue' );

module.exports = {
	components: {
		'global-watchlist-button': Button,
		'global-watchlist-entry-row': EntryRow
	},

	props: {
		entries: {
			type: Array,
			required: true
		},
		site: {
			type: String,
			required: true
		}
	},

	computed: {
		linker: function () {
			return new GlobalWatchlistLinker( this.site );
		},
		specialWatchlistUrl: function () {
			return this.linker.linkPage( 'Special:Watchlist' );
		},
		specialEditWatchlistUrl: function () {
			return this.linker.linkPage( 'Special:EditWatchlist' );
		}
	},

	methods: {
		onUnwatch: function ( eventTitle ) {
			console.log( 'unwatching a page: ' + eventTitle );
			this.$emit( 'unwatch-page', [ this.site, eventTitle ] );
			this.entries.forEach( function ( entryInfo ) {
				if ( entryInfo.title === eventTitle ) {
					entryInfo.pageWatched = false;
				}
			} );
			console.log( this.entries );
			this.$forceUpdate();
		},
		onRewatch: function ( eventTitle ) {
			console.log( 'rewatching a page:' + eventTitle );
			this.$emit( 'rewatch-page', [ this.site, eventTitle ] );
			this.entries.forEach( function ( entryInfo ) {
				if ( entryInfo.title === eventTitle ) {
					entryInfo.pageWatched = true;
				}
			} );
			this.$forceUpdate();
		},
		markChangesSeen: function () {
			this.$emit( 'mark-site-seen', this.site );
		}
	}
};
</script>
