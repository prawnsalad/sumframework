var Users = require('models/users');

module.exports = {
	about: function *() {
		yield this.render('about', {
			random_var: 'foo'
		});
	},

	contact: function *(next) {
		var user = yield Users.where('name', '=', 'darren').select();
		this.body = JSON.stringify(user);
	}
};