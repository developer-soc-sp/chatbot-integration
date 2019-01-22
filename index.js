'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
var admin = require("firebase-admin");
const {
    dialogflow,
    Image,
    Table,
    Carousel,
   } = require('actions-on-google');

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
    agent.add(`This is a test`);

  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('GetToneIntent',test);
  agent.handleRequest(intentMap);
});

const expressApp = express().use(bodyParser.json());

expressApp.post('/fulfillment', app.dialogflowFirebaseFulfillment);
//expressApp.listen(3000);
var listener = expressApp.listen(process.env.PORT,
  process.env.IP,
  function(){
      console.log("server started");
      console.log("listening on port " +
      listener.address().port);
  });