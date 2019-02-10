/* eslint-disable no-unused-expressions */
const { describe, it, afterEach } = require('mocha')
const { expect } = require('chai')
const DB = require('../src/database')
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path').path
let db = null

describe('Function proxy', function () {
  afterEach(() => {
    db && db.close()
    db = null
    try {
      fs.unlinkSync(path.resolve(appRoot, './data/sqlite3.db'))
      fs.rmdirSync(path.resolve(appRoot, './data'))
    } catch (e) {}
  })

  it('should proxy function "prepare"', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      },
      memory: true
    })
    expect(db.prepare('SELECT * FROM Setting').all()).to.be.an('array')
  })

  it('should proxy function "transaction"', function () {
    db = new DB({
      migrate: false,
      memory: true
    })
    const trans = db.transaction(() => expect(db.inTransaction).to.be.true)
    trans()
    trans.deferred()
    trans.immediate()
    trans.exclusive()
  })

  it('should proxy function "pragma"', function () {
    db = new DB({
      migrate: false,
      memory: true
    })
    db.pragma('cache_size = 32000')
    expect(db.pragma('cache_size', { simple: true })).to.equal(32000)
  })

  it('should proxy function "checkpoint"', function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    expect(db.checkpoint()).to.deep.equal(db)
  })

  it('should proxy property "backup"', async function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      }
    })
    const filename = path.resolve(appRoot, './data/test_backup.db')
    await db.backup(filename)
    expect(fs.existsSync(filename)).to.be.true
    fs.unlinkSync(filename)
  })

  it('should proxy property "function"', async function () {
    db = new DB({
      migrate: false,
      memory: true
    })
    expect(db.function('add2', { deterministic: true, varargs: false }, (a, b) => a + b)).to.deep.equal(db)
    expect(db.queryFirstCell('SELECT add2(2, 17)')).to.equal(19)
  })

  it('should proxy property "aggregate"', async function () {
    db = new DB({
      migrate: {
        migrationsPath: './test/migrations'
      },
      memory: true
    })
    expect(db.aggregate('getAverage', {
      start: () => [],
      step: (array, nextValue) => {
        array.push(nextValue)
      },
      result: array => array.reduce((previousValue, currentValue) => previousValue + currentValue, 0) / array.length
    })).to.deep.equal(db)
    expect(db.queryFirstCell('SELECT getAverage(type) FROM Setting')).to.equal(3)
  })
})
