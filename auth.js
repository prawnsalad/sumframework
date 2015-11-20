module.exports = function(UserModel) {

	return function *auth(next) {
		var cached_user;
		var ctx = this;

		// TODO: Cache this auth object so it;s not created on every request
		this.auth = {
			user: function(wat) {
				return function(cb) {
					if (!ctx.session._auth_id) {
						process.nextTick(function() {
							cb();
						});
						return;
					}
					if (cached_user) {
						process.nextTick(function() {
							cb(null, cached_user);
						});
						return;
					}
					UserModel.fromId(ctx.session._auth_id).then(function(user) {
						cb(null, user);
					});
				};
			},
			login: function(user) {
				ctx.session._auth_id = (typeof user === 'number') ?
					user :
					user.id;

				return this.user();
			},
			logout: function() {
				delete ctx.session._auth_id;
				cached_user = null;
			},
			isLoggedIn: function() {
				return !!ctx.session._auth_id;
			}
		};
		
		yield next;
	}
};