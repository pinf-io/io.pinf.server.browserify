
From: https://groups.google.com/d/msg/devcomp-io/eksb51i73Bg/DVDiIHpqE5kJ
-----

I have implemented a service that uses browserify:

  https://github.com/substack/node-browserify

to transport nodejs style modules to the browser.

The service is here:

  https://github.com/pinf-io/io.pinf.server.browserify

The approach I took was to get the third party component (browserify) working within a pio deployed service:

  https://github.com/pinf-io/io.pinf.server.browserify/commit/0f36fcc00ce0dd3e746b6c569d053e75b244746d

Then in the second commit I am pulling in plugin meta data and configuring routes:

  https://github.com/pinf-io/io.pinf.server.browserify/commit/9de6c42e49aeb7e070f798b418eac931d4399527

The result is now that any service can in its package.json declare:

	{
	  "config": {
	    "io.pinf.server.browserify": {
	      "bundles": {
	        "examples": {
	          "*": {
	            "selector": "./www/examples/browserify/*",
	            "main": "main.js"
	          }
	        }
	      }
	    }
	  }
	}

Where www/examples/browserify/* is for example: https://github.com/pinf-io/io.pinf.server.browserify/tree/master/www/examples/browserify/

And in the admin system of the devcomp.io instance you will be able to call these bundles using:

  https://github.com/pinf-io/io.pinf.server.browserify/blob/master/www/examples/browserify/01-simple/index.html

This is an example of how to integrate a third party component and configure it based on the pio meta system.
