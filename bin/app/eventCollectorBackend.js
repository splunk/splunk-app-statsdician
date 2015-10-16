/*jshint node:true, laxcomma:true */

var util = require('util');
var logging = require("splunk-logging");
var Logger = logging.Logger;
var utils = logging.utils;

var _hec_logger = null;
var _hec_event_per_metric = null;
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

function sendMetrics(type, metrics) {
  for (var key in metrics) {
    if(metrics.hasOwnProperty(key)) {
      var payload = {"message": "type=" + type + " " + key + "=" + metrics[key]};
      _hec_logger.send(payload);
    }
  }
}

EventCollectorBackend.prototype.flush = function(timestamp, metrics) {
  if (_hec_logger != undefined) {
    var time = new Date(timestamp * 1000);
    var out = null;

    if (_hec_event_per_metric) {
      sendMetrics("counter", metrics.counters);
      sendMetrics("timer", metrics.timers);
      sendMetrics("gauge", metrics.gauges);
      sendMetrics("timer_data", metrics.timer_data);
      sendMetrics("counter_rate", metrics.counter_rates);
      sendMetrics("set", function (vals) {
          var ret = {};
          for (var val in vals) {
            ret[val] = vals[val].values();
          }
          return ret;
        }(metrics.sets));
      _hec_logger.flush(function(err, resp, body) {
        // If successful, body will be { text: 'Success', code: 0 }
        if (err != undefined) {
          throw err;
        }
      });
    }
    else {
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
  }
};

exports.init = function(startupTime, config, events) {
  var instance = new EventCollectorBackend(startupTime, config, events);
  return true;
};

exports.configure = function(name, hec_port, hec_ssl, hec_token, hec_event_per_metric) {
  _name = name;
  _hec_event_per_metric = hec_event_per_metric;
  
  var scheme = (hec_ssl == true) ? "https" : "http";

  var config = {
    token: hec_token,
    url: scheme + "://localhost:" + hec_port,
    autoFlush: false
  };

  _hec_logger = new Logger(config);
  
  if (hec_event_per_metric) {
    _hec_logger._makeBody = function(context) {
      if (!context) {
          throw new Error("Context parameter is required.");
      }

      var body = this._initializeMetadata(context);
      var time = utils.formatTime(body.time || Date.now());
      body.time = time.toString();
      body.event = context.message;          
      return body;
    }
  }
}
