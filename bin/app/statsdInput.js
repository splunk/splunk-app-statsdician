var splunkjs        = require("splunk-sdk");
var ModularInputs   = splunkjs.ModularInputs;
var Logger          = ModularInputs.Logger;
var Event           = ModularInputs.Event;
var Scheme          = ModularInputs.Scheme;
var Argument        = ModularInputs.Argument;
var backend = require('./eventWriterBackend');
var fs = require('fs');
var path = require('path');

exports.getScheme = function() {
    var scheme = new Scheme("Statstician");
    scheme.description = "Collects metrics from StatsD";
    scheme.useExternalValidation = true;
    scheme.useSingleInstance = true;

    scheme.args = [
        new Argument ({
            name: "port",
            dataType: Argument.dataTypeNumber,
            description: "Port for StatsD to listen on",
            requiredOnCreate: true,
            requiredOnEdit: true
        })
    ];
    return scheme;
}

exports.validateInput = function(definition, done) {
    var port = definition.parameters.port;
    var config = fs.readFileSync(path.join(__dirname, 'statsdConfig.js'), 'utf8');
    var re = /\{\r*\n*\s*port:\s*(\d{3}\d+)/;
    var matches = config.match(re);
    config = config.replace(matches[1], port);
    fs.writeFileSync(path.join(__dirname, 'statsdConfig.js'), config);
    done();
}

exports.streamEvents = function(name, singleInput, eventWriter, done) {
    //pass in the writer to the backend
    backend.setEventWriter(eventWriter);
    process.argv[2] = path.join(__dirname, './statsdConfig.js');
    //start StatsD
    var statsd = require(path.join(__dirname, 'node_modules/statsd/stats.js'));
}
