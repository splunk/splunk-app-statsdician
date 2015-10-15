/*jshint node:true, laxcomma:true */

var util = require('util');
var Logger = require("splunk-logging").Logger;

var _hec_logger = null;
var _logger = null;
var _writer = null;
var _name = null;

function EventCollectorBackend(startupTime, config, emitter){
  var self = this;
  self.lastFlush = startupTime;
  self.lastException = startupTime;
  self.config = config.console || {};

  // attach
  emitter.on('flush', function(timestamp, metrics) { 
    self.flush(timestamp, metrics); 
  });
}

EventCollectorBackend.prototype.flush = function(timestamp, metrics) {
  if (_hec_logger != undefined) {
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
    var payload = {"message":out};
    _hec_logger.send(payload, function(err, resp, body) {
      // If successful, body will be { text: 'Success', code: 0 }
      if (err != undefined) {
        throw err;
      }
    });
  }
};

exports.init = function(startupTime, config, events) {
  var instance = new EventCollectorBackend(startupTime, config, events);
  return true;
};

exports.configure = function(name, hec_port, hec_ssl, hec_token) {
  _name = name;
  
  var scheme = (hec_ssl == true) ? "https" : "http";

  var config = {
    token: hec_token,
    url: scheme + "://localhost:" + hec_port,
    autoFlush: true
  };

  _hec_logger = new Logger(config);
}
