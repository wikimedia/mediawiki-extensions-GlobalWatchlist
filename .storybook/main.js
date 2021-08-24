const path = require('path');

module.exports = {
	stories: [ './stories/*.stories.js' ],

	addons: [
		'@storybook/addon-a11y',
		'@storybook/addon-actions',
		'@storybook/addon-backgrounds',
		'@storybook/addon-controls',
		'@storybook/addon-docs',
		'@storybook/addon-storysource',
		'@storybook/addon-viewport',
	],

	webpackFinal: ( config ) => {
		Object.assign(
			config.resolve.alias,
			{
				wvui: path.resolve( __dirname, 'wvui.js' )
			}
		);

		return config;
	}
};