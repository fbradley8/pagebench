var packager = require('electron-packager');
var options = {
	dir: '.',
	out: 'dist',
	overwrite: true,
	platform: 'win32',
	arch: 'x64'
};
packager(options, function done_callback (err, appPaths) { console.log('done'); });