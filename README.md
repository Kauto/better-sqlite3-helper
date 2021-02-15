# better-sqlite3-helper

A nodejs wrapper library for the work with [better-sqlite3](https://www.npmjs.com/package/better-sqlite3/) ("The fastest and simplest library for SQLite3 in Node.js"). It's intended for simple server-apps for nodejs and offer some new functions and a migration-system.

<a href='https://ko-fi.com/kautode' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />
  
## New in Version 3.0
[better-sqlite3](https://www.npmjs.com/package/better-sqlite3/) Version 7 is now used. This means that the option "memory" is removed (use path `:memory:` instead - worked in version 2 too) and support for Node.js versions < 10 is dropped. For older node versions you can continue using version 2 of this library.

## New in Version 2.0
All commands of better-sqlite3 Version 5 (like [function](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#functionname-options-function---this) and [backup](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#backupdestination-options---promise)) can now be used too. Commands for Version 4 are removed. In addition there is now a TypeScript Declaration File for this library.

## How to install

Install it for example with

```bash
npm i better-sqlite3-helper
```

## How to use

In every file you want access to a sqlite3 database simply require the library and use it right away.
##### anyServerFile.js
```js
const DB = require('better-sqlite3-helper');

let row = DB().queryFirstRow('SELECT * FROM users WHERE id=?', userId);
console.log(row.firstName, row.lastName, row.email);
```

To setup your database, create a `sql`-file named `001-init.sql` in a `migrations`-directory in the root-directory of your program.
##### ~/migrations/001-init.sql
```sql
-- Up
CREATE TABLE `users` (
  id INTEGER PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL
);

-- Down
DROP TABLE IF EXISTS `users`;
```
And that's it!

## One global instance
A normal, simple application is mostly working with only one database. To make the class management more easy, this library does the access-control for you - mainly as a singleton. (But you can create a new instance to access other databases.)

The database loads lazy. Only when it's used for the first time, the database is read from the file, the migration is started and the journal-mode WAL is set. The default directory of the database is `'./data/sqlite3.db'`.

If you want to change the default-values, you can do this by calling the library once in the beginning of your server-code and thus setting it up:
##### index.js
```js
const DB = require('better-sqlite3-helper');

// The first call creates the global instance with your settings
DB({
  path: './data/sqlite3.db', // this is the default
  readonly: false, // read only
  fileMustExist: false, // throw error if database not exists
  WAL: true, // automatically enable 'PRAGMA journal_mode = WAL'
  migrate: {  // disable completely by setting `migrate: false`
    force: false, // set to 'last' to automatically reapply the last migration-file
    table: 'migration', // name of the database table that is used to keep track
    migrationsPath: './migrations' // path of the migration-files
  }
})
```

After that you can use the library without parameter:
##### anotherAPIFile.js
```js
const DB = require('better-sqlite3-helper');

// a second call directly returns the global instance
let row = DB().queryFirstRow('SELECT * FROM users WHERE id=?', userId);
console.log(row.firstName, row.lastName, row.email);
```

## New Functions
This class implements shorthand methods for [better-sqlite3](https://www.npmjs.com/package/better-sqlite3/).

```js
// shorthand for db.prepare('SELECT * FROM users').all();
let allUsers = DB().query('SELECT * FROM users');
// result: [{id: 1, firstName: 'a', lastName: 'b', email: 'foo@b.ar'},{},...]
// result for no result: []

// shorthand for db.prepare('SELECT * FROM users WHERE id=?').get(userId);
let row = DB().queryFirstRow('SELECT * FROM users WHERE id=?', userId);
// result: {id: 1, firstName: 'a', lastName: 'b', email: 'foo@b.ar'}
// result for no result: undefined

// shorthand for db.prepare('SELECT * FROM users WHERE id=?').get(999) || {};
let {id, firstname} = DB().queryFirstRowObject('SELECT * FROM users WHERE id=?', userId);
// result: id = 1; firstName = 'a'
// result for no result: id = undefined; firstName = undefined

// shorthand for db.prepare('SELECT * FROM users WHERE id=?').pluck(true).get(userId);
let email = DB().queryFirstCell('SELECT email FROM users WHERE id=?', userId);
// result: 'foo@b.ar'
// result for no result: undefined

// shorthand for db.prepare('SELECT * FROM users').all().map(e => e.email);
let emails = DB().queryColumn('email', 'SELECT email FROM users');
// result: ['foo@b.ar', 'foo2@b.ar', ...]
// result for no result: []

// shorthand for db.prepare('SELECT * FROM users').all().reduce((o, e) => {o[e.lastName] = e.email; return o;}, {});
let emailsByLastName = DB().queryKeyAndColumn('lastName', 'email', 'SELECT lastName, name FROM users');
// result: {b: 'foo@b.ar', c: 'foo2@b.ar', ...}
// result for no result: {}
```

## Insert, Update and Replace

There are shorthands for `update`, `insert`, `replace` and `delete`. They are intended to make programming of CRUD-Rest-API-functions easier. With a `blacklist` or a `whitelist` it's even possible to send a request's query (or body) directly into the database.

### Update
```js
// const numberOfChangedRows = DB().update(table, data, where, whitelist = undefined)

// simple use with a object as where and no whitelist
DB().update('users', {
  lastName: 'Mustermann',
  firstName: 'Max'
}, {
  email: 'unknown@emailprovider.com'
})

// data from a request and a array as a where and only editing of lastName and firstName is allowed
DB().update('users', req.body, ['email = ?', req.body.email], ['lastName', 'firstName'])


// update with blacklist (id and email is not allowed; only valid columns of the table are allowed) and where is a shorthand for ['id = ?', req.body.id]
DB().updateWithBlackList('users', req.body, req.body.id, ['id', 'email'])
```

### Insert and replace
```js
// const lastInsertID = DB().insert(table, datas, whitelist = undefined)
// const lastInsertID = DB().replace(table, datas, whitelist = undefined)

// simple use with an object and no whitelist
DB().insert('users', {
  lastName: 'Mustermann',
  firstName: 'Max',
  email: 'unknown@emailprovider.com'
})

// inserting two users
DB().insert('users', [{
  lastName: 'Mustermann',
  firstName: 'Max',
  email: 'unknown@emailprovider.com'
}, {
  lastName: 'Mustermann2',
  firstName: 'Max2',
  email: 'unknown2@emailprovider.com'
}])

// data from a request and only lastName and firstName are set
DB().replace('users', req.body, ['lastName', 'firstName'])


// replace with blacklist (id and email is not allowed; only valid columns of the table are allowed)
DB().replaceWithBlackList('users', req.body, ['id', 'email']) // or insertWithBlackList
```

### Delete
```js
//delete the user with an id of 4
DB().delete('users', {id: 4})
```

### Try and catch

If you want to put invalid values into the database, the functions will throw an error. So don't forget to surround the functions with a `try-catch`. Here is an example for an express-server:
```js
const { Router } = require('express')
const bodyParser = require('body-parser')
const DB = require('better-sqlite3-helper')

router.patch('/user/:id', bodyParser.json(), function (req, res, next) {
  try {
    if (!req.params.id) {
      res.status(400).json({error: 'missing id'})
      return
    }
    DB().updateWithBlackList(
      'users',
      req.body,
      req.params.id,
      ['id']
    )

    res.statusCode(200)
  } catch (e) {
    console.error(e)
    res.status(503).json({error: e.message})
  }
})
```



## Migrations

The migration in this library mimics the migration system of the excellent [sqlite](https://www.npmjs.com/package/sqlite) by Kriasoft.

To use this feature you have to create a `migrations`-directory in your root. Inside you create `sql`-files that are separated in a up- and a down-part:

##### `migrations/001-initial-schema.sql`

```sql
-- Up
CREATE TABLE Category (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE Post (id INTEGER PRIMARY KEY, categoryId INTEGER, title TEXT,
  CONSTRAINT Post_fk_categoryId FOREIGN KEY (categoryId)
    REFERENCES Category (id) ON UPDATE CASCADE ON DELETE CASCADE);
INSERT INTO Category (id, name) VALUES (1, 'Business');
INSERT INTO Category (id, name) VALUES (2, 'Technology');

-- Down
DROP TABLE Category
DROP TABLE Post;
```

##### `migrations/002-missing-index.sql`

```sql
-- Up
CREATE INDEX Post_ix_categoryId ON Post (categoryId);

-- Down
DROP INDEX Post_ix_categoryId;
```

The files need to be numbered. They are automatically executed before the first use of the database.

**NOTE**: For the development environment, while working on the database schema, you may want to set
`force: 'last'` (default `false`) that will force the migration API to rollback and re-apply the latest migration over again each time when Node.js app launches. See "Global Instance".

You can also give an array of changes.

```js
const DB = require('better-sqlite3-helper')

const db = new DB({
  migrate: {
    migrations: [
      `-- Up
      CREATE TABLE Setting (
        key TEXT NOT NULL UNIQUE,
        value BLOB,
        type INT NOT NULL DEFAULT 0,
        PRIMARY KEY(key)
      );
      CREATE INDEX IF NOT EXISTS Setting_index_key ON Setting (key);

      -- Down
      DROP INDEX IF EXISTS Setting_index_key;
      DROP TABLE IF EXISTS Setting;
      `,
      `-- Up
      INSERT INTO Setting (key, value, type) VALUES ('test', 'now', 0);
      INSERT INTO Setting (key, value, type) VALUES ('testtest', 'nownow', 6);

      -- Down
      DELETE FROM Setting WHERE key = 'test';
      DELETE FROM Setting WHERE key = 'testtest';
      `
    ]
  }
})
```

## More Documentation of better-sqlite3

- [API documentation](https://github.com/JoshuaWise/better-sqlite3/wiki/API)

## License

[MIT](https://github.com/Kauto/better-sqlite3-helper/blob/master/LICENSE)
