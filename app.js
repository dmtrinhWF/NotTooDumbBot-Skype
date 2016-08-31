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

server.get('/', restify.serveStatic({
    directory: __dirname,
    default: '/index.html'
}));

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
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("NotTooDumbBot")
            .text("beep beep beeeeeeeeeeep!")
            .images([
                 builder.CardImage.create(session, 
                 "http://tfwiki.net/mediawiki/images2/thumb/f/fe/Symbol_autobot_reg.png/120px-Symbol_autobot_reg.png")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("This Not-too-dumb-Bot's main purpose is simply to " +
            "testdrive Microsoft Bot Framework so I can better understand how " +
            "it works.  The bot currently implements the following: \n\n" +
            "* A simple help menu\n" +
            "* A set of global action handlers\n" +
            "* Integration with Microsoft LUIS\n so it can have basic language understanding\n\n" +
            "The bot makes use of the ChatConnector which allows it to interface with a " +
            "variety of channels including Skype."
        );
        session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        session.beginDialog('/menu');
    },
    function (session, results) {
        // When does this actually get called?!
        session.send("Hasta la vista!");
    }
]);

bot.dialog('/help', [
    function (session) {
        session.endDialog("== HELP BOX ==\n\n" +
            "Global commands that can be invoked anytime:\n" +
            "* menu - Display main menu\n" +
            "* quit - Quit the current conversation\n" +
            "* help - Bring up this help box"
        );
    }
]);

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "Choose an option:", "LUIS|(quit)");
    },
    function (session, results) {
        if (results.response && results.response.entity != '(quit)') {
            if (results.response.entity == 'LUIS');
                session.send("LUIS testdrive... start chatting with the bot!");
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

var intent_dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/LUIS', intent_dialog);

// Add intent handlers
intent_dialog.onDefault([
    function (session, args, next) {
        session.send("You said: %s", session.message.text);
        session.send("I'm sorry, I don't know how to handle this yet. " +
            "Ducmeister only taught me a couple conversation skills so far. " +
            "Try asking about something useless like the weather or for a location.  LOL"
        );
    }
]);

intent_dialog.matches('builtin.intent.places.show_map',
    function (session, args, next) {
        // Resolve entities passed from LUIS.
        session.send("I think you are trying to find where you are...");
        session.send("Unfortunately, Ducmeister has not taught me how to call Google Maps yet to bring back some results for you.");
    }
);

intent_dialog.matches('builtin.intent.places.find_place', [
    function (session, args, next) {
        session.send("I think you are searching for one or more places...");
        // Resolve and store any entities passed from LUIS.
        var place_type = builder.EntityRecognizer.findEntity(args.entities, 'builtin.places.place_type');
        session.send("\ttype of place: %s", place_type != null ? place_type.entity : "Unknown");
        session.send("Unfortunately, Ducmeister has not taught me how to call Google yet to bring back some results for you.");
    }
]);

intent_dialog.matches('builtin.intent.weather.check_weather', [
    function (session, args, next) {
        session.send("I think you are trying to check the weather...");
        // Resolve and store any entities passed from LUIS.
        var place_type = builder.EntityRecognizer.findEntity(args.entities, 'builtin.weather.absolute_location');
        session.send("\ttype of place: %s", place_type != null ? place_type.entity : "None provided...  Assuming your current location.");
        var date_range = builder.EntityRecognizer.findEntity(args.entities, 'builtin.weather.date_range');
        session.send("\tdate(s): %s", date_range != null ? date_range.entity : "None provided.");
        session.send("Unfortunately, Ducmeister has not taught me how to call Weather Underground yet to bring back some results for you.");
        next();
    },
    function (session, results) {
        session.send("=== end waterfall.");
    }
]);

intent_dialog.matches(/\b(quit|end|exit)\b/i,
    function (session, args, next) {
        // Resolve entities passed from LUIS.
        session.endDialog("OK... exiting LUIS testdrive!");
    }
);
