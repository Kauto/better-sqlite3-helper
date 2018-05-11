const {describe, it, afterEach} = require('mocha')
const {expect} = require('chai')
const DB = require('../src/database')
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path').path
let db = null

describe('Database Update', function () {
  afterEach(() => {
    db && db.close()
    db = null
    try {
      fs.unlinkSync(path.resolve(appRoot, './data/sqlite3.db'))
      fs.rmdirSync(path.resolve(appRoot, './data'))
    } catch (e) {}
  })

  it('can update with object as where', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.update('Setting', {
      value: '1234'
    }, {
      key: 'test',
      value: 'now'
    })).to.be.equal(1)
  })

  it('can update with array as where', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.update('Setting', {
      key: 'test2',
      value: '1234'
    }, ['`key` = ? AND `value` = ?', 'test', 'now'])).to.be.equal(1)

    expect(db.queryFirstCell('SELECT COUNT(1) FROM Setting WHERE key = ?', 'test2')).to.be.equal(1)
  })

  it('can update with whitelist', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.update('Setting', {
      key: 'test2',
      value: '1234'
    }, ['`key` = ? AND `value` = ?', 'test', 'now'], ['key'])).to.be.equal(1)

    // eslint-disable-next-line no-unused-expressions
    expect(db.queryFirstCell('SELECT value FROM Setting WHERE key = ?', 'test2')).to.be.equal('now')
  })

  it('can update with blacklist', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.updateWithBlackList('Setting', {
      key: 'test2',
      value: '1234'
    }, ['`key` = ? AND `value` = ?', 'test', 'now'], ['key', 'fasdasd'])).to.be.equal(1)

    expect(db.queryFirstCell('SELECT value FROM Setting WHERE key = ?', 'test')).to.equal('1234')
  })
})
