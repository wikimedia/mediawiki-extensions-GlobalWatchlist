<template>
	<button
		class="ext-globalwatchlist-toggle"
		v-bind:style="toggleStyle"
		v-on:click="onToggle"
	>
		<span
			v-bind:style="textStyle"
		>
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
		toggleStyle: function () {
			var style = {
				float: this.align
			};
			if ( this.isActive ) {
				style[ 'background-color' ] = '#2A4B8D';
			}
			return style;
		},
		textStyle: function () {
			var style = {};
			if ( this.isActive ) {
				style[ 'color'] = '#FFFFFF';
			}
			return style;
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
