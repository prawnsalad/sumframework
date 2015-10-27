var app_path = global.app_path = __dirname;

require('app-module-path').addPath(app_path);

var path = require('path');
var koa = require('koa');
var koaRouter = require('koa-router');
var koaStatic = require('koa-static');
var koaBodyParser = require('koa-bodyparser');
var koaSession = require('koa-generic-session');
var koaFlash = require('koa-flash');
var koaRedisStore = require('koa-redis');
var koaCsrf = require('koa-csrf');
var koaEjs = require('koa-ejs');
var Config = require('libs/config');
var routeLoader = require('libs/routeLoader');
var DataSources = require('libs/datasources');


var config = global.config = Config.generate([
	require('config/config.js'),
	require('config/config.local.js')
]);



DataSources.setInstance(new DataSources(config('data_sources')));



var app = module.exports = koa();

app.keys = (typeof config('secret') === 'string') ?
	[config('secret')] :
	config('secret');



/**
 * Add ejs views into ctx.render
 */

koaEjs(app, {
	root: path.join(app_path, 'views'),
	layout: false, //'template',
	viewExt: 'html',
	cache: !config('debug'),
	debug: config('debug')
	//filters: filters
});



/**
 * Static file serving
 */
var public_dir = path.join(app_path, config('public_dir'));
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
var loadRoute = routeLoader(path.join(app_path, 'controllers/'), router);
require('./routes')(loadRoute);

app.use(function *(next) {
	// Make the router available to routes
	this.router = router;
	yield next;
});
app.use(router.routes());
app.use(router.allowedMethods());

