/*
 * Copyright (c) 2011-2015 Chris McCormick, Sébastien Piquemal <sebpiq@gmail.com>, Jacob Stern <jacob.stern@outlook.com>
 *
 *  This file is part of WebPd. See https://github.com/sebpiq/WebPd for documentation
 *
 *  WebPd is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  WebPd is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with WebPd.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
var _ = require('underscore')
  , utils = require('./core/utils')
  , mixins = require('./core/mixins')
  , PdObject = require('./core/PdObject')
  , pdGlob = require('./global')
  , portlets = require('./waa/portlets')

exports.declareObjects = function(library) {

  library['notein'] = PdObject.extend({

    type: 'notein',

    inletDefs: [],

    outletDefs: [portlets.Outlet, portlets.Outlet, portlets.Outlet],

    init: function(args) {
      this._eventReceiver = new mixins.EventReceiver()
      this._eventReceiver.on(pdGlob.emitter, 'midiMessage', this._onMidiMessage.bind(this))
      this._channel = args[0]
    },

    _onMidiMessage: function(midiMessage) {
      var data = midiMessage.data
        , event = data[0] >> 4
      // Respond to note on and note off events
      if (event === 8 || event === 9) {
        var channel = (data[0] & 0x0F) + 1
          , note = data[1]
          , velocity = data[2]
        if (typeof this._channel === 'number') {
          if (channel === this._channel) {
            this.o(1).message([velocity])
            this.o(0).message([note])
          }
        } else {
          this.o(2).message([channel])
          this.o(1).message([velocity])
          this.o(0).message([note])
        }
      }
    }
  }),

  library['poly'] = PdObject.extend({

      type: 'poly',

      inletDefs: [
        portlets.Inlet.extend({
          message: function(args) {
            var val = args[0]
            if (!_.isNumber(val))
              return console.error('invalid [poly] value: ' + val)
            this.obj._onFloat(val)
          }

          // TODO: Handle "Stop" message
        }),

        portlets.Inlet.extend({
          message: function(args) {
            var val = args[0]
            if (!_.isNumber(val))
              return console.error('invalid [poly] value: ' + val)
            this.obj._vel = val
          }
        })
      ],

      outletDefs: [portlets.Outlet, portlets.Outlet, portlets.Outlet],

      init: function(args) {
        this._n = args[0] >= 1 ? args[0] : 1
        this._steal = args[1] === 1
        this._vec = []
        this._vel = 0
        this._serial = 0
        for (var i = 0; i < this._n; i++) {
          this._vec.push({
            pitch: 0,
            used: false,
            serial: 0
          })
        }
      },

      _onFloat: function(val) {
        // Translated from https://github.com/pure-data/pure-data/blob/master/src/x_midi.c
        var firstOn = null
          , firstOff = null
          , onIndex = 0
          , offIndex = 0
        if (this._vel > 0) {
          var serialOn = Number.MAX_VALUE
            , serialOff = Number.MAX_VALUE
          this._vec.forEach(function(v, i) {
            if (v.used && v.serial < serialOn) {
              firstOn = v;
              serialOn = v.serial;
              onIndex = i;
            } else if (!v.used && v.serial < serialOff) {
              firstOff = v;
              serialOff = v.serial;
              offIndex = i;
            }
          })
          if (firstOff) {
            this.o(2).message([this._vel])
            this.o(1).message([val])
            this.o(0).message([offIndex + 1])
            firstOff.pitch = val
            firstOff.used = true
            firstOff.serial = this._serial++
          } else if (firstOn && this._steal) {
            // If no available voice, steal one
            this.o(2).message([0])
            this.o(1).message([firstOn.pitch])
            this.o(0).message([onIndex + 1])
            this.o(2).message([this._vel])
            this.o(1).message([val])
            this.o(0).message([onIndex + 1])
            firstOn.pitch = val
            firstOn.serial = this._serial++
          }
        } else {
          // Note off, turn off oldest match
          var serialOn = Number.MAX_VALUE
          this._vec.forEach(function(v, i) {
            if (v.used && v.pitch === val && v.serial < serialOn) {
              firstOn = v
              serialOn = v.serial
              onIndex = i
            }
          })
          if (firstOn) {
            firstOn.used = 0
            firstOn.serial = this._serial++
            this.o(2).message([0])
            this.o(1).message([firstOn.pitch])
            this.o(0).message([onIndex + 1])
          }
        }
      }
  })
}