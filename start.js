var port = process.env.PORT || 3000;

var Application = require('./app/app');

var app = Application();
app.listen(port);

console.log('Listening on http://0.0.0.0:' + port);