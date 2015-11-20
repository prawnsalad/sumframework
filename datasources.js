var Application = require('./application');
var clone = require('./clone');

function DataSources(data_sources) {
	this.sources = data_sources;
}

module.exports = DataSources;



var instance;
DataSources.setInstance = function(new_instance) {
	instance = new_instance;
};
DataSources.get = function() {
	return instance.get.apply(instance, arguments);
};



DataSources.prototype.get = function(name) {
	var source_config;
	var connection;


	if (!this.sources[name]) {
		throw new Error('No data source named "' + name + '"');
	}

	source_config = this.sources[name];

	if (!source_config.type) {
		throw new Error('Missing type for data source "' + name + '"');
	}

	if (['mysql', 'sqlite3', 'pgsql'].indexOf(source_config.type) > -1) {
		connection = knexConnection(source_config);
	} else {
		throw new Error('Unknown data source type for "' + name + '"');
	}

	return connection;
};



function knexConnection(provided_config) {
	// Create our own config copy just in case we need to modify it by resolving paths
	var config = require('./clone')(provided_config);

	if (config.filename) {
		config.filename = Application().resolvePath(config.filename);
	}
	
	return require('knex')({
		client: config.type,
		connection: config
	});
}

