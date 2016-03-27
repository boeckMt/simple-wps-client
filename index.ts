/// <reference path="./typings/express/express.d.ts"/>

declare var require;

var express = require('express');
var bodyParser = require('body-parser')
var request = require('request');
var app = express();

var Jsonix = require('jsonix').Jsonix;
var XLink_1_0 = require('w3c-schemas').XLink_1_0;
var OWS_1_1_0 = require('ogc-schemas').OWS_1_1_0;
var WPS_1_0_0 = require('ogc-schemas').WPS_1_0_0;

/*
unmarshaller.unmarshalFile("tests/WPS/1.0.0/execute-01.xml", (result) =>{

});
*/

export class JsonixApi {
  jsonix: any
  context: any;
  marshaller: any;
  unmarshaller: any;
  pollinterval: any;

  constructor(jsonix, contexts: Array<any>) {
    var context = new jsonix.Context(contexts);
    this.marshaller = context.createMarshaller();
    this.unmarshaller = context.createUnmarshaller();
  }

  sendResponseBack(req, res) {
    /*
        if (req.body.xml) {
          res.send(req.body.xml)
        }
    */
    if (req.body.json) {
      res.send(req.body.json)
    }
    //res.json(req.body.x2j);
  }

  forwardPostRequest(req, res, next) {
    if (req.query && req.query.url) {
      let url = decodeURIComponent(req.query.url)
      let email = req.body.email;
      let executeBody = req.body.executeBody;
      console.log(url)
      //make post
      /*
            request(options, (error, response, body) => {
              if (!error && response.statusCode == 200) {

              }
            })
      */
      //mock--------------------------------------
      request({ uri: 'http://schemas.opengis.net/wps/1.0.0/examples/62_wpsExecute_response.xml' }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          req.body.xml = response.body;
          //req.body.email;
          //clear not used
          delete req.body.executeBody;
          next();
        }
      });

      /*POST
            request({ uri: url }, (error, response, body) => {
              if (!error && response.statusCode == 200) {
                req.body.xml = response.body;
                next();
              }
            });
      */


    } else {
      let err = new Error("no url in the post body")
      this.error(err, req, res, next)
    }
  }

  forwardGetRequest(req, res, next) {
    if (req.query && req.query.url) {
      let url = decodeURIComponent(req.query.url)
      console.log(url)
      request({ uri: url }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          req.body.xml = response.body;
          next();
        }
      });
    } else {
      let err = new Error("no query param url")
      this.error(err, req, res, next)
    }
  }

  xml2json(req, res, next) {
    var bodyXml = req.body.xml;
    req.body.json = this.unmarshaller.unmarshalString(bodyXml);
    //delete req.body.xml;
    next();
  }

  json2xml(req, res, next) {
    var bodyJson = req.body.executeBody;
    req.body.xml = this.marshaller.marshalString(bodyJson)
    //delete req.body.executeBody;
    next();
  }

  checkEmail(req, res, next) {
    //hanlde errors !!!!! TODO
    if (req.body.email && req.body.json.value.statusLocation) {
      let email = req.body.email;
      let statusLocation = `https://swapi.co/api/people/1/` //req.body.json.value.statusLocation
      console.log(`${email} - ${statusLocation}`)
      this.pollStatus(statusLocation, email);
      //next();
      res.send({ email: email, statusLocation: statusLocation })
    } else {
      next();
    }

  }

  pollStatus(statusLocation, email) {
    this.pollinterval = setInterval(() => {
      this.requestStatus(statusLocation, email);
    }, 1500);


    //sendEmail()
  }

  stopPolling() {
    clearInterval(this.pollinterval);
  }

  requestStatus(statusLocation, email) {
    request({ uri: statusLocation }, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        let json = JSON.parse(body);

        //TODO check data
        if (json.name == 'Luke Skywalker') {
          console.log(json.name)
          this.stopPolling()
          this.sendEmail();
        }
      }
    });
  }

  sendEmail() {

  }

  error(err, req, res, next) {
    res.status(500).send({ error: err.message });
  }

}
var api = new JsonixApi(Jsonix, [XLink_1_0, OWS_1_1_0, WPS_1_0_0]);


app.use(express.static('./src'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

/* not working this of api undefined
app.route('/wps')
  .get([api.forwardGetRequest, api.xml2json, api.sendResponseBack])
  .post([api.forwardPostRequest, api.xml2json, api.sendResponseBack]);
*/


app.route('/WPS/GetCapabilities*').get((req, res, next) => {
  api.forwardGetRequest(req, res, next)
},
  (req, res, next) => {
    api.xml2json(req, res, next)
  },
  (req, res) => {
    api.sendResponseBack(req, res)
  })

app.route('/WPS/DescribeProcess*').get((req, res, next) => {
  api.forwardGetRequest(req, res, next)
},
  (req, res, next) => {
    api.xml2json(req, res, next)
  },
  (req, res) => {
    api.sendResponseBack(req, res)
  })

app.route('/WPS/Execute*').post(
  (req, res, next) => {
    api.forwardPostRequest(req, res, next)
  },
  (req, res, next) => {
    api.xml2json(req, res, next)
  },
  (req, res, next) => {
    api.checkEmail(req, res, next)
  },
  (req, res) => {
    api.sendResponseBack(req, res)
  });

/*
app.route('/wps/GetCapabilities')
app.route('/wps/DescribeProcess')
app.route('/wps/Execute')
GetProcessStatus // no OGC
GetProcessOutput // no OGC

*/


//app.post('/wps', [api.forwardRequest, api.xml2json, api.sendResponseBack]);

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});


/*

app.get('/results', (req, res) => {
  setTimeout(() => {
    res.send({ result: 'test' });
  }, 1500);
});


app.post('/process', (req, res) => {
  var date = new Date().toString()
  res.send(date);
});

app.post('/wps', (req, res) => {
  //var search = req.query; //funny+cat
  var search = req.body.order;

  if (req.body.email) {
    ececute(req, res, req.body.email);
  }
});
*/

/*
function poll(req, res, send) {
  request('http://localhost:3000/results', (error, response, body) => {
    if (!error && response.statusCode == 200) {
      var newBody = {
        email: send.email,
        started: send.started,
        result: JSON.parse(body)
      }
      res.json(newBody);
    }
  });
}

function ececute(req, res, email) {
  request.post('http://localhost:3000/process', { form: { key: 'value' } }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      var send = {
        email: email,
        started: body
      }
      poll(req, res, send);
            if (body.started) {
              setInterval(() => {
                console.log(body.started.setSeconds(body.started.getSeconds() + 10).getTime())
                if(body.started.setSeconds(body.started.getSeconds() + 10).getTime() == new Date().getTime()){
                  poll(req, res, email);
                }
              }, 500);
            }

    }
  })
}
*/
