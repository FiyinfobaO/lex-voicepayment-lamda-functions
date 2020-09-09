'use strict';
const axios = require('./config/axios');

const lexResponses = require('./lexresponses');

const getUserDetails = async(input) => {
    try {
        const data = input.replace('0', '234');
        const response = await axios.get(`http://ussd2.eyowo.com/v1/users/${data}/balance`);
        console.log({ data: response })
        if (response.data) {
            return response.data;
        }
        return response.error;
    } catch (error) {
        console.error(error);
        return error
    }
};


module.exports = async function(intentRequest, callback) {

    // var finalConfirmation = intentRequest.currentIntent.slots.finalconfirmation;
    var userNumber = intentRequest.currentIntent.slots.usernumber;

    console.log(intentRequest.currentIntent.slots.finalconfirmation, ' final conf intent');

    console.log(`${userNumber}`);

    console.log(intentRequest.inputTranscript);
    const source = intentRequest.invocationSource;

    if (source === 'DialogCodeHook') {
        callback(lexResponses.delegate(intentRequest.sessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
    const finalconfirmationStatements = [
        'yes',
        'ya',
        'correct',
        'yep',
        'yup',
        'proceed',
        'yes it is',
        'yeah'
    ]

    const finalfalseStatements = [
        'no',
        'nope',
        'no it\'s not',
        'naa',
        'no it is not',
        'nah'
    ]

    if (source === 'FulfillmentCodeHook') {
        console.log('FulfillmentCodeHook');
        if (finalconfirmationStatements.indexOf(String(intentRequest.currentIntent.slots.finalconfirmation).trim()) !== -1) {
            const data = await getUserDetails(userNumber);
            const h = parseFloat(Number(data.balance) / 100);
            console.log({ h })
            if (!data) {
                callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `${data}` }));
            }
            //callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `${data.balance}` }));
            callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `Okay, Your eyowo balance is ${h} naira` }));
            return;
        } else if (finalfalseStatements.indexOf(String(intentRequest.currentIntent.slots.finalconfirmation).trim()) !== -1) {
            //const slots = intentRequest.currentIntent.slots;
            intentRequest.currentIntent.slots.finalconfirmation = null
            console.log(intentRequest.currentIntent.slots.finalconfirmation, ' final conf intent 2');
            console.log(intentRequest.currentIntent.slots);
            return callback(lexResponses.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, intentRequest.currentIntent.slots, 'usernumber', { 'contentType': 'PlainText', 'content': 'Please call out the eyowo number again' }));
        }


        // let phoneConfirmation = [
        //     'no',
        //     'nope',
        //     'no it\'s not',
        //     'naa',
        //     'no it is not'
        // ];
        // if (phoneConfirmation.indexOf(finalConfirmation) !== -1) {
        //     intentRequest.currentIntent.slots.finalconfirmation = null
        //     return callback(lexResponses.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, intentRequest.currentIntent.slots, 'usernumber', { 'contentType': 'PlainText', 'content': `Please, call out the phone number again` }))
        // }


    }
}