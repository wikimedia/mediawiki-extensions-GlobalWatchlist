import CollapsibleWrapper from './../../modules/vue/base/CollapsibleWrapper.vue';

// Used for the content that is collapsed
const textLoremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export default {
	title: 'Components/CollapsibleWrapper',
	component: CollapsibleWrapper,
	parameters: {
		controls: {
			hideNoControlsWarning: true
		}
	}
};

export const Primary = () => ( {
	components: { CollapsibleWrapper },
	template: '<collapsible-wrapper>' + textLoremIpsum.repeat( 5 ) + '</collapsible-wrapper>'
} );