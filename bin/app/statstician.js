var splunkjs        = require("splunk-sdk");
var ModularInputs   = splunkjs.ModularInputs;
var input = require('./statsdInput.js');
ModularInputs.execute(input, module);

