// Not a fan of this singleton. But other libs under sumframework/ need
// access to the app object.. without the use of a global.
// TODO: Think about this ^
var instance = null;

module.exports = function() {
	if (!instance) {
		instance = generateInstance.apply(this, arguments);
		configureApplication(instance);
	}

	return instance;
};



function generateInstance(app_path) {
	require('app-module-path').addPath(app_path);

	var path = require('path');
	var koa = require('koa');

	var app = global.app = koa();
	app.resolvePath = (relative_path) => path.join(app_path, relative_path);
	return app;
}


function configureApplication(app) {
	var koaRouter = require('koa-router');
	var koaStatic = require('koa-static');
	var koaBodyParser = require('koa-bodyparser');
	var koaSession = require('koa-generic-session');
	var koaFlash = require('koa-flash');
	var koaRedisStore = require('koa-redis');
	var koaCsrf = require('koa-csrf');
	var koaEjs = require('koa-ejs');
	var Config = require('./config');
	var routeLoader = require('./routeLoader');
	var DataSources = require('./datasources');
	var Auth = require('./auth');


	var config = global.config = Config.generate([
		require('config/config.js'),
		require('config/config.local.js')
	]);



	DataSources.setInstance(new DataSources(config('data_sources')));


	app.keys = (typeof config('secret') === 'string') ?
		[config('secret')] :
		config('secret');



	/**
	 * Add ejs views into ctx.render
	 */

	koaEjs(app, {
		root: app.resolvePath('views'),
		layout: false, //'template',
		viewExt: 'html',
		cache: !config('debug'),
		debug: config('debug')
		//filters: filters
	});


	/**
	 * Static file serving
	 */
	var public_dir = app.resolvePath(config('public_dir'));
	app.use(koaStatic(public_dir, {
		maxage: config('file_server.cache_length'),
		index: config('file_server.index'),
		defer: !config('file_server.overload_routes')
	}));


	app.use(koaBodyParser());


	/**
	 * Sessions
	 */
	var session_store_name = config('sessions.storage');
	var session_store;
	if (session_store_name === 'redis') {
		session_store = koaRedisStore(config('sessions.redis'));
	} else if (session_store_name === 'memory') {
		// Koa default
	} else {
		throw new Error('Invalid sessions storage type');
	}

	app.use(koaSession({
		key: config('sessions.cookie_name'),
		prefix: 'ses:',
		store: session_store,
		cookie: {
			path: '/',
			httpOnly: true,
			maxage: null,
			rewrite: true,
			signed: true
		}
	}));

	app.use(koaFlash({
		key: '_flash_data'
	}));


	/**
	 * CSRF protection
	 */
	koaCsrf(app);
	app.use(function *(next) {
		// Add the ctx.csrfCheck() function
		this.csrfCheck = (body) => {
			try {
				this.assertCsrf(body || this.request.body);
				return true;
			} catch (err) {
				console.log(err.stack);
				return false;
			}
		};

		yield next;
	});


	/**
	 * Auth stuff
	 */
	if (config('auth.load_on_routes')) {
		app.use(Auth(require(config('auth.user_model'))));
	}


	/**
	 * Add some ctx.reply() sugar
	 * ctx.reply(body)
	 * ctx.reply(body, status)
	 * ctx.reply(body, headers)
	 * ctx.reply(body, status, headers)
	 */
	app.use(function *(next) {
		this.reply = (body, status, headers) => {
			this.response.body = body;

			if (typeof status === 'number') {
				this.response.status = status;
			}
			if (typeof status === 'object') {
				this.response.set(status);
			}
			if (typeof headers === 'object') {
				this.response.set(headers);
			}
		};

		yield next;
	});



	/**
	 * Route loading
	 */
	var router = new koaRouter();
	var loadRoute = routeLoader(app.resolvePath('controllers/'), router);
	var app_routes = require(app.resolvePath('routes'));

	app_routes(loadRoute);

	app.use(function *(next) {
		// Make the router available to routes
		this.makeUrl = loadRoute.generateUrl;
		yield next;
	});

	app.use(router.routes());
	app.use(router.allowedMethods());

	return app;
}

