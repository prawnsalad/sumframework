var Users = require('models/users');

module.exports = {
	about: function *() {
		yield this.render('about', {
			random_var: 'foo'
		});
	},

	contact: function *() {
		var user = yield Users.where('name', '=', 'darren').select();
		this.reply(user);
	}
};