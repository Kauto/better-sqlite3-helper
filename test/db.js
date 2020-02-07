const { describe, it, afterEach } = require('mocha')
const { expect } = require('chai')
const DB = require('../src/database')
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path').path
let db = null

describe('Database Basics', function () {
  afterEach(() => {
    db && db.close()
    db = null
    try {
      fs.unlinkSync(path.resolve(appRoot, './data/sqlite3.db'))
      fs.rmdirSync(path.resolve(appRoot, './data'))
    } catch (e) {}
  })

  it('should create a sqlite3.db-file', function () {
    db = new DB({
      migrate: false
    })
    db.connection()
    db.close()
    const result = fs.existsSync(path.resolve(appRoot, './data/sqlite3.db'))
    // eslint-disable-next-line no-unused-expressions
    expect(result).to.be.true
  })

  it('should exec queries with exec', function () {
    db = new DB({
      migrate: false
    })
    // eslint-disable-next-line no-unused-expressions
    expect(db.exec('SELECT 1')).to.not.throw
  })

  it('should return all rows with query', function () {
    db = new DB({
      migrate: false
    })
    expect(db.query('SELECT ? as `1` UNION SELECT ? as `1`', 1, 2)).to.deep.equal([{ 1: 1 }, { 1: 2 }])
  })

  it('should return first row with queryFirstRow', function () {
    db = new DB({
      migrate: false
    })
    expect(db.queryFirstRow('SELECT ? as `1` UNION SELECT ? as `1`', 1, 2)).to.deep.equal({ 1: 1 })
    expect(db.queryFirstRow('SELECT 1 WHERE 1 = 2')).to.equal(undefined)
  })

  it('should return undefined with queryFirstRow for no result', function () {
    db = new DB({
      migrate: false
    })
    expect(db.queryFirstRow('SELECT 1 WHERE 1 = 2')).to.equal(undefined)
  })

  it('should return empty object with queryFirstRowObject for no result', function () {
    db = new DB({
      migrate: false
    })
    expect(db.queryFirstRowObject('SELECT 1 WHERE 1 = 2')).to.deep.equal({})
  })

  it('should return first cell with queryFirstCell', function () {
    db = new DB({
      migrate: false
    })
    expect(db.queryFirstCell('SELECT ?', 1)).to.equal(1)
  })

  it('should return undefined when queryFirstCell does not hit', function () {
    db = new DB({
      migrate: false
    })
    // eslint-disable-next-line no-unused-expressions
    expect(db.queryFirstCell('SELECT 1 WHERE 1=0')).to.be.undefined
  })

  it('should migrate files', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.queryFirstCell('SELECT `value` FROM Setting WHERE `key` = ?', 'test')).to.be.equal('now')
  })

  it('should migrate array', function () {
    db = new DB({
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
    expect(db.queryFirstCell('SELECT `value` FROM Setting WHERE `key` = ?', 'test')).to.be.equal('now')
  })
})
