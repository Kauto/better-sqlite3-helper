# better-sqlite3-helper

A wrapper library for the work with [better-sqlite3](https://www.npmjs.com/package/better-sqlite3/) ("The fastest and simplest library for SQLite3 in Node.js"). It's intended for simple apps and offer some new functions and a migration-system.

## One global instance
A normal, simple application is mostly working with only one database. To make the class managment more easy, this library does the access-control for you - mainly as a singleton.

The database loads lazy. Only when it's used for the first time, the database is read from the file, the migration is started and the journal-mode WAL is set. The default directory of the database is `'./data/sqlite3.db'`. 

If you want to change the default-values, you can do this by calling the library once in the beginning and thus setting it up:
##### index.js
  ```js
  const DB = require('better-sqlite3-helper');

  // with the call the global instance is created
  DB({
    path: './data/sqlite3.db', // this is the default
    memory: false, // create a db only in memory
    readonly: false, // read only
    fileMustExist: false, // throw error if database not exists
    WAL: true, // automatically enable 'PRAGMA journal_mode = WAL'
    migrate: {  // disable completely by setting `migrate: false`
      force: false, // 'last' to automatically reapply the last migration-file
      table: 'migration' // name of the database table that is used to keep track
      migrationsPath: './migrations' // path of the migration-files
    }
  })
  ```

Then use the library without parameter:
##### anotherAPIFile.js
  ```js
  const DB = require('better-sqlite3-helper');

  // a second call directly returns the global instance
  let row = DB().queryFirstRow('SELECT * FROM users WHERE id=?', userId);
  console.log(row.firstName, row.lastName, row.email);
  ```

## New Functions
This class implements shorthand methods for common scenarios.

```js
// shorthand for db.prepare('SELECT * FROM users').all(); 
let allUsers = DB().query('SELECT * FROM users');
// shorthand for db.prepare('SELECT * FROM users WHERE id=?').get(userId); 
let row = DB().queryFirstRow('SELECT * FROM users WHERE id=?', userId);
// shorthand for db.prepare('SELECT * FROM users WHERE id=?').pluck(true).get(userId); 
let email = DB().queryFirstCell('SELECT email FROM users WHERE id=?', userId);
// shorthand for db.prepare('SELECT * FROM users').all().map((e)=>e.email); 
let emails = DB().queryColumn('email', 'SELECT email FROM users');
// shorthand for db.prepare('SELECT * FROM users').all().reduce((o, e) => {o[e.lastName] = e.email; return o;}, {});
let emailsByLastName = DB().queryKeyAndColumn('lastName', 'email', 'SELECT lastName, name FROM users');
```

## Insert, Update and Replace

There are shorthands for `update`, `insert` and `replace`. They are intended to make programming of CRUD-Rest-API-functions easier. With a `blacklist` or a `whitelist` it's even possible to send a request's query (or body) directly into the database.

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

## Migrations

The migration in this library mimics the migration system of the excellent [sqlite](https://www.npmjs.com/package/sqlite) by Kriasoft. 

To use this feature you have to create a `migrations`-directory in your root. Inside you create `sql`-files that are seperated in a up- and a down-part:

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

## More Documentation of better-sqlite3

- [API documentation](https://github.com/JoshuaWise/better-sqlite3/wiki/API)

## License

[MIT](https://github.com/JoshuaWise/better-sqlite3/blob/master/LICENSE)