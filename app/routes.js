var Utils = require('libs/utils');

/**
 * Common Filters
 */
function *isLoggedIn(next) {
	if (!this.auth.isLoggedIn()) {
		this.redirect('/login');
		return;
	}
	
	yield next;
};
function *isLoggedInAjax(next) {
	if (!this.auth.isLoggedIn()) {
		this.reply({error: 'Not logged in'});
		return;
	}
	
	yield next;
};


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
		console.log('token:', this.csrf);
		yield this.render('forms', {
			csrf: this.csrf,
			passed_csrf: this.csrfCheck(), //passed_csrf,
			phrase: this.request.body.phrase || ''
		});
	});

	route('GET /login', function *() {
		yield this.render('login');
	});

	route('POST /login', function *() {
		var Users = require('models/users');

		var user = yield Users.fromLogin(this.request.body.email, this.request.body.password);
		if (!user) {
			this.redirect('/login');
			return;
		}

		this.auth.login(user);
		this.redirect('/mynetworks');
	});

	route('/mynetworks', isLoggedIn, function *() {
		yield this.render('mynetworks/network');
	});

	route('/mynetworks/_data/networks.json', isLoggedInAjax, function *() {
		var Networks = require('models/networks');

		var user = yield this.auth.user();
		var user_nets = yield Networks.userNetworks(user.id);

		this.reply({
			networks: user_nets.exportData()
		});
	});

	route('/mynetworks/_data/network.json', isLoggedInAjax, function *() {
		var Networks = require('models/networks');
		var NetworkServer = require('models/networkserver');

		var ret = {
			error: null,
			network: {},
			servers: []
		};

		var user = yield this.auth.user();
		var network = yield Networks.userNetworks(user.id, {id: this.query.id});
		if (!network) {
			ret.error = 'Network not found';
			this.reply(ret);
			return;
		}

		var servers = yield NetworkServer.fromNetworkId(network.id) || [];

		// We don't want to make all the data available..
		var servers_safe = servers.map((server) => {
			var username = 'default';
			if(server.ip_as_username) username = 'ip_as_username';
			if(server.custom_username) username = 'custom';

			return {
				id: server.id,
				address: server.address,
				port: server.port,
				port_ssl: server.port_ssl,
				username: username,
				custom_username: server.custom_username,
				verified: server.verified,
				verify_err: server.verify_last_err,
				verify_nick: server.verify_nick
			};
		});

		this.reply({
			network: network.exportData(),
			servers: servers_safe
		});
	});


	route('/mynetworks/_data/network_accesslist.json', isLoggedInAjax, function *() {
		var Networks = require('models/networks');

		var ret = {
			error: null,
			users: []
		};

		var user = yield this.auth.user();

		var network = yield Networks.userNetworks(user.id, {id: this.query.id});
		if (!network) {
			ret.error = 'Network not found';
			this.reply(ret);
			return;
		}

		var users = yield network.getAccessUsers();
		ret.users = users.exportData();

		this.reply(ret);
	});


	route('/mynetworks/_data/serverlog.json', isLoggedInAjax, function *(next) {
		yield Utils.wait(1000);

		this.reply({
			server: {address: 'sv1.freenode.net', id: parseInt(this.query.id)},
			entries: [
				{date: Date.now()-10000, text: 'connection from 12.12.12.12'},
				{date: Date.now(), text: 'error from 12.12.12.13; Closng link <bla> Ghosted'}
			]
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

