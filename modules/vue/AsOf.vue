<template>
	<span id="mw-globalwatchlist-vue-as-of">
		{{ $i18n( 'globalwatchlist-asof', asof ) }}
	</span>
</template>

<script>
module.exports = {
	props: {
		asof: {
			type: String,
			required: true
		}
	}
};
</script>
