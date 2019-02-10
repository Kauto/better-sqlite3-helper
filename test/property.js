/* eslint-disable no-unused-expressions */
const { describe, it, afterEach } = require('mocha')
const { expect } = require('chai')
const DB = require('../src/database')
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path').path
let db = null

describe('Properties proxy', function () {
  afterEach(() => {
    db && db.close()
    db = null
    try {
      fs.unlinkSync(path.resolve(appRoot, './data/sqlite3.db'))
      fs.rmdirSync(path.resolve(appRoot, './data'))
    } catch (e) {}
  })

  it('should proxy property "open"', function () {
    db = new DB({
      migrate: false,
      memory: true
    })
    expect(db.open).to.equal(true)
  })

  it('should proxy property "name"', function () {
    db = new DB({
      migrate: false,
      memory: true
    })
    expect(db.name).to.be.ok
  })

  it('should proxy property "memory"', function () {
    db = new DB({
      migrate: false,
      memory: false
    })
    expect(db.memory).to.be.false
    db.close()
    db = new DB({
      migrate: false,
      memory: true
    })
    expect(db.memory).to.be.true
  })

  it('should proxy property "readonly"', function () {
    db = new DB({
      migrate: false,
      readonly: false
    })
    expect(db.readonly).to.be.false
    db.close()
    db = new DB({
      migrate: false,
      readonly: true
    })
    expect(db.readonly).to.be.true
  })

  it('should proxy property "inTransaction"', function () {
    db = new DB({
      migrate: false,
      memory: true
    })
    expect(db.inTransaction).to.be.false
    db.close()
    db = new DB({
      migrate: false,
      memory: true
    })
    db.transaction(() => expect(db.inTransaction).to.be.true)()
  })
})
