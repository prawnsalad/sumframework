function Route(){
	this._name = '';
	this._methods = [];
	this._url = '';
	this._actions = [];
	this.controllers_path = './';
}

Route.prototype.name = function(name) {
	if (typeof name === 'undefined') {
		return this._name;
	}
	this._name = name;
	return this;
};

Route.prototype.methods = Route.prototype.method = function(methods) {
	if (typeof methods === 'undefined') {
		return this._methods;
	}

	this._methods = (typeof methods === 'string') ?
		[methods] :
		methods;
	return this;
};

Route.prototype.url = function(url) {
	if (typeof url === 'undefined') {
		return this._url;
	}
	this._url = url;
	return this;
};

Route.prototype.name = function(name) {
	if (typeof name === 'undefined') {
		return this._name;
	}
	this._name = name;
	return this;
};

Route.prototype.actions = Route.prototype.action = function(actions) {
	if (typeof actions === 'undefined') {
		return this._actions;
	}

	this._actions = (actions.constructor !== Array) ?
		[actions] :
		actions;
	return this;
};

Route.prototype.fromObj = function(obj) {
	this._methods = obj.methods || ['ALL'];
	this._url = obj.url || '';
	this._actions = this.resolveActions(obj.actions || []);
	this._name = obj.name || '';
};

Route.prototype.fromArguments = function(route, action /*, actionN*/) {
	var parts = route.split(' ');
	var methods = [];
	var url = '';
	var actions = [];

	if (parts.length === 1) {
		methods.push('all');
		url = parts[0];
	} else {
		methods = methods.concat(parts[0].split('|'));
		url = parts[1];
	}

	actions = Array.prototype.slice.call(arguments, 1);
	actions = this.resolveActions(actions);

	this._methods = methods;
	this._url = url;
	this._actions = actions;
	this._name = ''; // Setting name is not supported from arguments
};

Route.prototype.resolveActions = function(actions) {
	var resolved_actions = [];

	actions.forEach((action_arg) => {
		if (typeof action_arg !== 'string') {
			resolved_actions.push(action_arg);
			return;
		}

		var action_parts = action_arg.split('.');
		if (action_parts.length === 1) action_parts[1] = 'index';

		var routes = require(this.controllers_path + action_parts[0] + '.js');
		resolved_actions.push(routes[action_parts[0], action_parts[1]]);
	});

	return resolved_actions;
};

Route.prototype.generateUrl = function(params) {
	params = params || {};
	var unused_params = Object.assign({}, params);

	var url = this.url().replace(/:([^\/]+)/ig, (match, param_name) => {
		if (typeof params[param_name] === 'undefined') {
			throw new Error('URL parameter "'+param_name+'" missing');
		}

		delete unused_params[param_name];
		return params[param_name];
	});

	var query_str_params = [];
	Object.keys(unused_params).forEach((param_name) => {
		query_str_params.push(param_name + '=' + encodeURIComponent(params[param_name]));
	});

	if (query_str_params.length) {
		if (url.indexOf('?') > -1) {
			url += query_str_params.join('&');
		} else {
			url += '?' + query_str_params.join('&');
		}
	}

	return url;
};



module.exports = function(controllers_path, router) {
	var loaded_routes = [];



	/**
	 * route examples:
	 *     'GET /admin'
	 *     'POST /admin'
	 *     '/admin (No method defaults to ALL)'
	 *     {url: '/admin', methods: ['GET'], actions: []}
	 */

	var loadRoute = function(route, action /*, actionN*/) {
		var new_route = new Route();
		new_route.controllers_path = controllers_path;

		if (typeof route === 'string') {
			new_route.fromArguments.apply(new_route, arguments);
		} else if(typeof route === 'object') {
			new_route.fromObj(route);
		}

		new_route.method().forEach((method) => {
			router[method.toLowerCase()].apply(router, [new_route.url()].concat(new_route.actions()));
		});

		loaded_routes.push(new_route);
		return new_route;
	};


	loadRoute.generateUrl = function(route_name, params) {
		var route = loaded_routes.find((route) => {
			return route.name() === route_name;
		});

		if (!route) {
			throw new Error('Unknown route');
		}

		return route.generateUrl(params);
	};


	loadRoute.group = function(route_prefix /*, actionN, groupFn*/) {
		var args = Array.prototype.slice.call(arguments);
		var group_actions = args.slice(1, args.length-1);
		var groupFn = args[args.length-1];

		groupFn(function(route, action /*, actionN*/) {
			var args = Array.prototype.slice.call(arguments);

			// Prepend the group prefix
			// "GET /route" => "GET /prefix/route"
			// "/route" => "/prefix/route"
			
			// args[0] could either be a string or an object of route properties
			var url = (typeof args[0] === 'string') ?
				args[0] :
				args[0].url;

			var route_parts = url.split(' ');
			if (route_parts.length === 1) {
				url = route_prefix + url;
			} else {
				url = route_parts[0] + route_prefix + route_parts.slice(1).join(' ');
			}

			if (typeof args[0] === 'string') {
				args[0] = url;
			} else {
				args[0].url = url;
			}

			// Prepend the group actions
			args = args.slice(0, 1).concat(group_actions).concat(args.slice(1));

			return loadRoute.apply(loadRoute, args);
		});
	}

	return loadRoute;
};
