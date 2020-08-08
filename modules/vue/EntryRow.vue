<template>
	<li
		v-bind:class="rowClasses"
	>
		<!-- Bot/minor/new page -->
		<strong v-if="hasFlags">
			{{entryFlags}}
		</strong>

		<em v-if="isLogEntry">
			Log: {{ this.entry.logtype }}/{{ this.entry.logaction }}:
		</em>

		<a
			v-bind:href=pageLink
			target="_blank"
		>{{ entry.titleMsg || entry.title }}</a>
		(<!--
			Avoid a space in the middle
		--><a
			v-bind:href=historyLink
			target="_blank"
		>{{ $i18n( "history_small" ) }}</a><!--
			Avoid a space in the middle
		-->,

		<span v-if="isPureEdit">
			<!--Wrap in a span to ensure comma is only rendered when needed-->
			<a
				v-if="isPureEdit"
				v-bind:href=diffLink
				target="_blank"
			>
				{{ diffMessage }}
			</a>,
		</span>

		<span v-if="isLogEntry">
			<!--Wrap in a span to ensure comma is only rendered when needed-->
			<a
				v-bind:href=logsLink
				target="_blank"
			>
				{{ $i18n( 'sp-contributions-logs' ) }}
			</a>,
		</span>

		<a v-if="pagewatched" v-on:click="unwatchPage">
			{{ $i18n( 'globalwatchlist-unwatch' ) }}
		</a>
		<a v-else v-on:click="rewatchPage">
			{{ $i18n( 'globalwatchlist-rewatch' ) }}
		</a><!--
			Avoid a space in the middle
		-->)

		<span v-if="hasUserDisplay">
			(<!--
				Avoid a space in the middle
			--><span v-html="entry.userDisplay"></span><!--
				Avoid a space in the middle
			--><span v-if="hasComment" v-html="entryComment"></span><!--
				Avoid a space in the middle
			-->)
		</span>
	</li>
</template>

<script>
var GlobalWatchlistLinker = require( './../ext.globalwatchlist.linker.js' );

/**
 * Replacement for makePageLink
 *
 * Component represents a single row for a log entry, edit, or group of edits
 *
 * Inputs:
 *  - entry, object with the data
 *  - site, string (url) for the site in question
 */
module.exports = {
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

		entryFlags: function () {
			var letters = '';
			if ( this.entry.newPage === true ) {
				letters += this.$i18n( 'newpageletter' );
			}
			if ( this.entry.minor ) {
				letters += this.$i18n( 'minoreditletter' );
			}
			if ( this.entry.bot ) {
				letters += this.$i18n( 'boteditletter' );
			}
			return letters;
		},
		hasFlags: function () {
			return this.entryFlags !== '';
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
		isPureEdit: function () {
			return this.entry.entryType === 'edit' && !this.entry.newPage;
		},
		diffLink: function () {
			return this.linker.linkQuery( 'diff=' + this.entry.toRev + '&oldid=' + this.entry.fromRev );
		},
		diffMessage: function () {
			return this.entry.editCount === 1 ?
				this.$i18n( 'diff' ) :
				this.$i18n( 'nchanges', this.entry.editCount );
		},
		logsLink: function () {
			return this.linker.linkQuery( 'title=Special:Log&page=' + encodeURIComponent( this.entry.title ) );
		},

		entryComment: function () {
			if ( this.entry.comment && this.entry.comment !== '' ) {
				return ': ' + this.linker.fixLocalLinks( this.entry.comment );
			}
			return false;
		},
		hasComment: function () {
			return this.entryComment !== false;
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