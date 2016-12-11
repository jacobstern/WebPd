var _ = require('underscore')
  , waatest = require('waatest')
  , async = require('async')
  , assert = require('assert')
  , helpers = require('../../helpers')

describe('dsp.throw~/catch~', function() {

  afterEach(helpers.afterEach)

  it('should output nothing by default', function(done) {
    var patch = Pd.createPatch()
      , catchObj = patch.createObject('catch~')
      , dac = patch.createObject('dac~')

    catchObj.o(0).connect(dac.i(0))

    helpers.expectSamples(function() {}, [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ], done)
  })

  it('should throw if duplicate names are used', function() {
    var patch = Pd.createPatch()
      , catchObj = patch.createObject('catch~', ['foo'])

    assert.throws(function() {
      patch.createObject('catch~', ['foo'])
    })
  })

  it('should send an audio signal from [throw~] to [catch~]', function(done) {
      var patch = Pd.createPatch()
      , throwObj = patch.createObject('throw~')
      , catchObj = patch.createObject('catch~')
      , sig = patch.createObject('sig~', [11])
      , dac = patch.createObject('dac~')

      sig.o(0).connect(throwObj.i(0))
      catchObj.o(0).connect(dac.i(0))

      helpers.expectSamples(function() {}, [
        [11, 11, 11, 11, 11],
        [0, 0, 0, 0, 0]
      ], done)
  })
})
