var db = require('sumframework/datasources').get('remote');
var BaseModel = require('models/base');

module.exports = Network;


function Network(data) {
	this.initModel(data);
}

Network.prototype = Object.assign(Network.prototype, BaseModel.prototype);


Network.prototype.getAccessUsers = function() {
	return db('network_groups')
		.select('users.*')
		.where('network_id', this.id)
		.innerJoin('users', 'users.id', 'network_groups.user_id')
		.then(require('models/users').toInstance);
};


Network.userNetworks = function(user_id, opts) {
	opts = opts || {};

	var query = db('network')
		.select()
		.where('user_id', user_id)
		.whereNull('deleted_at');

	if (opts.id) {
		query.where('id', opts.id).first();
	}

	return query.then(this.toInstance);
};


Network.query = function() {
	 return db('network');
};


Network.toInstance = function(rows) {
	return Network.prototype.toInstance(rows, Network);
};
