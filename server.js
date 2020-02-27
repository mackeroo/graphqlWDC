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

  // Set up a request for an long-lived Access Token now that we have a code
  var requestObject = {
    client_id: clientID,
    redirect_uri: redirectUrl,
    client_secret: clientSecret,
    code: authCode,
    grant_type: "authorization_code"
  };
  console.log("here blalba", requestObject);

  var token_request_header = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  // Build the post request for the OAuth endpoint
  var options = {
    method: "POST",
    url: "https://foursquare.com/oauth2/access_token",
    form: requestObject,
    headers: token_request_header
  };

  // Make the request
  var graph = graphql(apiUrl);
  console.log(AUTHENTICATE_USER);
  res.redirect("/index.html");

  // var authUser = graph(AUTHENTICATE_USER);

  // authUser({
  //   code: authCode,
  //   redirectUrl: redirectUrl
  // });

  // request(options, function(error, response, body) {
  //   if (!error) {
  //     // We should receive  { access_token: ACCESS_TOKEN }
  //     // if everything went smoothly, so parse the token from the response
  //     body = JSON.parse(body);
  //     var accessToken = body.access_token;
  //     console.log("accessToken: " + accessToken);

  //     // Set the token in cookies so the client can access it
  //     res.cookie("accessToken", accessToken, {});

  //     // Head back to the WDC page
  //     res.redirect("/index.html");
  //   } else {
  //     console.log(error);
  //   }
  // });
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
