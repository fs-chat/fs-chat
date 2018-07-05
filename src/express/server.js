var express = require('express');
var path = require('path');

export default function (mainWindow) {
	var app = express();

	// EXTERNAL ENDPOINT
	// =============================================================================

	// call the packages we need
	var bodyParser = require('body-parser');
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	var port = 4500;        // set our port

	// ROUTES FOR OUR API
	// =============================================================================
	var router = express.Router(); 

	/* API root */
	router.get('/', function(req, res) {
    res.json({ message: 'FS-Chat API root endpoint.' });   
	});

	/**
	 * External landing rate setter endpoint. (Dan Berry's landing rate plugin)
	 * 
	 * @param  {rate} rate  The value of the landing rate, or "reset"
	 */
	router.get('/lrate', function(req, res, next) {
	  var rate = req.query.rate;
	  if (!rate) {
	  	// Rate should be set
	  	res.sendStatus(400);
	  } else {
	  	// Clear results
	  	if (rate == 'reset') {
	  		mainWindow.webContents.send("external-clear-results");
	  	}
	  	// Set final landing rate
	  	else {
	  		// Send to mainWindow
	  		mainWindow.webContents.send("external-compile-results", {
	  			rate: rate
	  		});
	  	}

	  	res.sendStatus(200);
	  }
	});

	// REGISTER OUR ROUTES -------------------------------
	app.use('/', router);

	// START THE SERVER
	// =============================================================================
	app.listen(port);
}