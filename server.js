const express = require('express');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');
const api = require('./api');

const app = express();
const port = process.env.PORT || 8000;

const mongoHost = process.env.MONGO_HOST || "localhost";
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoUser = process.env.MONGO_USER || "root";
const mongoPassword = process.env.MONGO_PASSWORD || "letmein";
const mongoDBName = process.env.MONGO_DB_NAME || "businessEcosystemDB";
const mongoURL =
    `mongodb://${mongoUser}:${mongoPassword}@` +
    `${mongoHost}:${mongoPort}/${mongoDBName}`;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})
console.log ("== Connecting to database");
MongoClient.connect(mongoURL).then(function (client) {
  console.log ("== Connected to database");
  global.db = client.db(mongoDBName)
  app.listen(port, function() {
    console.log("== Server is running on port", port);
  });
});
