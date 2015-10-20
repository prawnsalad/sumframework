module.exports = function(controllers_path, router) {
	/**
	 * route examples:
	 *     GET /admin
	 *     POST /admin
	 *     /admin (No method defaults to ALL)
	 */

	return function loadRoute(route, action /*, actionN*/) {
		var parts = route.split(' ');
		var methods = [];
		var url = '';
		var actions = [], resolved_actions = [];

		if (parts.length === 1) {
			methods.push('all');
			url = parts[0];
		} else {
			methods = methods.concat(parts[0].split('|'));
			url = parts[1];
		}

		actions = Array.prototype.slice.call(arguments, 1);
		actions.forEach((action_arg) => {
			if (typeof action_arg !== 'string') {
				resolved_actions.push(action_arg);
				return;
			}

			var action_parts = action_arg.split('.');
			if (action_parts.length === 1) action_parts[1] = 'index';

			var routes = require(controllers_path + action_parts[0] + '.js');
			resolved_actions.push(routes[action_parts[0], action_parts[1]]);
		});

		methods.forEach((method) => {
			router[method.toLowerCase()].apply(router, [url].concat(resolved_actions));
		});
	};
};
