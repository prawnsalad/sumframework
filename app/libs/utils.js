exports.wait = function wait(ms) {
	return function(cb) {
		setTimeout(cb, ms);
	};
};