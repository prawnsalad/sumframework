(function() {
	Vue.partial('alert-error', '#tmpl-alert-error');
	Vue.partial('alert-success', '#tmpl-alert-success');


	var current_app = null;
	function showApp(app, cb) {
		var insertApp = function() {
			current_app = app;
			app.$mount().$appendTo('.main-page', cb);
		}

		if (current_app) {
			current_app.$remove(insertApp);
		} else {
			insertApp();
		}
	}


	var networkList = new Vue({
		template: '#tmpl-network-list',
		data: function() { return {
			networks: []
		}; },
		methods: {
			loadNetworks: function() {
				var self = this;
				self.$set('is_loading', true);

				$.getJSON('/mynetworks/_data/networks.json')
				.done(function(data) {
					self.$set('networks', data.networks);
				    self.$set('is_loading', false);
				})
				.fail(function(err) {
				    self.$set('is_loading', false);
				});
			},

			expandMenu: function(event) {
				var $other_menus = $(this.$el).find('.network-list-sub');
				var $this_menu = $(event.toElement).siblings('.network-list-sub');

				$other_menus.slideUp('fast');
				$this_menu.slideDown('fast');
			},

			showNetwork: function(id) {
				console.log('Showing network ID:', id);
				var ServerList = appServers();

				var servers = new ServerList();
				servers.loadFromNetworkId(id);

				showApp(servers);
			},

			showAccessList: function(id) {
				console.log('Showing network ID:', id);
				var AccessList = appAccessList();

				var access = new AccessList();
				access.loadFromNetworkId(id);

				showApp(access);
			}
		}
	});

	networkList.$mount().$appendTo('.side-menu');
	networkList.loadNetworks();
})();










/**
 * App - Network access list
 */
function appAccessList() {
	var AccessList = Vue.extend({
		template: '#tmpl-network-access',
		methods: {
			loadFromNetworkId: function(network_id) {
				var self = this;

				if (this.$data.is_loading) return;
				this.$set('is_loading', true);

				$.getJSON('/mynetworks/_data/network_accesslist.json', {id: network_id})
				.done(function(data) {
					Object.keys(data).forEach(function(prop) {
						self.$set(prop, data[prop]);
					});
					
				    self.$set('is_loading', false);
				})
				.fail(function(err) {
				    self.$set('is_loading', false);
				});
			},

			confirmAndDeleteUser: function(user_id) {
				if (!confirm('Remove this user from the access list? They will no longer be available to administer this network')) {
					return;
				}

				this.deleteUser(user_id);
			},

			deleteUser: function(user_id) {
				var self = this;
				this.users.map(function(user) {
					if (user.id === user_id) {
						self.users.$remove(user);
					}
				});
			}
		}
	});

	return AccessList;
}















/**
 * App - servers
 */
function appServers() {

	/**
	 * Sections
	 */
	


	var ServerSettings = Vue.extend({
		template: '#tmpl-server-settings',
		props: ['server'],
		data: {
			id: 1,
			port: 6667,
			port_ssl: 6667,
			webirc: 'webircpassword',
			ip_as_username: false,
			enabled: true
		},

		created: function() {
			var self = this;
			this.$on('close-sections', function() {
				//self.$destroy();
			});
		}
	});




	var ServerLog = Vue.extend({
		template: '#tmpl-server-log',
		props: ['server'],
		methods: {
			loadEvents: function() {
				var self = this;

				if (this.$data.is_loading) return;
				this.$set('is_loading', true);

				$.getJSON('/mynetworks/_data/serverlog.json', {id: this.server.id})
				.done(function(data) {
					Object.keys(data).forEach(function(prop) {
						self.$set(prop, data[prop]);
					});
					
				    self.$set('is_loading', false);
				})
				.fail(function(err) {
				    self.$set('is_loading', false);
				});
			},
			refresh: function() {
				// If no server set here yet, don't refresh
				// TODO: loadFromServerId() should store the ID somewhere so this can be called..
				if (!this.$data.server) return;
				this.loadEvents();
			}
		},
		data: {
			is_loading: false,
			server: {address: 'sv1.freenode.net', id: 1},
			entries: [
				{date: 123456789, text: 'connection from 12.12.12.12'},
				{date: 123456789, text: 'error from 12.12.12.13; Closng link <bla> Ghosted'}
			]
		},

		created: function() {
			var self = this;
			this.$on('close-sections', function() {
				//self.$destroy();
			});
		}
	});




	var Server = Vue.extend({
		template: '#tmpl-server',
		components: {
			settings: ServerSettings,
			log: ServerLog
		},
		data: function() { return {
			server_app: null
		} },
		computed: {
			friendlyVerificationError: function() {
				var map = {
					unknown: 'An unknown error occured',
					connection: 'Error connecting to the IRC server',
					irc: 'The IRC server gave an error before we could verify it',
					no_oper: this.server.verify_nick + ' was not detected as a network operator'
				};

				return map[this.server.verify_err];
			}
		},
		props: ['server'],
		methods: {
			showSettings: function(server_idx, event) {
				// Tell any any other servers in our parent list to close their sections first
				this.$parent.$broadcast('close-sections');

				this.server_app = 'settings';
			},

			showLog: function(event) {
				// Tell any any other servers in our parent list to close their sections first
				this.$parent.$broadcast('close-sections');

				this.server_app = 'log';
				this.$nextTick(function() {
					this.$children[0].loadEvents();
				});
			}
		},

		created: function() {
			var self = this;
			this.$on('close-sections', function() {
				console.log('got close-sections event');
				self.server_app = null;
			});
		}
	});




	var ServerList = Vue.extend({
		template: '#tmpl-server-list',
		components: {
			server: Server
		},
		data: function() { return {
			server_app: null
		}; },
		methods: {
			loadFromNetworkId: function(network_id) {
				var self = this;
				$.getJSON('/mynetworks/_data/network.json?id='+network_id, function(data) {
					//self.$set('network', data.network);
					//self.$set('servers', data.servers);
					Object.keys(data).forEach(function(prop) {
						self.$set(prop, data[prop]);
					});
				});
			}
		}
	});
	return ServerList;
}