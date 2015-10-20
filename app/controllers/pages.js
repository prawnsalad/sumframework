module.exports = {
	about: function *() {
		yield this.render('about', {
			random_var: 'foo'
		});
	},

	contact: function *() {
		this.body = 'Contact page';
	}
};