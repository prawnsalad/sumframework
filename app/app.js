var app_path = global.app_path = __dirname;

require('app-module-path').addPath(app_path);

var path = require('path');
var koa = require('koa');
var koaRouter = require('koa-router');
var koaStatic = require('koa-static');
var koaBodyParser = require('koa-bodyparser');
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

