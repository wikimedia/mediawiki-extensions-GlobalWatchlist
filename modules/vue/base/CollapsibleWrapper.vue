<template>
	<div
		class="ext-globalwatchlist-vue-collapsible"
	>
		<!-- No support for an `align` parameter yet -->
		<wvui-button
			class="ext-globalwatchlist-float-right"
			v-on:click="toggleCollapsible"
		>
			{{ buttonText }}
		</wvui-button>

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
var WvuiButton = require( 'wvui' ).WvuiButton;

// @vue/component
module.exports = {
	components: {
		'wvui-button': WvuiButton
	},

	props: {
		startcollapsed: {
			type: Boolean,
			default: false
		}
	},

	data: function () {
		return {
			isCollapsed: false // Always start expanded
		};
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

<style>
.ext-globalwatchlist-float-right {
	float: right;
}
</style>
