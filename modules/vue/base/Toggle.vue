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
		}
	},

	computed: {
		toggleClass: function () {
			if ( this.isActive ) {
				return 'ext-globalwatchlist-toggle--active';
			}
			return '';
		},
		toggleStyle: function () {
			return {
				float: this.align
			};
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
.ext-globalwatchlist-toggle--active {
	background-color: #2a4b8d;
}

.ext-globalwatchlist-toggle--active span {
	color: #fff;
}
</style>
