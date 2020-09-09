'use strict';

const getmybalance = require('./getmybalance');
const banktransfer = require('./banktransfer');

module.exports = function(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const intentName = intentRequest.currentIntent.name;
    const slots = intentRequest.currentIntent.slots;

    if (intentName === 'getbalance') {
        console.log(intentName + ' was called ');
        return getmybalance(intentRequest, callback);
    }
    if (intentName === 'transferviabank') {
        console.log(intentName + ' was called ');
        return banktransfer(intentRequest, callback);
    }

    throw new Error(`Intent with name ${intentName} not supported`);
}