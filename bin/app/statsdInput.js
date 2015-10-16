var splunkjs        = require("splunk-sdk");
var ModularInputs   = splunkjs.ModularInputs;
var Logger          = ModularInputs.Logger;
var Event           = ModularInputs.Event;
var Scheme          = ModularInputs.Scheme;
var Argument        = ModularInputs.Argument;
var backend = require('./eventCollectorBackend');
var fs = require('fs');
var path = require('path');

exports.getScheme = function() {
    var scheme = new Scheme("Statsdician");
    scheme.description = "Collects metrics from StatsD";
    scheme.useExternalValidation = true;
    scheme.useSingleInstance = true;

    scheme.args = [
        new Argument ({
            name: "statsd_port",
            dataType: Argument.dataTypeNumber,
            description: "Port for StatsD to receive data on (default: 8125)",
            requiredOnCreate: false,
            requiredOnEdit: false
        }),
        new Argument ({
            name: "mgmt_port",
            dataType: Argument.dataTypeNumber,
            description: "Port for StatsD Management (default: 8126)",
            requiredOnCreate: false,
            requiredOnEdit: false
        }),
        new Argument ({
            name: "hec_port",
            dataType: Argument.dataTypeNumber,
            description: "Port for HTTP Event Collector (default: 8088)",
            requiredOnCreate: false,
            requiredOnEdit: false
        }),
        new Argument ({
            name: "hec_ssl",
            dataType: Argument.dataTypeBoolean,
            description: "Enable SSL for HEC?",
            requiredOnCreate: false,
            requiredOnEdit: false
        }),
        new Argument ({
            name: "hec_token",
            dataType: Argument.dataTypeNumber,
            description: "Token for HTTP Event Collector",
            requiredOnCreate: true,
            requiredOnEdit: true
        }),
        new Argument ({
            name: "hec_event_per_metric",
            dataType: Argument.dataTypeBoolean,
            description: "Create events per metric OR per flush",
            requiredOnCreate: false,
            requiredOnEdit: false
        })
    ];
    return scheme;
}

exports.validateInput = function(definition, done) {
    var port = definition.parameters.statsd_port;
    var mgmt_port = definition.parameters.mgmt_port;

    var config = fs.readFileSync(path.join(__dirname, 'statsdConfig.js'), 'utf8');
    
    var rePorts = /\{\r*\n*\s*port:\s*(\d+).+\r*\n*.+mgmt_port:\s(\d+)/;
    var matches = config.match(rePorts);

    if (port === "") {
        port = "8125"
    }

    if (mgmt_port === "") {
        mgmt_port = "8126"
    }

    config = config.replace(matches[1], port);
    config = config.replace(matches[2], mgmt_port);

    fs.writeFileSync(path.join(__dirname, 'statsdConfig.js'), config);
    done();
}

exports.streamEvents = function(name, singleInput, eventWriter, done) {
    //pass in the writer to the backend
    var hec_port = singleInput.hec_port;
    var hec_ssl = singleInput.hec_ssl == 1 ? true : false;
    var hec_token = singleInput.hec_token;
    var hec_event_per_metric = singleInput.hec_event_per_metric;

    backend.configure(name, hec_port, hec_ssl, hec_token, hec_event_per_metric);
    process.argv[2] = path.join(__dirname, '/statsdConfig.js');
    //start StatsD
    var statsd = require(path.join(__dirname, 'node_modules/statsd/stats.js'));
}
