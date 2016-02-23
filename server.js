"use strict";

let schedule = require('node-schedule');
let mqtt = require('mqtt');
let fs = require('fs');

class Alarm {
  constructor(json, client) {
    this.id = json.id;
    this.client = client;
    // TODO: Allow specifying recurrence as a object
    this.job = schedule.scheduleJob(json.recurrence, this.callback.bind(this));
  }

  callback() {
    // TODO: Send date instead of 'true' ?
    this.client.publish('alarms/'+this.id+'/get/trigger', 'true');
    console.log('alarm triggered:', this.id);
  }

  timeLeft() {
    let now = new Date();
    let next = this.job.nextInvocation();
    let diff = (next - now) / 1000;
    return diff;
  }
};

let alarms = [];
let mqttClient = mqtt.connect('mqtt://test.mosquitto.org');

fs.readdir('alarms', function(err, files){
  if(err)
    throw err;

   files.forEach(file => {
     if (file.match(/\.json$/)) {
       let alarm = new Alarm(require('./alarms/'+file), mqttClient);
       alarms.push(alarm);
     }
   });
});


setInterval(function() {
  alarms.forEach(alarm => {
    mqttClient.publish('alarms/'+alarm.id+'/get/left', alarm.timeLeft().toString());
  });
}, 1000);
