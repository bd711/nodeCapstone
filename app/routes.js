//routes.js
var unirest = require('unirest');
var Fitbit = require('./models/fitbit');
var DailyList = require('./models/dailylists');



// app/routes.js
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('pages/index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));



    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));


    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0 
        var yyyy = today.getFullYear();

        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        today = dd + '/' + mm + '/' + yyyy;

        unirest.get('https://api.fitbit.com/1/user/-/activities/date/' + today + '.json')
            .send({ "parameter": 23, "foo": "bar" })
            .end(function(response) {
                console.log(response.body);

                Fitbit.create({
                    userid: req.user._id,
                    calories: response.body.activities.tracker.calories,
                    steps: response.body.activities.tracker.steps,
                    distance: response.body.activities.tracker.distance
                }, function(err,item){
                    if(!err){
                        Fitbit.find({userid: req.user._id},function(err2,pastData){
                            if(!err2){
                                DailyLists.find({userid: req.user._id}, function(err3,lists){
                                    if(!err3){
                                        res.render('pages/profile.ejs', {
                                            user: req.user, // get the user out of session and pass to template - req.user._id
                                            today: response.body,
                                            past: pastData,
                                            symptoms: lists
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                // save today's data to Fitbit.create({userid: req.user._id, calories: response.body.activites.tracker.calories})
                
            });
        
    }); // END app.get('/profile')


    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


////// fitbit here 
var util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Fitbit authentication strategy authenticates requests by delegating to
 * Fitbit using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Fitbit application's client id
 *   - `clientSecret`  your Fitbit application's client secret
 *   - `callbackURL`   URL to which Fitbit will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new FitbitStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/fitbit/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://www.fitbit.com/oauth2/authorize';
  options.tokenURL = options.tokenURL || 'https://api.fitbit.com/oauth2/token';
  options.scopeSeparator = options.scopeSeparator || ' ';
  options.customHeaders = {
    Authorization:  'Basic '+ new Buffer(options.clientID + ':' + options.clientSecret).toString('base64')
  };

  OAuth2Strategy.call(this, options, verify);
  this.name = 'fitbit';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.authenticate = function(req, options) {
  options || (options = {});

  OAuth2Strategy.prototype.authenticate.call(this, req, options);
};

/**
 * Retrieve user profile from Fitbit.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `fitbit`
 *   - `id`
 *   - `name`
 *   - `displayName`
 *   - `birthday`
 *   - `relationship`
 *   - `isPerson`
 *   - `isPlusUser`
 *   - `placesLived`
 *   - `language`
 *   - `emails`
 *   - `gender`
 *   - `picture`
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {

  this._oauth2.useAuthorizationHeaderforGET(true);
  this._oauth2.get('https://api.fitbit.com/1/user/-/profile.json', accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

    try {
      var json = JSON.parse(body);

      var profile = { provider: 'fitbit' };
      profile.id = json.user.encodedId;
      profile.displayName = json.user.displayName;

      profile._json = json;

      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
};

/**
 * Return extra parameters to be included in the request token
 * request.
 *
 * @param {Object} options
 * @return {Object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function(options) {
  var params = options || {};

  var scope = options.scope;
  if (scope) {
    params['scope'] = Array.isArray(scope) ? scope.join(' ') : scope;
  }
  return params;
}

/**
 * Expose `Strategy` directly from package.
 */
exports = module.exports = Strategy;

/**
 * Export constructors.
 */
exports.Strategy = Strategy;
