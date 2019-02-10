const { describe, it, afterEach } = require('mocha')
const { expect } = require('chai')
const DB = require('../src/database')
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path').path
let db = null

describe('Database Insert', function () {
  afterEach(() => {
    db && db.close()
    db = null
    try {
      fs.unlinkSync(path.resolve(appRoot, './data/sqlite3.db'))
      fs.rmdirSync(path.resolve(appRoot, './data'))
    } catch (e) {}
  })

  it('can insert one line', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.insert('Setting', {
      key: 'test2',
      value: '1234',
      type: 0
    })).to.be.equal(3)
  })

  it('can insert more than one line', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.insert('Setting', [{
      key: 'test2',
      value: '1234',
      type: 0
    }, {
      key: 'test3',
      value: '12345',
      type: 0
    }])).to.be.equal(4)

    expect(db.queryFirstCell('SELECT COUNT(1) FROM Setting WHERE key IN (?,?)', 'test2', 'test3')).to.be.equal(2)
  })

  it('can insert with whitelist', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.insert('Setting', [{
      key: 'test2',
      value: '1234',
      type: 0
    }, {
      key: 'test3',
      value: '12345',
      type: 0
    }], ['key'])).to.be.equal(4)

    // eslint-disable-next-line no-unused-expressions
    expect(db.queryFirstCell('SELECT value FROM Setting WHERE key = ?', 'test2')).to.be.null
  })

  it('can insert with blacklist', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.insertWithBlackList('Setting', [{
      key: 'test2',
      value: '1234',
      type: 1
    }, {
      key: 'test3',
      value: '12345',
      type: 0
    }], ['type'])).to.be.equal(4)
    expect(db.queryFirstCell('SELECT type FROM Setting WHERE key = ?', 'test2')).to.equal(0)
  })

  it('can insert one line with replace', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.replace('Setting', {
      key: 'test2',
      value: '12349',
      type: 0
    })).to.be.equal(3)
  })

  it('replace will return new ID if it overwrites', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.replace('Setting', {
      key: 'test',
      value: 'new value',
      type: 0
    })).to.be.equal(3)
    expect(db.replace('Setting', {
      key: 'test',
      value: 'new value',
      type: 0
    })).to.be.equal(4)
  })
})
