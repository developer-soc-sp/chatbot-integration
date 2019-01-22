'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
var admin = require("firebase-admin");
const {
  dialogflow,
  Image,
  Table,
  Carousel,
} = require('actions-on-google');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');

const app = dialogflow();
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

app.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function test(agent) {
    var visualRecognition = new VisualRecognitionV3({
      version: '2018-03-19',
      iam_apikey: 'Ae8wfpNwYI-OU88zzvem1L7iH0LzfUxdK1SElGV5VZQa'
    });

    var params = {
      url: "https://www.t-mobile.com/content/dam/t-mobile/en-p/cell-phones/apple/apple-iphone-x/silver/Apple-iPhoneX-Silver-1-3x.jpg"
    };
    new Promise((resolve, reject) => {
      visualRecognition.classify(params, function (err, response) {
        if (err){
            console.log(err);
            reject("Error");
        }
        else {
          let result = JSON.stringify(response, null, 2);
          console.log(response.images.constructor.name);
          console.log(response.images[0].classifiers[0].classes[0]);
          agent.add('Image Test\n' + response.images.constructor.name + "\n" + result);
          
          agent.add(`This is a test`);
          console.log(`This is a test`);
          resolve("Good");
        }
      });
    });
  }


  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('GetToneIntent', test);
  agent.handleRequest(intentMap);
});

const expressApp = express().use(bodyParser.json());

expressApp.post('/fulfillment', app.dialogflowFirebaseFulfillment);
//expressApp.listen(3000);
var listener = expressApp.listen(process.env.PORT,
  process.env.IP,
  function () {
    console.log("server started");
    console.log("listening on port " +
      listener.address().port);
  });