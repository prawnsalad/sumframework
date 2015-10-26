module.exports = {
	debug: false,

	// Secret key used for encrypting cookies and other bits of data
	secret: 'SET THIS AS A RANDOM STRING NOW',

	public_dir: '../public/',

	file_server: {
		cache_length: 0,
		index: 'index.html',
		overload_routes: false
	},


	data_sources: {
		main: {
			type: 'mysql',
			host: '127.0.0.1',
			user: 'your_database_user',
			password: 'your_database_password',
			database: 'myapp_test'
		},
		other: {
			type: 'sqlite3',
			filename: '../appdb.sqlite3'
		},
		someRemoteApi: {},
		aPostgreSQLDB: {},
		aMongoDB: {}
	},


	sessions: {
		cookie_name: 'sid',

		storage: 'memory',
		memory: {},
		redis: {},
		cookie: {},
	}
};