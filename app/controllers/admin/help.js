var Users = require('models/users');

module.exports.index = function *(next) {
    this.body = this.params.name + ', hi. '; // + router.url('homepage');
};
