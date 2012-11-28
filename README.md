## Prerequisites
```
MongoDB
Redis (sessions)
```

## Install
```sh
  $ git clone git://github.com/dustinlarimer/harbor.git
  $ npm install
  $ npm start
```

**NOTE:** Local auth works, but additional options can be set in `config/config.js`

Then visit [http://localhost:3000/](http://localhost:3000/)

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
