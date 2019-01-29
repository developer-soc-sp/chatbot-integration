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
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

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

  function testImage(agent) {
    var visualRecognition = new VisualRecognitionV3({
      version: '2018-03-19',
      iam_apikey: 'Ae8wfpNwYI-OU88zzvem1L7iH0LzfUxdK1SElGV5VZQa'
    });

    var params = {
      //url: "https://www.t-mobile.com/content/dam/t-mobile/en-p/cell-phones/apple/apple-iphone-x/silver/Apple-iPhoneX-Silver-1-3x.jpg"
      url: agent.parameters.url
    };
    return new Promise((resolve, reject) => {
      visualRecognition.classify(params, function (err, response) {
        if (err) {
          console.log(err);
          agent.add("There is something wrong with the image link");
          reject("Error");
        }
        else {
          let result = JSON.stringify(response, null, 2);
          var str = "";
          var categories = response.images[0].classifiers[0].classes;
          categories.sort(function (a, b) { return b.score - a.score });
          categories.forEach(element => {
            if (element.score > 0.8 && element.type_hierarchy != null)
              str += element.class + " :" + element.score + "\n";
          });
          //agent.add('Image contains: \n' + str);
          agent.add(new Card({
            title: `Image Details`,
            imageUrl: params.url,
            text: str,
          })
          );
          console.log(result);
          resolve("Good");
        }
      });
    });
  }

  function testTone(agent) {
    var toneAnalyzerV3 = new ToneAnalyzerV3({
      version: '2017-09-21',
      iam_apikey: 'P2UPaWmPWixPsdR70AKdKZEJY4HRifMvQ07GYGCgn_rf'
    });

    var text = agent.parameters.sentence;
    //'Team, I know that times are tough! Product sales have been disappointing for the past three quarters. We have a competitive product, but we need to do a better job of selling it!'

    var params = {
      'tone_input': { 'text': text },
      'content_type': 'application/json'
    };
    return new Promise((resolve, reject) => {
      toneAnalyzerV3.tone(params, function (err, response) {
        if (err) {
          console.log(err);
          agent.add("There is something wrong with the tone input");
          reject("Error");
        }
        else {
          let result = JSON.stringify(response, null, 2);
          var str = "";
          var categories = response.document_tone.tones;
          categories.sort(function (a, b) { return b.score - a.score });
          categories.forEach(element => {
            if (element.score > 0.5)
              str += element.tone_name + " :" + element.score + " ,";
          });
          console.log(result);
          agent.add("The tone is " + str);
          resolve("Good");
        }
      });
    });
  }
  function conversation(agent) {
    var toneAnalyzerV3 = new ToneAnalyzerV3({
      version: '2017-09-21',
      iam_apikey: 'P2UPaWmPWixPsdR70AKdKZEJY4HRifMvQ07GYGCgn_rf'
    });

    var text = agent.parameters.myText;
    
    var params = {
      'tone_input': { 'text': text },
      'content_type': 'application/json'
    };
    return new Promise((resolve, reject) => {
      toneAnalyzerV3.tone(params, function (err, response) {
        if (err) {
          console.log(err);
          agent.add("There is something wrong with the tone input");
          reject("Error");
        }
        else {
          let result = JSON.stringify(response, null, 2);
          var str = "You sounds ";
          var categories = response.document_tone.tones;
          categories.sort(function (a, b) { return b.score - a.score });
          var i = 0;
          categories.forEach(element => {
            if (element.score > 0.5){
              if(i++ > 0 ) str += ", ";
              if(element.tone_name.toUpperCase() == "JOY")
                str += "happy";
              if(element.tone_name.toUpperCase() == "CONFIDENT")
                str += "confident";            
              if(element.tone_name.toUpperCase() == "SADNESS")
                str += "sad"; 
              } 
          });
          str += ". Tell me more about it."
          console.log(result);
          agent.add(str);
          resolve("Good");
        }
      });
    });
  }
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('GetImageDetailIntent', testImage);
  intentMap.set('GetToneDetailIntent', testTone);
  intentMap.set('ConversationIntent', conversation);
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