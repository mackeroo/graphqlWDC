// -------------------------------------------------- //
// Module Dependencies
// -------------------------------------------------- //
var express = require("express");
var cookieParser = require("cookie-parser");
var querystring = require("querystring");
const webpack = require("webpack");
var http = require("http");
var path = require("path");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var graphql = require("graphql.js");

var sys = require("util");

var app = express();
app.use(require("morgan")("short"));

// -------------------------------------------------- //
// Express set-up and middleware
// -------------------------------------------------- //
app.set("port", process.env.PORT);
app.use(cookieParser()); // cookieParser middleware to work with cookies
app.use(express.static(__dirname + "/dist"));
(function() {
  if (process.env.NODE_ENV === "development") {
    // Step 1: Create & configure a webpack compiler
    console.log(process.env.NODE_ENV);
    var webpackConfig = require("./webpack.dev");
    var compiler = webpack(webpackConfig);

    // Step 2: Attach the dev middleware to the compiler & the server
    app.use(
      require("webpack-dev-middleware")(compiler, {
        logLevel: "warn",
        publicPath: webpackConfig.output.publicPath
      })
    );

    // Step 3: Attach the hot middleware to the compiler & the server
    app.use(
      require("webpack-hot-middleware")(compiler, {
        log: console.log,
        path: "/__webpack_hmr",
        heartbeat: 10 * 1000
      })
    );
  }
})();
// -------------------------------------------------- //
// Variables
// -------------------------------------------------- //
var clientID = process.env.CLIENT_ID;
var clientSecret = process.env.CLIENT_SECRET;
var redirectUrl = process.env.REDIRECT_URL;
var apiUrl = process.env.API_URL;

// -------------------------------------------------- //
// Routes
// -------------------------------------------------- //

app.get("/", function(req, res) {
  console.log("got here");
  res.sendFile(__dirname + "/index.html");
  // res.redirect("/index.html");
});

const AUTHENTICATE_USER = `
  mutation USER($code: String!, $redirectUrl: String) {
    authenticateUser(input: { code: $code, redirectUrl: $redirectUrl }) {
      token
    }
  }
`;

// This route is hit once oauth2 redirects to our
// server after performing authentication
app.get("/redirect", function(req, res) {
  // get our authorization code
  authCode = req.query.code;
  console.log("Auth Code is: " + authCode);

  // Make the request
  var graph = graphql(apiUrl);
  var authUser = graph(AUTHENTICATE_USER);

  authUser({
    code: authCode,
    redirectUrl: redirectUrl
  })
    .then(data => {
      // We should receive {authenticateUser: {token: ACCESS_TOKEN}}

      var accessToken = data.authenticateUser.token;
      console.log("accessToken: " + accessToken);

      // set the token in cookies so the client can access it
      res.cookie("accessToken", accessToken, {});

      // Head back to the WDC page
      res.redirect("/index.html");
    })
    .catch(err => console.log(err));
});

// -------------------------------------------------- //
// Create and start our server
// -------------------------------------------------- //
if (require.main === module) {
  var server = http.createServer(app);
  server.listen(process.env.PORT || 3030, function() {
    console.log("Listening on %j", server.address());
  });
}
