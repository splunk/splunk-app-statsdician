statsdician
===========

Collect statsd metrics directly in Splunk!

## Overview
statsdician opens a statsd endpoint on Splunk which feeds events directly into Splunk using the new [HTTP Event Collector](http://dev.splunk.com/view/event-collector/SP-CAAAE6M) in Splunk 6.3.

statsdician can run on any Event Collector instance i.e. Forwarder, Indexer, etc.

statsdician sends events to Splunk as JSON objects thus allowing them to be easily queried using SPL. There are no props.conf changes required!

## Installing 
* Clone this repo
* In the ./splunk-app-statsdician/bin/app folder run `npm install`
* Copy ./splunk-app-statsdician to your %SPLUNK_HOME%/etc/apps folder. 
* Restart splunk

## Configuring
* Enable HTTP Event Collector on your Splunk instance and create a token. See [here](http://docs.splunk.com/Documentation/Splunk/6.3.0/Data/UsetheHTTPEventCollector).
* Copy the Token Value to the clipboard.
* From the menu go to Settings->Data Inputs->statsdician->Add New. Specify the `name` and paste the token into the `hec_token` field. All other fields are optional / can be changed if the defaults are not acceptable.
* Save the input. One it is saved, you will have a statsd port opened on the statsd_port specified when you configured the token.


