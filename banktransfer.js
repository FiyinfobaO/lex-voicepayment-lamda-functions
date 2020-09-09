'use strict';
require('dotenv').config();
const axios = require('./config/axios');
const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET);



const lexResponses = require('./lexresponses');

const banks = [{
        "name": "Access Bank",
        "slug": "access",
        "code": "044",
        "eyowoBankCode": "000014",
    },
    {
        "name": "Diamond Bank",
        "slug": "diamond",
        "code": "063",
        "eyowoBankCode": "000005",
    },
    {
        "name": "Ecobank Nigeria",
        "slug": "ecobank",
        "code": "050",
        "eyowoBankCode": "000010",
    },
    {
        "name": "Fidelity Bank",
        "slug": "fidelity",
        "code": "070",
        "eyowoBankCode": "000007",
    },
    {
        "name": "First Bank of Nigeria",
        "slug": "first bank",
        "code": "011",
        "eyowoBankCode": "000016",
    },
    {
        "name": "First City Monument Bank",
        "slug": "FCMB",
        "code": "214",
        "eyowoBankCode": "214",
    },
    {
        "name": "Guaranty Trust Bank",
        "slug": "GTB",
        "code": "058",
        "eyowoBankCode": "000013",
    },
    {
        "name": "Keystone Bank",
        "slug": "keystone",
        "code": "082",
        "eyowoBankCode": "000002",
    },
    {
        "name": "Skye Bank",
        "slug": "skye bank",
        "code": "076",
        "eyowoBankCode": "000008",
    },
    {
        "name": "Stanbic IBTC Bank",
        "slug": "stanbic",
        "code": "221",
        "eyowoBankCode": "000012",
    },
    {
        "name": "Sterling Bank",
        "slug": "sterling",
        "code": "232",
        "eyowoBankCode": "000001",
    },
    {
        "name": "Union Bank of Nigeria",
        "slug": "union bank",
        "code": "032",
        "eyowoBankCode": "000018",
    },
    {
        "name": "United Bank For Africa",
        "slug": "UBA",
        "code": "033",
        "eyowoBankCode": "000004",
    },
    {
        "name": "Unity Bank",
        "slug": "unity",
        "code": "215",
        "eyowoBankCode": "000011",
    },
    {
        "name": "Wema Bank",
        "slug": "wema",
        "code": "035",
        "eyowoBankCode": "000017",

    },
    {
        "name": "Zenith Bank",
        "slug": "zenith",
        "code": "057",
        "eyowoBankCode": "000015",
    }
]

const getBankInfoFromSelection = name => {
    return banks.filter(bank => {
        return bank.name.toLowerCase().match(name.toLowerCase()) || bank.slug.toLowerCase().match(name.toLowerCase())
    })[0]
}
module.exports = { getBankInfoFromSelection };

const processTransfer = async(sender, bankList, account_number, amount, securePin) => {
    const data = await getBankInfoFromSelection(bankList);
    console.log(data, ' Currently Selected Bank.')

    const reqBody = {
        amount: amount * 100,
        bank_code: data.eyowoBankCode,
        account_number: account_number,
    };

    const resolvedAccountResponse = await Paystack.verification.resolveAccount({ account_number, bank_code: data.code })

    console.log(resolvedAccountResponse, ' Current account response.')

    if (resolvedAccountResponse.status) {
        reqBody.account_name = resolvedAccountResponse.data.account_name
    }

    console.log(reqBody, ' Current Request Body') // Current request body with resolved account number.
    try {
        axios.defaults.headers["x-eyowo-mobile"] = sender.replace('0', '234')
        axios.defaults.headers["x-eyowo-ussd-pin"] = securePin
        const response = await axios.post(`https://ussd2.eyowo.com/v2/payments/bank`, reqBody, {
            headers: {
                "Authorization": `Bearer ${process.env.EYOWO_USSD_AUTHORIZATION}`
            }
        });
        console.log('USSD Service Response: ', response);
        if (response.data && response.data.success) {
            return {
                status: true,
                message: response.data.message
            }
        }

    } catch (error) {
        return {
            status: false,
            error: error.response.data.error,
        }
    }
};


module.exports = async function(intentRequest, callback) {
    try {
        var AMAZON_AccountNumber = intentRequest.currentIntent.slots.accountnumber;
        var bankList = intentRequest.currentIntent.slots.banklist;
        var AMAZON_AMOUNT_NUMBER = intentRequest.currentIntent.slots.amount;
        var AMAZON_PIN_NUMBER = intentRequest.currentIntent.slots.pin;
        var AccountNumberConfirmation = intentRequest.currentIntent.slots.confirmaccountnumber;
        var userNumber = intentRequest.currentIntent.slots.usernumber;
        var userConfirmation = intentRequest.currentIntent.slots.confirmuser;
        var bankConfirmation = intentRequest.currentIntent.slots.confirmbank;
        var finalConfirmation = intentRequest.currentIntent.slots.finalconfirmation;

        console.log(`${userNumber} ${userConfirmation} ${bankList} ${bankConfirmation} ${AMAZON_AccountNumber} ${AccountNumberConfirmation} ${AMAZON_AMOUNT_NUMBER} ${AMAZON_PIN_NUMBER} ${finalConfirmation}`);

        console.log(intentRequest.inputTranscript);
        const source = intentRequest.invocationSource;

        if (source === 'DialogCodeHook') {

            if (userConfirmation === "no" || userConfirmation === "nope" || userConfirmation === "naa" || userConfirmation === "no,it is not") {
                intentRequest.currentIntent.slots.confirmuser = null
                return callback(lexResponses.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, intentRequest.currentIntent.slots, 'usernumber', { 'contentType': 'PlainText', 'content': 'Please call out your phone number again' }));
            } else if (bankConfirmation === "no" || bankConfirmation === "nope" || bankConfirmation === "naa" || bankConfirmation === "no,it is not") {
                intentRequest.currentIntent.slots.confirmbank = null
                return callback(lexResponses.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, intentRequest.currentIntent.slots, 'banklist', { 'contentType': 'PlainText', 'content': 'Please call out the bank again' }));
            } else if (AccountNumberConfirmation === "no" || AccountNumberConfirmation === "nope" || AccountNumberConfirmation === "naa" || AccountNumberConfirmation === "no,it is not") {
                intentRequest.currentIntent.slots.confirmaccountnumber = null
                return callback(lexResponses.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, intentRequest.currentIntent.slots, 'accountnumber', { 'contentType': 'PlainText', 'content': 'Please call out the account number again' }));
            } else {
                return callback(lexResponses.delegate(intentRequest.sessionAttributes, intentRequest.currentIntent.slots));
            }
        }

        if (source === 'FulfillmentCodeHook') {
            console.log('FulfillmentCodeHook');
            if (finalConfirmation === "yes" || finalConfirmation === "yeah" || finalConfirmation === "yes you can" || finalConfirmation === "yes please") {
                const reply = await processTransfer(userNumber, bankList, AMAZON_AccountNumber, AMAZON_AMOUNT_NUMBER, AMAZON_PIN_NUMBER);
                console.log(reply, ' Current response from processing transaction...')

                if (reply.status === false) {
                    console.log(reply.error, ' Reply response.')
                    return callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `Sorry, Transaction unsuccessful. ${reply.error}` }));
                }

                return callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `Great! You have successfully sent ${AMAZON_AMOUNT_NUMBER} naira.` }));
            } else {
                let phoneConfirmation = [
                    'no',
                    'nope',
                    'no it\'s not',
                    'naa',
                    'no it is not'
                ];
                if (phoneConfirmation.indexOf(finalConfirmation) !== -1) {
                    return callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `Alright then. Have a great day!` }));
                }
            }
        }

    } catch (err) {
        console.log(err, ' Fatal error here.')
        return callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `Sorry, a fatal error occurred.` }));
    }
}