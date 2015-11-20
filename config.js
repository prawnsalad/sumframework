module.exports = Config;


/**
 * @param {array}
 * Config options on the right override the left. [defaults, local_config]
 */
function Config(config_objects) {
	this.configs = config_objects;
	this.cache = Object.create(null);
};

Config.generate = function(config_objects) {
	var config = new Config(config_objects);
	return function() {
		return config.get.apply(config, arguments);
	};
};

Config.prototype.get = function(name) {
	var ret = undefined;

	if (typeof this.cache[name] !== 'undefined') {
		return this.cache[name];
	}

	for(var i=this.configs.length-1; i>=0; i--) {
		ret = this.valFromPath(name, this.configs[i]);
		if (typeof ret !== 'undefined') {
			this.cache[name] = ret;
			return ret;
		}
	}
};

Config.prototype.valFromPath = function(name, obj) {
	var parts = name.split('.');
	var ret = obj;
	parts.forEach(function(prop, idx) {
		if (typeof ret === 'undefined') return;
		
		var val = ret[prop];
		if (typeof val === 'undefined') {
			ret = undefined;
		}

		ret = val;
	});

	return ret;
};