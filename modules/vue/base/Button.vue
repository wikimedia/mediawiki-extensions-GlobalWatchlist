<template>
	<button
		id="mw-globalwatchlist-vue-button"
		class="mw-button"
		v-bind:style="buttonStyle"
		v-on:click="onButtonClick"
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
	props: {
		text: {
			type: String,
			default: 'ButtonTextGoesHere'
		},
		align: {
			type: String,
			default: 'none'
		}
	},

	computed: {
		buttonStyle: function () {
			return {
				float: this.align
			};
		}
	},

	methods: {
		onButtonClick: function () {
			this.$emit( 'click' );
		}
	}
};
</script>
