import Toggle from './../../modules/vue/base/Toggle.vue';
import Vue from 'vue';

export default {
	title: 'Components/Toggle',
	component: Toggle,
	argTypes: {
		default: {
			control: 'text',
			defaultValue: 'Toggle me'
		},
		disabled: {
			control: 'boolean',
			table: {
				category: 'Attributes'
			}
		},
		toggle: {
			action: 'toggle',
			table: {
				category: 'Events'
			}
		}
	},
	parameters: {
		layout: 'centered'
	}
};

export const Configurable = ( args, { argTypes } ) => ( {
	components: { Toggle },
	props: Object.keys( argTypes ),
	computed: {
		slotContents() {
			return this.default;
		}
	},
	template: `
		<toggle v-bind="$props" v-on="$props">
			{{ slotContents }}
		</toggle>
	`
} );
