<template>
	<button
		class="ext-globalwatchlist-button"
		v-bind:class="buttonClass"
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
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},

	computed: {
		buttonClass: function () {
			if ( this.disabled ) {
				return 'ext-globalwatchlist-button--disabled';
			}
			return '';
		},
		buttonStyle: function () {
			return {
				float: this.align
			};
		}
	},

	methods: {
		onButtonClick: function () {
			if ( !this.disabled ) {
				this.$emit( 'click' );
			}
		}
	}
};
</script>

<style>
.ext-globalwatchlist-button--disabled {
	background-color: #c8ccd1;
	border-color: #c8ccd1;
}

.ext-globalwatchlist-button--disabled span {
	color: #fff;
}
</style>
