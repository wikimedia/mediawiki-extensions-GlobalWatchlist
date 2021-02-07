<template>
	<div
		class="ext-globalwatchlist-vue-collapsible"
	>
		<global-watchlist-button
			align="right"
			v-bind:text="buttonText"
			v-on:click="toggleCollapsible"
		>
		</global-watchlist-button>

		<div
			v-if="showContent"
		>
			<slot></slot>
		</div>
	</div>
</template>

<script>
/**
 * This component should eventually be replaced by a standard version shared across
 * multiple mediawiki repositories. See T249840 for more.
 */
var Button = require( './Button.vue' );

module.exports = {
	components: {
		'global-watchlist-button': Button
	},

	data: function () {
		return {
			isCollapsed: false // Always start expanded
		};
	},

	props: {
		startcollapsed: {
			type: Boolean,
			default: false
		}
	},

	computed: {
		buttonText: function () {
			if ( this.isCollapsed ) {
				return this.$i18n( 'collapsible-expand' ).text();
			}
			return this.$i18n( 'collapsible-collapse' ).text();
		},
		showContent: function () {
			return !this.isCollapsed;
		}
	},

	methods: {
		toggleCollapsible: function () {
			this.isCollapsed = !this.isCollapsed;
		}
	},

	created: function () {
		if ( this.startcollapsed ) {
			this.isCollapsed = true;
		}
	}
};
</script>
