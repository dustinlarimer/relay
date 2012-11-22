module.exports = {
    development: {
      db: 'mongodb://localhost/harbor_dev',
	  port: 3000,
      session: {
	    "secret" : "5<q%&0Afd7mG4y?9hke6{t@M1)xV'2nbSBL3PR~opJj!zgN8lu"
	  },
      facebook: {
          clientID: "APP_ID"
        , clientSecret: "APP_SECRET"
        , callbackURL: "http://localhost:3000/auth/facebook/callback"
      },
      twitter: {
          clientID: "BLVco6Gwjy5lvyGAZwTAFQ"
        , clientSecret: "v4VWoM7RFxLMk7UjBaTt5TJ2GYBHBy03ZCdBhCeIM"
        , callbackURL: "http://localhost:3000/auth/twitter/callback"
      },
      github: {
          clientID: 'APP_ID'
        , clientSecret: 'APP_SECRET'
        , callbackURL: 'http://localhost:3000/auth/github/callback'
      },
      google: {
          clientID: "APP_ID"
        , clientSecret: "APP_SECRET"
        , callbackURL: "http://localhost:3000/auth/google/callback"
      }
    }
  , test: {

    }
  , production: {

    }
}