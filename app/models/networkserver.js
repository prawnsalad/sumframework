var db = require('sumframework/datasources').get('remote');
var BaseModel = require('models/base');

module.exports = NetworkServer;


function NetworkServer(data) {
	this.initModel(data);
}

NetworkServer.prototype = Object.assign(NetworkServer.prototype, BaseModel.prototype);


NetworkServer.fromNetworkId = function(network_id) {
	return db('network_servers')
		.where('enabled', 1)
		.where('network_id', network_id)
		.then(this.toInstance);
};


NetworkServer.query = function() {
	 return db('network_servers');
};


NetworkServer.toInstance = function(rows) {
	return NetworkServer.prototype.toInstance(rows, NetworkServer);
};
