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

    app.get('/auth/fitbit',
      passport.authenticate('fitbit', { scope: ['activity','heartrate','location','profile'] }
    ));

    app.get( '/auth/fitbit/callback', passport.authenticate( 'fitbit', { 
            successRedirect: '/profile',
            failureRedirect: '/'
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
