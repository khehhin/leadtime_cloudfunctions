'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Payload} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
var origin = "";
var destination = "";
var svcType = "";

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });

    function writeToDb (agent) {
        // Get parameter from Dialogflow with the string to add to the database
        const databaseEntry = agent.parameters.databaseEntry;

        // Get the database collection 'dialogflow' and document 'agent' and store
        // the document  {entry: "<value of database entry>"} in the 'agent' document
        const dialogflowAgentRef = db.collection('dialogflow').doc('agent');
        return db.runTransaction(t => {
            t.set(dialogflowAgentRef, {entry: ">>" + databaseEntry});
            return Promise.resolve('Write complete');
        }).then(doc => {
            agent.add(`Wrote "${databaseEntry}" to the Firestore database.`);
        }).catch(err => {
            console.log(`Error writing to Firestore: ${err}`);
            agent.add(`Failed to write "${databaseEntry}" to the Firestore database.`);
        });
    }

    function readFromDb (agent) {
        // Get the database collection 'dialogflow' and document 'agent'
        const dialogflowAgentDoc = db.collection('dialogflow').doc('agent');

        // Get the value of 'entry' in the document and send it to the user
        return dialogflowAgentDoc.get()
            .then(doc => {
                if (!doc.exists) {
                    agent.add('No data found in the database!');
                } else {
                    const str = doc.data().entry;
                    console.log(str);
                    agent.add(str + "<<< ");
                    // Telegram inline keyboard buttons
                    const butts = {
                        "text": "Countries of origin",
                        "reply_markup": {
                            "inline_keyboard": [
                                [
                                    {
                                        "text": "Singapore",
                                        "callback_data": "Hi"
                                    },
                                    {
                                        "text": "Singapore",
                                        "callback_data": "Hi"
                                    }
                                ],
                                [
                                    {
                                        "text": "Malaysia",
                                        "callback_data": "Hi"
                                    },
                                    {
                                        "text": "Malaysia",
                                        "callback_data": "Hi"
                                    }
                                ]
                            ]
                        }
                    };
                    agent.add(new Payload(agent.TELEGRAM, butts, {sendAsMessage:true}));
                }
                return Promise.resolve('Read complete');
            }).catch((exception) => {
                console.log(exception);
                agent.add('Error reading entry from the Firestore database.');
                agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
            });
    }

    function getCountriesOrigin (agent) {
        // Get the database collection 'dialogflow' and document 'agent'
        const originCountriesCollection = db.collection('LeadTimeTable');

        // Get the value of 'entry' in the document and send it to the user
        return originCountriesCollection.get().then( snapshot => {
            if (snapshot.empty) {
                agent.add('No countries doc in collection');
            } else {
                var button = {};
                var buttons =[];
                snapshot.forEach( doc => {
                    button = {};
                    button["text"] = doc.id;
                    button["callback_data"] = doc.id;
                    buttons.push(button);
                });
                var custPayload = {"text": "Pick a country of origin:"};
                var inline_keyboard = [buttons];
                var reply_markup = {"inline_keyboard": inline_keyboard };
                custPayload["reply_markup"] = reply_markup;
                agent.add("Welcome to Delivery Lead Time Bot! I can tell you the delivery lead time between countries.");
                agent.add(new Payload(agent.TELEGRAM, custPayload, {sendAsMessage:true}));

            }
            return Promise.resolve('Read complete');
        }).catch((exception) => {
            console.log(exception);
            agent.add('Error reading entry from the LeadTime table.');
        });
    }

    function getDestinationCountries (agent) {
        // Get the database collection 'dialogflow' and document 'agent'
        const originCountriesCollection = db.collection('LeadTimeTable');

        // Get the value of 'entry' in the document and send it to the user
        return originCountriesCollection.get().then( snapshot => {
            if (snapshot.empty) {
                agent.add('No countries doc in collection');
            } else {
                var button = {};
                var buttons =[];
                snapshot.forEach( doc => {
                    button = {};
                    button["text"] = doc.id;
                    button["callback_data"] = doc.id;
                    buttons.push(button);
                });
                var custPayload = {"text": "Pick a country of origin:"};
                var inline_keyboard = [buttons];
                var reply_markup = {"inline_keyboard": inline_keyboard };
                custPayload["reply_markup"] = reply_markup;
                agent.add("Welcome to Delivery Lead Time Bot! I can tell you the delivery lead time between countries.");
                agent.add(new Payload(agent.TELEGRAM, custPayload, {sendAsMessage:true}));

            }
            return Promise.resolve('Read complete');
        }).catch((exception) => {
            console.log(exception);
            agent.add('Error reading entry from the LeadTime table.');
        });
    }



    // Map from Dialogflow intent names to functions to be run when the intent is matched
    let intentMap = new Map();
    intentMap.set('ReadFromFirestore', readFromDb);
    intentMap.set('WriteToFirestore', writeToDb);
    intentMap.set('OriginCountry', getCountriesOrigin);
    intentMap.set('DestinationCountry', getDestinationCountries());
    agent.handleRequest(intentMap);
});



