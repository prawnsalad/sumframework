var app_path = __dirname;

require('app-module-path').addPath(app_path);

var path = require('path');
var koa = require('koa');
var koaRouter = require('koa-router');
var koaStatic = require('koa-static');
var koaBodyParser = require('koa-bodyparser');
var koaEjs = require('koa-ejs');
var routeLoader = require('libs/routeLoader');

var app = module.exports = koa();



/**
 * Add ejs views into ctx.render
 */

koaEjs(app, {
  root: path.join(app_path, 'views'),
  layout: false, //'template',
  viewExt: 'html',
  cache: false,  // !config.debug
  debug: true,  // config.debug
  //filters: filters
});



/**
 * Static file serving
 */
var public_dir = path.join(app_path, '../public'); //config.public_dir
app.use(koaStatic(public_dir, {
  maxage: 0,   // config.file_cache_age
  index: 'index.html',  // config.index_file
  defer: true  // config.routes_overload_static
}));


app.use(koaBodyParser());



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

