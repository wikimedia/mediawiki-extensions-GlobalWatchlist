// Fake version of core's $i18n plugin, so that the tests don't
// break when components try to use it. this.$i18n normally returns
// a mw.Message object, but since we only need to support the `.text()`
// function, and that isn't available, create our own object class with
// `.text()` just returning the English (TODO allowing testing languages).

function FakeMessage( key ) {
	var messages = {
		'collapsible-collapse': 'Collapse',
		'collapsible-expand': 'Expand'
	};
	this.value = messages[ key ] || ( '⧼' + key + '⧽' );
}

FakeMessage.prototype.text = function () {
	return this.value;
};

module.exports = {
	install: function ( Vue ) {
		/**
		 * @param {string} key Key of message to get
		 * @param {...Mixed} parameters Values for $N replacements
		 * @return {FakeMessage} instead of mw.Message
		 */
		Vue.prototype.$i18n = function ( key, ...parameters ) {
			return new FakeMessage( key );
		};
	}
};
