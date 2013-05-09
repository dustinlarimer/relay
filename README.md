Persistent chat app based on [http://balloons.io/](Balloons.io)

## Required
```
MongoDB
Redis (sessions)
```

## Install
```sh
  $ git clone git://github.com/dustinlarimer/relay.git
  $ npm install
  $ npm start
```

Then visit [http://localhost:3000/](http://localhost:3000/)

**NOTE:** Local auth works, but additional options can be set in `config/config.js`

I have temporarily disabled chat stream authorization for testing purposes.  Each user will only see streams they belong to on their `/streams` index, but any stream is accessible by copy-pasting the page URL.  Create two users, sign into each from different browsers, and copy-paste one stream's URL into the other browser to get both users into the same stream.  Then talk to yourself like a total fucking weirdo.

## Directory structure
```
-app/
  |__controllers/
  |__models/
  |__views/
-config/
  |__config.js
  |__init.js (redis reset)
  |__passport.js (auth config)
  |__routes.js
  |__sockets.js (socket.io config)
-public/
  |__css (dynamic)
  |__img
  |__js
  |__less (renders to /css)
```
