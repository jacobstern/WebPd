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

  it('should add a float value and a signal', function(done) {
      var patch = Pd.createPatch()
      , throwSignal = patch.createObject('throw~')
      , throwFloat = patch.createObject('throw~')
      , catchObj = patch.createObject('catch~')
      , sig = patch.createObject('sig~', [11])
      , dac = patch.createObject('dac~')

      sig.o(0).connect(throwSignal.i(0))
      throwFloat.i(0).message([5])
      catchObj.o(0).connect(dac.i(0))

      helpers.expectSamples(function() {}, [
        [16, 16, 16, 16, 16],
        [0, 0, 0, 0, 0]
      ], done)
  })

  it('should add two audio signals', function(done) {
    var patch = Pd.createPatch()
      , throw1 = patch.createObject('throw~')
      , throw2 = patch.createObject('throw~')
      , catchObj = patch.createObject('catch~')
      , sig1 = patch.createObject('sig~', [16])
      , sig2 = patch.createObject('sig~', [14])
      , dac = patch.createObject('dac~')
      , expected = waatest.utils.makeBlock(2, 5, [30, 0])

    sig1.o(0).connect(throw1.i(0))
    sig2.o(0).connect(throw2.i(0))
    catchObj.o(0).connect(dac.i(0))

    helpers.expectSamples(function() {}, expected, done)
  })
})

