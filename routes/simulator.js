var express  = require( 'express' ); 
var passport = require( 'passport' );
var router   = express.Router();

const winston = require( 'winston' );
const request   = require( 'request' );


const { simData } = require( '../data/data' );


const XM_USERNAME  = process.env.XM_USERNAME;
const XM_PASSWORD  = process.env.XM_PASSWORD;
const XM_HOST   = process.env.XM_HOST;


router.get( '/simulator', 
  function(req, res) {
    var data = req.app.get( 'appData' );

    if( !req.user ){
       req.session.redirectTo = req.path;

      res.render( 'login', {
        'title': 'OctoApp Simulator!',
        'message': req.flash( 'loginMessage' ),
        'user': req.user
      });
       return;
    }


    res.render('simulator', {
      'title': 'OctoApp Simulator!',
      'user': req.user
    });

});

// { id: 1, username: "CHANGEME", password: "PASSWORD" }

router.post( '/simulator', (req, res) => {

   console.log( 'simulator: ' + JSON.stringify( req.body, null, 3 ) ) 

   const data = req.body;
   const appName = data.application;

   if( !simData[ appName ] ) {
      winston.loggers.get( 'main' ).info( 'No sim data configured for "' + appName + '"' );
      res.status( 202 ).send();

      return;
   }


   const payload = JSON.stringify( simData[ appName ].payload );

   payload.recipients = data.recipients;
   
   const options = {
     'uri': simData[ appName ].endpoint,
     'method': 'POST',
     'body': payload
   };


   if( simData[ appName ].basicAuth ) {
      options.auth = {
       'username': XM_USERNAME,
       'password': XM_PASSWORD
     }

   }

   if( simData[ appName ].headers ) {
     options.headers = simData[ appName ].headers

     if( options.headers['Content-Type'] == 'application/x-www-form-urlencoded' ) {
        delete options.body;
        options.form = {
          "payload": JSON.stringify(  simData[ appName ].payload )
        }
     }

   }


 
   request( options, (err, res, body ) => {
    
     /// Do something with the result?
     winston.loggers.get( 'main' ).info( 'Posted sim data for "' + appName + '": endpoint: "' + simData[ appName ].endpoint 
                                        + '" response: "' + body.data );
   });


   res.status( 200 ).send();
});


router.get( '/applications', (req,res) => {
   
    var apps = [];
    for( var app in simData ) {
      apps.push( app );
    }

    res.status( 200 ).send( apps );
});


module.exports = router;