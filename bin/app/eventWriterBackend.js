/*jshint node:true, laxcomma:true */

var util = require('util');
var splunkjs        = require("splunk-sdk");
var ModularInputs   = splunkjs.ModularInputs;
var Event           = ModularInputs.Event;

function EventWriterBackend(startupTime, config, emitter){
  var self = this;
  this.lastFlush = startupTime;
  this.lastException = startupTime;
  this.config = config.console || {};

  // attach
  emitter.on('flush', function(timestamp, metrics) { self.flush(timestamp, metrics); });
}

EventWriterBackend.prototype.flush = function(timestamp, metrics) {
  var time = new Date(timestamp * 1000);
  var out = {
    counters: metrics.counters,
    timers: metrics.timers,
    gauges: metrics.gauges,
    timer_data: metrics.timer_data,
    counter_rates: metrics.counter_rates,
    sets: function (vals) {
      var ret = {};
      for (var val in vals) {
        ret[val] = vals[val].values();
      }
      return ret;
    }(metrics.sets),
    pctThreshold: metrics.pctThreshold
  };

  var event = new Event ({
    source: "statsdician",
    time: time
  });

  if(this.config.prettyprint) {
    event.data = JSON.stringify(util.inspect(out, false, 5, true));
  } else {
    event.data = JSON.stringify(out);
  }

  writer.writeEvent(event);

};

exports.init = function(startupTime, config, events) {
  var instance = new EventWriterBackend(startupTime, config, events);
  return true;
};

var writer;

exports.setEventWriter = function(eventWriter) {
  writer = eventWriter;  
}
