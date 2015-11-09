var Application = require('sumframework/application');

var instance = null;

module.exports = function() {
	if (!instance) {
		instance = Application(__dirname);
	}

	return instance;
};