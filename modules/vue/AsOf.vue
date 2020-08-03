<template>
	<span id="mw-globalwatchlist-vue-as-of">
		{{ $i18n( 'globalwatchlist-asof', asof ) }}
	</span>
</template>

<script>
/**
 * TODO convert this to a generic label component and move to /base
 */
module.exports = {
	props: {
		asof: {
			type: String,
			required: true
		}
	}
};
</script>
