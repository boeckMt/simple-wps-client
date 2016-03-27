"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var Jsonix = require('jsonix').Jsonix;
var XLink_1_0 = require('w3c-schemas').XLink_1_0;
var OWS_1_1_0 = require('ogc-schemas').OWS_1_1_0;
var WPS_1_0_0 = require('ogc-schemas').WPS_1_0_0;
var JsonixApi = (function () {
    function JsonixApi(jsonix, contexts) {
        var context = new jsonix.Context(contexts);
        this.marshaller = context.createMarshaller();
        this.unmarshaller = context.createUnmarshaller();
    }
    JsonixApi.prototype.sendResponseBack = function (req, res) {
        if (req.body.json) {
            res.send(req.body.json);
        }
    };
    JsonixApi.prototype.forwardPostRequest = function (req, res, next) {
        if (req.query && req.query.url) {
            var url = decodeURIComponent(req.query.url);
            var email = req.body.email;
            var executeBody = req.body.executeBody;
            console.log(url);
            request({ uri: 'http://schemas.opengis.net/wps/1.0.0/examples/62_wpsExecute_response.xml' }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    req.body.xml = response.body;
                    delete req.body.executeBody;
                    next();
                }
            });
        }
        else {
            var err = new Error("no url in the post body");
            this.error(err, req, res, next);
        }
    };
    JsonixApi.prototype.forwardGetRequest = function (req, res, next) {
        if (req.query && req.query.url) {
            var url = decodeURIComponent(req.query.url);
            console.log(url);
            request({ uri: url }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    req.body.xml = response.body;
                    next();
                }
            });
        }
        else {
            var err = new Error("no query param url");
            this.error(err, req, res, next);
        }
    };
    JsonixApi.prototype.xml2json = function (req, res, next) {
        var bodyXml = req.body.xml;
        req.body.json = this.unmarshaller.unmarshalString(bodyXml);
        next();
    };
    JsonixApi.prototype.json2xml = function (req, res, next) {
        var bodyJson = req.body.executeBody;
        req.body.xml = this.marshaller.marshalString(bodyJson);
        next();
    };
    JsonixApi.prototype.checkEmail = function (req, res, next) {
        if (req.body.email && req.body.json.value.statusLocation) {
            var email = req.body.email;
            var statusLocation = "https://swapi.co/api/people/1/";
            console.log(email + " - " + statusLocation);
            this.pollStatus(statusLocation, email);
            res.send({ email: email, statusLocation: statusLocation });
        }
        else {
            next();
        }
    };
    JsonixApi.prototype.pollStatus = function (statusLocation, email) {
        var _this = this;
        this.pollinterval = setInterval(function () {
            _this.requestStatus(statusLocation, email);
        }, 1500);
    };
    JsonixApi.prototype.stopPolling = function () {
        clearInterval(this.pollinterval);
    };
    JsonixApi.prototype.requestStatus = function (statusLocation, email) {
        var _this = this;
        request({ uri: statusLocation }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var json = JSON.parse(body);
                if (json.name == 'Luke Skywalker') {
                    console.log(json.name);
                    _this.stopPolling();
                    _this.sendEmail();
                }
            }
        });
    };
    JsonixApi.prototype.sendEmail = function () {
    };
    JsonixApi.prototype.error = function (err, req, res, next) {
        res.status(500).send({ error: err.message });
    };
    return JsonixApi;
}());
exports.JsonixApi = JsonixApi;
var api = new JsonixApi(Jsonix, [XLink_1_0, OWS_1_1_0, WPS_1_0_0]);
app.use(express.static('./src'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.route('/WPS/GetCapabilities*').get(function (req, res, next) {
    api.forwardGetRequest(req, res, next);
}, function (req, res, next) {
    api.xml2json(req, res, next);
}, function (req, res) {
    api.sendResponseBack(req, res);
});
app.route('/WPS/DescribeProcess*').get(function (req, res, next) {
    api.forwardGetRequest(req, res, next);
}, function (req, res, next) {
    api.xml2json(req, res, next);
}, function (req, res) {
    api.sendResponseBack(req, res);
});
app.route('/WPS/Execute*').post(function (req, res, next) {
    api.forwardPostRequest(req, res, next);
}, function (req, res, next) {
    api.xml2json(req, res, next);
}, function (req, res, next) {
    api.checkEmail(req, res, next);
}, function (req, res) {
    api.sendResponseBack(req, res);
});
app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
