var builder = require('botbuilder');
var restify = require('restify');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = process.env.MICROSOFT_LUIS_MODEL;
var recognizer = new builder.LuisRecognizer(model);

//=========================================================
// Bots Dialogs
//=========================================================

var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

// Add intent handlers
dialog.onDefault([
    function (session, args, next) {
        session.send("You said: %s", session.message.text);
        session.send("I'm sorry, I don't know how to handle this yet. My Master only taught me a couple conversation skills so far. LOL");
    }
]);

dialog.matches('builtin.intent.places.show_map',
    function (session, args, next) {
        // Resolve entities passed from LUIS.
        session.send("I think you are trying to find where you are...");
        session.send("Unfortunately, my Master has not taught me how to call Google Maps yet to bring back some results for you.");
    }
);

dialog.matches('builtin.intent.places.find_place', [
    function (session, args, next) {
        session.send("I think you are searching for one or more places...");
        // Resolve and store any entities passed from LUIS.
        var place_type = builder.EntityRecognizer.findEntity(args.entities, 'builtin.places.place_type');
        session.send("\ttype of place: %s", place_type != null ? place_type.entity : "Unknown");
        session.send("Unfortunately, my Master has not taught me how to call Google yet to bring back some results for you.");
        next();
    },
    function (session, results) {
        session.send("=== end processing.");
    }
]);

dialog.matches('builtin.intent.weather.check_weather', [
    function (session, args, next) {
        session.send("I think you are trying to check the weather...");
        // Resolve and store any entities passed from LUIS.
        var place_type = builder.EntityRecognizer.findEntity(args.entities, 'builtin.weather.absolute_location');
        session.send("\ttype of place: %s", place_type != null ? place_type.entity : "None provided...  Assuming your current location.");
        var date_range = builder.EntityRecognizer.findEntity(args.entities, 'builtin.weather.date_range');
        session.send("\tdate(s): %s", date_range != null ? date_range.entity : "None provided.");
        session.send("Unfortunately, my Master has not taught me how to call Weather Underground yet to bring back some results for you.");
        next();
    },
    function (session, results) {
        session.send("=== end processing.");
    }
]);
