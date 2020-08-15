<template>
	<button
		class="ext-globalwatchlist-toggle"
		v-bind:class="toggleClass"
		v-bind:style="toggleStyle"
		v-on:click="onToggle"
	>
		<span>
			{{ text }}
		</span>
	</button>
</template>

<script>
/**
 * This component should eventually be replaced by a standard version shared across
 * multiple mediawiki repositories. See T249840 for more.
 */
module.exports = {
	data: function () {
		return {
			isActive: false // Always start inactive
		};
	},

	props: {
		text: {
			type: String,
			default: 'ToggleTextGoesHere'
		},
		align: {
			type: String,
			default: 'none'
		},
		startactive: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},

	computed: {
		toggleClass: function () {
			return {
				'ext-globalwatchlist-toggle--active': this.isActive,
				'ext-globalwatchlist-toggle--disabled': this.disabled
			};
		},
		toggleStyle: function () {
			return {
				float: this.align
			};
		}
	},

	methods: {
		onToggle: function () {
			if ( !this.disabled ) {
				this.isActive = !this.isActive;

				this.$emit( 'toggle', this.isActive );
			}
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

/* Active, not disabled */
.ext-globalwatchlist-toggle--active:not( .ext-globalwatchlist-toggle--disabled ) {
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
