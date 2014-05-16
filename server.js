
const ASSERT = require("assert");
const PATH = require("path");
const FS = require("fs-extra");
const GLOB = require("glob");
const Q = require("q");
const SEND = require("send");
const PIO = require("pio");
const WAITFOR = require("waitfor");
const DEEPCOPY = require("deepcopy");
const BROWSERIFY = require('browserify');


require("io.pinf.server.www").for(module, __dirname, null, function(app) {

	var routes = null;

	function mapRoutes() {
		var _routes = {};
		return PIO.forPackage(__dirname).then(function(pio) {
			if (!pio._config["config.plugin"]) return;
			var all = [];
			Object.keys(pio._config["config.plugin"]).forEach(function(serviceId) {
				if (!_routes[serviceId]) {
					_routes[serviceId] = {};
				}
				all.push(pio.locate(serviceId).then(function(serviceLocator) {
					var config = pio._config["config.plugin"][serviceId];
					var all = [];
					if (
						serviceLocator.aspects ||
						serviceLocator.aspects.source ||
						serviceLocator.aspects.source.basePath
					) {
						if (typeof config.bundles === "string") {
							config.bundles = {
								"__DEFAULT__": config.bundles
							};
						}
						Object.keys(config.bundles).forEach(function(bundleGroup) {
							Object.keys(config.bundles[bundleGroup]).forEach(function(bundleId) {
								if (bundleId === "*") {
									var selector = config.bundles[bundleGroup][bundleId].selector;
									if (!Array.isArray(selector)) {
										selector = [ selector ];
									}
									selector.forEach(function(selector) {
										all.push(Q.denodeify(function(callback) {
											console.log("Locate widgets using '" + selector + "' in '" + serviceLocator.aspects.source.basePath + "'!");
											return GLOB(selector, {
												cwd: serviceLocator.aspects.source.basePath
											}, function (err, paths) {
												if (err) return callback(err);
												if (paths.length === 0) return callback(null);


												if (!_routes[serviceId][bundleGroup]) {
													_routes[serviceId][bundleGroup] = {};
												}
												paths.forEach(function(path) {
													path = PATH.join(serviceLocator.aspects.install.basePath, path);

													var filename = PATH.basename(path);
													var info = DEEPCOPY(config.bundles[bundleGroup][bundleId]);
													info.path = path;
													_routes[serviceId][bundleGroup][filename] = info;
												});
												return callback(null);
											});
										})());
									});
								} else {
									throw new Error("Bundle ID of '" + bundleId + "' not yet supported!");
								}
							});
						});
					}
					return Q.all(all);
				}));
			});
			return Q.all(all);
		}).then(function() {
			return _routes;
		});
	}


    function ensureRoutes(res, next) {
    	if (routes) {
    		return next();
    	}
    	res.writeHead(503);
    	return res.end("Initializing ...");
    }


    function locateRoute(serviceId, group, name, callback) {
    	if (!routes[serviceId]) {
    		return callback(new Error("No routes for serviceId '" + serviceId + "'!"));
    	}
    	if (name) {
	    	name = name.replace(/\..+$/, "").split("/")[0];
	    }
    	if (!routes[serviceId][group]) {
    		if (routes[serviceId]["__DEFAULT__"][name]) {
    			group = "__DEFAULT__";
    		} else {
	    		return callback(new Error("No routes for serviceId '" + serviceId + " and group '" + group + "'!"));
	    	}
    	}
    	if (!routes[serviceId][group][name]) {
    		return callback(new Error("No route for serviceId '" + serviceId + " and group '" + group + "' and name '" + name + "'!"));
    	}
    	return callback(null, routes[serviceId][group][name]);
    }

    app.get(/^\/bundle\/([^\/]+)(?:\/([^\/]+))?\/(.+)$/, function (req, res, next) {
    	return ensureRoutes(res, function(err) {
    		if (err) return next(err);
    		return locateRoute(req.params[0], req.params[1], req.params[2], function(err, route) {
    			if (err) return next(err);

				var bundle = BROWSERIFY();

				var mainPath = PATH.join(route.path, route.main);
				console.log("bundeling", mainPath);
				bundle.add(mainPath);
				return bundle.bundle().pipe(res);
    		});
    	});
    });


	function doMapRoutes() {
		return mapRoutes().then(function(_routes) {
			if (JSON.stringify(routes) !== JSON.stringify(_routes)) {
				console.log("Mapped routes:", JSON.stringify(_routes, null, 4));
			}
			routes = _routes;
		}).fail(function(err) {
			console.error("Error mapping routes!", err.stack);
		});
	}

	// TODO: Only rescan on reload!
	setInterval(doMapRoutes, 15 * 1000);
	doMapRoutes();

});

