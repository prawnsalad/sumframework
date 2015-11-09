module.exports = BaseModel;

function BaseModel() {}


BaseModel.prototype.initModel = function(data) {
	this._data = data || {};
	this._changed = Object.create(null);
	if (data) this.defineGetters();
};


BaseModel.prototype.defineGetters = function() {
	Object.keys(this._data).forEach((key) => {
		// Only add the getter if it doesn't interfere with anything else
		if (typeof this[key] !== 'undefined') {
			return;
		}

		Object.defineProperty(this, key, {
			get: () => this._data[key],
			set: (val) => {
				return this.set(key, val);
			}
		});
	});
};


BaseModel.prototype.get = function(key) {
	return this._data[key];
};


BaseModel.prototype.set = function(key, val) {
	if (this._data[key] !== val) {
		this._changed[key] = true;
	}
	this._data[key] = val;
};


BaseModel.prototype.exportData = function() {
	return this._data;
};


BaseModel.prototype.asJson = function() {
	return JSON.stringify(this.exportData());
};


BaseModel.prototype.toInstance = function(rows, constructor) {
	constructor = constructor || this.constructor;

	var ret;
	
	if (!rows) return;

	if (rows.constructor === Array) {
		ret = [];
		rows.forEach((row) => {
			ret.push(new constructor(row));
		});

		ret.asJson = function() {
			return JSON.stringify(this.exportData());
		};

		ret.exportData = function() {
			var datas;

			datas = [];
			this.forEach((instance) => {
				//console.log(instance, instance._data);
				datas.push(instance.exportData());
			});

			return datas;
		};

	} else {
		ret = new constructor(rows);
	}

	return ret;
}