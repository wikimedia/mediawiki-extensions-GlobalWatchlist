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
module.exports = {
	props: {
		name: {
			type: String,
			default: ''
		},
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
			if ( this.name === '' ) {
				console.log( 'Some button clicked' );
			} else {
				console.log( this.name + ' button clicked' );
			}

			this.$emit( 'click' );
		}
	}
};
</script>
