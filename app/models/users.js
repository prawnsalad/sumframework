var db = require('sumframework/datasources').get('remote');
var BaseModel = require('models/base');

module.exports = User;


function User(data) {
	this.initModel(data);
}

User.prototype = Object.assign({}, BaseModel.prototype);


User.fromId = function(user_id) {
	return db('users')
		.select()
		.where('id', user_id)
		.first()
		.then(this.toInstance);
};


User.fromLogin = function(email, password) {
	return db('users')
		.select()
		.where('email', email)
		.where('password', '!=', '')
		.first()
		.then(this.toInstance);
};


User.toInstance = function(rows) {
	return User.prototype.toInstance(rows, User);
};
