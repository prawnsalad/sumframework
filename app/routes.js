module.exports = function(route) {
	// Single HTTP method..
	route('GET /help/:name', 'admin/help');

	// Multiple HTTP methods..
	route('GET|POST /contact', 'pages.contact');

	// All HTTP methods..
	route('/about', 'pages.about');

	// Inline route function
	route('/time', function *() {
		this.reply(Date.now());
	});

	route('/forms', function *() {
		//var passed_csrf = this.csrfCheck();
		console.log('token:', this.csrf);
		yield this.render('forms', {
			csrf: this.csrf,
			passed_csrf: this.csrfCheck(), //passed_csrf,
			phrase: this.request.body.phrase || ''
		});
	});

	// Filters / plugins / middleware for this single route
	//route('/secret', require('filters/isAdmin'), 'admin/dashboard');
};





/* Reference. Ignore.
router.get('homepage', '/', function *(next) {
	this.body = this.query.name + ', hi. ' + router.url('homepage');
});
*/

