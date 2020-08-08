<template>
	<span>
		{{ text }}
	</span>
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
			required: true
		}
	}
};
</script>
