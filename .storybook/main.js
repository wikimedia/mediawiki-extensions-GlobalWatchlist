const path = require('path');

module.exports = {
	stories: [ './stories/*.stories.js' ],

	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-controls',
		'@storybook/addon-actions',
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