var port = process.env.PORT || 3000;

var app = require('./app/app');
app.listen(port);

console.log('Listening on http://0.0.0.0:' + port);