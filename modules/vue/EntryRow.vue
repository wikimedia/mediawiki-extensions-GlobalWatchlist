<template>
	<li
		:class="rowClasses"
	>
		<span
			v-if="entry.timestamp"
			:title="entry.timestampTitle"
		>
			{{ entry.timestamp }}
		</span>

		<!-- Watchlist expiration clock -->
		<span v-if="entry.expiry">
			<wvui-icon
				:icon="clockIcon"
				:title="entry.expiry"
				class="ext-globalwatchlist-expiry-icon"
			>
			</wvui-icon>
		</span>

		<!-- Bot/minor/new page -->
		<strong v-if="entry.flags">
			{{ entry.flags }}
		</strong>

		<em v-if="isLogEntry">
			Log: {{ entry.logtype }}/{{ entry.logaction }}:
		</em>

		<a
			:href="pageLink"
			target="_blank"
		>{{ entry.titleMsg || entry.title }}</a>
		(<!--
			Avoid a space in the middle
		--><span v-if="isLogEntry">
			<!--Wrap in a span to ensure commas are only rendered when needed-->
			<a
				:href="logPageLink"
				target="_blank"
			>
				{{ $i18n( 'globalwatchlist-log-page' ).text() }}
			</a>,
			<a
				:href="logEntryLink"
				target="_blank"
			>
				{{ $i18n( 'globalwatchlist-log-entry' ).text() }}
			</a>,
		</span><!--
			Avoid potential space
		--><span v-else>
			<!--Wrap in a span to ensure comma is only rendered when needed-->
			<!--Span is v-else so there is no history link for log entries, see T273691-->
			<a
				:href="historyLink"
				target="_blank"
			>
				{{ $i18n( "globalwatchlist-history" ).text() }}
			</a>,
		</span>

		<!-- There will always be either a history link or log links, so there should be a space -->
		<span v-if="hasDiffLink">
			<!--Wrap in a span to ensure comma is only rendered when needed-->
			<a
				v-if="hasDiffLink"
				:href="diffLink"
				target="_blank"
			>
				{{ diffMessage }}
			</a>,
		</span>

		<a v-if="pagewatched" @click="unwatchPage">
			{{ $i18n( 'globalwatchlist-unwatch' ).text() }}
		</a>
		<a v-else @click="rewatchPage">
			{{ $i18n( 'globalwatchlist-rewatch' ).text() }}
		</a><!--
			Avoid a space in the middle
		-->)

		<!-- eslint-disable vue/no-v-html -->
		<span v-if="hasUserDisplay">
			(<!--
				Avoid a space in the middle
			--><span v-html="entry.userDisplay"></span><!--
				Avoid a space in the middle
			--><span v-if="entry.commentDisplay" v-html="entry.commentDisplay"></span><!--
				Avoid a space in the middle
			-->)
		</span>

		<!--
			entry.tagsDisplay is processed in WatchlistUtils, either the raw HTML to include
			or false for no tags. If its raw HTML, it is already properly safe to use.
		-->
		<em v-if="entry.tagsDisplay" v-html="entry.tagsDisplay"></em>
		<!-- eslint-enable vue/no-v-html -->
	</li>
</template>

<script>
const GlobalWatchlistLinker = require( './../Linker.js' );

const WvuiIcon = require( 'wvui' ).WvuiIcon;

/**
 * Replacement for makePageLink
 *
 * Component represents a single row for a log entry, edit, or group of edits
 *
 * Inputs:
 *  - entry, object with the data
 *  - pagewatched, boolean
 *  - site, string (url) for the site in question
 *
 * Emits:
 *  - `rewatch-page` when rewatching
 *     Parameters: title
 *  - `unwatch-page` when unwatching
 *     Parameters: title
 */
// @vue/component
module.exports = {
	components: {
		'wvui-icon': WvuiIcon
	},

	props: {
		entry: {
			type: Object,
			required: true
		},
		pagewatched: {
			type: Boolean,
			default: true
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
		rowClasses: function () {
			if ( !this.pagewatched ) {
				return 'ext-globalwatchlist-strike';
			}
			return '';
		},

		clockIcon: function () {
			return require( './icons.json' ).clock;
		},

		isLogEntry: function () {
			return this.entry.entryType === 'log';
		},

		pageLink: function () {
			return this.linker.linkQuery( 'title=' + this.entry.title + '&redirect=no' );
		},
		historyLink: function () {
			return this.linker.linkQuery( 'title=' + this.entry.title + '&action=history' );
		},
		hasDiffLink: function () {
			// We don't have access to the config to know if this is fast mode or not,
			// but we can infer based on the userDisplay since there should always be
			// something to display in non-fast mode. No diff links are shown in fast
			// mode, see T269728
			return this.entry.entryType === 'edit' && !this.entry.newPage && this.hasUserDisplay;
		},
		diffLink: function () {
			return this.linker.linkQuery( 'diff=' + this.entry.toRev + '&oldid=' + this.entry.fromRev );
		},
		diffMessage: function () {
			return this.entry.editCount === 1 ?
				this.$i18n( 'diff' ).text() :
				this.$i18n( 'nchanges', this.entry.editCount ).text();
		},
		logPageLink: function () {
			return this.linker.linkQuery( 'title=Special:Log&page=' + encodeURIComponent( this.entry.title ) );
		},
		logEntryLink: function () {
			return this.linker.linkQuery( 'title=Special:Log&logid=' + this.entry.logid );
		},

		hasUserDisplay: function () {
			// Not available in fast mode
			return this.entry.userDisplay && this.entry.userDisplay !== '';
		}
	},

	methods: {
		unwatchPage: function () {
			this.$emit( 'unwatch-page', this.entry.title );
		},
		rewatchPage: function () {
			this.$emit( 'rewatch-page', this.entry.title );
		}
	}
};
</script>
