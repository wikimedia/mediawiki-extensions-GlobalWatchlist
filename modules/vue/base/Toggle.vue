<template>
	<wvui-button
		v-bind:class="toggleClass"
		v-bind:disabled="toggleDisabled"
		v-on:click="onToggle"
	>
		<span>
			<slot></slot>
		</span>
	</wvui-button>
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
		startactive: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},

	data: function () {
		return {
			isActive: false // Always start inactive
		};
	},

	computed: {
		toggleClass: function () {
			return {
				'ext-globalwatchlist-toggle--active': this.isActive,
				'ext-globalwatchlist-toggle--disabled': this.disabled
			};
		},
		toggleDisabled: function () {
			return this.disabled;
		}
	},

	methods: {
		onToggle: function () {
			this.isActive = !this.isActive;
			this.$emit( 'toggle', this.isActive );
		}
	},

	created: function () {
		if ( this.startactive ) {
			this.isActive = true;
		}
	}
};
</script>

<style>
/* Active and disabled */
.ext-globalwatchlist-toggle--active.ext-globalwatchlist-toggle--disabled {
	background-color: #919fb9;
	border-color: #c8ccd1;
}

/* Active, not disabled. Specify :hover too to override wvui */
.ext-globalwatchlist-toggle--active:not( .ext-globalwatchlist-toggle--disabled ),
.ext-globalwatchlist-toggle--active:not( .ext-globalwatchlist-toggle--disabled ):hover {
	background-color: #2a4b8d;
}

/* Disabled, not active */
.ext-globalwatchlist-toggle--disabled:not( .ext-globalwatchlist-toggle--active ) {
	background-color: #c8ccd1;
	border-color: #c8ccd1;
}

/* Toggle text for active, disabled, or both */
.ext-globalwatchlist-toggle--active span,
.ext-globalwatchlist-toggle--disabled span {
	color: #fff;
}
</style>
