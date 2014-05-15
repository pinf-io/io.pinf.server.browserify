
const ASSERT = require("assert");
const PATH = require("path");
const FS = require("fs-extra");
const GLOB = require("glob");
const Q = require("q");
const SEND = require("send");
const PIO = require("pio");
const WAITFOR = require("waitfor");
const BROWSERIFY = require('browserify');


require("io.pinf.server.www").for(module, __dirname, null, function(app) {

    app.get(/^\/$/, function (req, res, next) {

		var b = BROWSERIFY();
		b.add(PATH.join(__dirname, 'node_modules/browserify/example/api/browser/main.js'));
		
		return b.bundle().pipe(res);
    });

});
