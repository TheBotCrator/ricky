//-----------------------------------------------
// GLOBAL && REQUIREMENTS
//-----------------------------------------------

const Discord = require('discord.js');
const fs = require('fs');
const pluralize = require('pluralize');

// Checks for necessary files in the directory
CheckNecessaryFiles();

// Offenders json
const offenders = require("./offenders.json");

// List of censored words
const censor = fs.readFileSync("./censor.txt", 'utf8')
    .trim()
    .toLowerCase()
    .split((/[\r\n]+/))
    .reduce((r, e) =>
        r.push(e, pluralize(e)) && r, []
    );
//Logs list of censored words
console.log(`List of censored words:\n\t${censor}\n`);

// List of regular expressions used for filtering bad words
const regCensor = convertCensorToRegex();

// Login credentials and prefix for the bot
const config = require("./config.json");

// Creates a new Dicord "Client"
const client = new Discord.Client();

//-----------------------------------------------
// EVENT HANDLERS
//-----------------------------------------------

/**
 * On disconnect event. Emitted when the client's WebSocket disconnects and will no longer attempt to reconnect.
 * Logs console message.
 * @param {CloseEvent} event WebSocket close event
 */
client.on("disconnect", event => {
    console.log(`\n***SERVER HAS BEEN DISCONNECTED***\nCLEAN DISCONNECT: ${event.wasClean}\nCLOSE CODE: ${event.code}`);
});

/**
 * On error event. Emitted whenever the client's WebSocket encounters a connection error.
 * Logs console message.
 * @param {error} error encountered error
 */
client.on("error", error => {
    console.log(`\n${error}\n`);
});

/**
 * On message event. Emitted whenever a message is created.
 * Handles incoming user input, message censorship, and parsing for valid commands.
 * @param {object} message created discord message
 */
client.on("message", message => {

    // Ignore messages sent by bots and messages not sent in a text channel
    if (message.author.bot || message.channel.type !== "text") return;

    // Censorship
    try {
        filter(message);
    } catch (error) {
        sendAtAuthor(message, error);
        return;
    }

    //-----------------------------------------------
    // MESSAGE PARSING
    //-----------------------------------------------

    // Ignore message if it doesn't start with correct prefix
    // "hello world" => ignored
    if (!message.content.startsWith(config.prefix)) return;

    // Splits user message on spacing, getting the first "word", which is the "command"
    // "$insertCommandHere <@!100022489140195328> <:thOnk:337235802733936650> is a great emote" => "insertcommandhere"
    const command = message.content.slice(config.prefix.length).split(/ +/g)[0].toLowerCase();

    // Ignores message if they are talking about money
    // "$10" or "$$$" => ignored
    if (/^\d+$/.test(command) || /\$+/.test(command)) return;

    // Extracts the "argument", everything else in the message except the prefix and command
    // "$insertCommandHere <@!100022489140195328> <:thOnk:337235802733936650> is a great emote" => "<@!100022489140195328> <:thOnk:337235802733936650> is a great emote"
    const arg = message.content.slice(config.prefix.length + command.length).replace(/\s+/g, " ").trim();

    // Removes any tagged users or custom emotes and extra spaces from an arg
    // "<@!100022489140195328> <:thOnk:337235802733936650> is a great emote" => "is a great emote"
    const argNoTag = arg.replace(/<@?!?\D+\d+>/g, '').trim();

    // Logs the user's name and entire message
    console.log(`\t${message.author.tag}: ${message.content}`);

    //-----------------------------------------------
    // COMMAND HANDLING
    //-----------------------------------------------

    switch (command) {
        // The magic conch
        case "conch":
            conch(arg)
                .then(completed => {
                    send(message, completed);
                })
                .catch(error => {
                    sendAtAuthor(message, error);
                });
            break;

        // Automated role assignment
        case "role":
            addRole(message, argNoTag)
                .then(completed => {
                    sendAtAuthor(message, completed);
                })
                .catch(error => {
                    sendAtAuthor(message, error);
                });
            break;

        // Offender retrieval
        case "offender":
        case "offenders":
            getOffender(message)
                .then(completed => {
                    sendPrivateAuthor(message, completed);
                })
                .catch(error => {
                    sendAtAuthor(message, error);
                });
            break;
    }
});

/**
 * On messageUpdate event. Emitted whenever a message is updated - e.g. embed or content change.
 * Filters edited message.
 */
client.on("messageUpdate", (oMessage, nMessage) => {
    try {
        filter(nMessage);
    } catch (error) {
        sendAtAuthor(nMessage, error);
        return;
    }
});

/**
 * On ready event. Emitted when the client becomes ready to start working.
 * Logs console message.
 */
client.on("ready", () => {
    console.log("Bot Online\n");
});

/**
 * On reconnect event. Emitted when the client tries to reconnect to the WebSocked. 
 * Logs console message.
 */
client.on("reconnecting", () => {
    console.log("\nReconnecting...");
});

/**
 * On resume event. Emitted whenever a WebSocket resumes. 
 * Logs console message.
 * @param {int} replayed number of events that were replayed
 */
client.on("resume", replayed => {
    console.log(`Reconnectd. ${replayed} events replayed.\n`);
});

/**
 * On warn event. Emitted for general warnings.
 * Logs console message.
 * @param {string} info warning
 */
client.on("warn", info => {
    console.log(`\n${info}\n`);
});

/**
 * On unhandled Promise rejection.
 * Logs console message on where and why the error happened.
 * @param {error} reason error object
 * @param {promise} p promise that was rejected
 */
process.on("unhandledRejection", (reason, p) => {
    console.log(`\nUnhandled Rejection at: ${p}\nReason: ${reason}\n`);
});

//-----------------------------------------------
// UTILITY FUNCTIONS
//-----------------------------------------------

/**
 * Checks if all necessary files are in the directory.
 * If these files are not there, they are created synchronously and a console message is logged.
 * If the most important file, config.json, is not there then the process exits.
 */
function CheckNecessaryFiles() {
    // Create offenders JSON if one does not already exist 
    if (!fs.existsSync("./offenders.json")) {
        fs.writeFileSync("./offenders.json", '{}');
        console.log("Offenders file was not found, one has been created\n");
    }

    // Create censor list if one does not already exist
    if (!fs.existsSync("./censor.txt")) {
        fs.writeFileSync("./censor.txt", '\uFFFF');
        console.log("A CENSORED WORD FILE WAS NOT FOUND, ONE HAS BEEN CREATED\nPLEASE EDIT THIS FILE BY PLACING EACH WORD ON A NEW LINE\n");
    }

    // Create config JSON if one does not already exist
    if (!fs.existsSync("./config.json")) {
        fs.writeFileSync("./config.json", '{\n\t"prefix" : "PREFIX_HERE",\n\t"token" : "DISCORD_TOKEN_HERE"\n}');
        console.log("***CONFIG JSON NOT DETECTED, ONE HAS BEEN CREATED***\n***PLEASE EDIT THIS FILE TO INCLUDE PREFIX AND DISCORD TOKEN***\n");
        process.exit(0);
    }
}

/**
 * Takes each word in the censor list and creates a new array with a corresponding regex expression for testing in the word filter
 * @param {array} censor array containing list of banned words
 */
function convertCensorToRegex() {
    // /\bf+\s*a+\s*g+\b/
    let replace = { "a": "[a|4|@]", "b": "[b|8]", "c": "[c|<]", "e": "[e|3]", "f": "[f|ph]", "g": "[g|6|9]", "i": "[i|1]", "l": "[l|1]", "o": "[o|0]", "s": "[s|5|$]", "t": "[t|7|\+]", "w": "[w|vv]" };
    let regex = [];

    censor.forEach(word => {
        word = word.split('').map(letter => {
            return replace.hasOwnProperty(letter) ? replace[letter] : letter;
        });

        let sen = "(?=(?!\\w)|\\b)" + word[0] + "+";

        for (let i = 1; i < word.length; i++) {
            sen += ("\\s*" + word[i] + "+");
        }

        regex.push(new RegExp(sen + "(?!\\w)"));
    });

    return regex;
}

/**
 * Compares user message with list of banned words. If message contains said words, message is deleted
 * and user is added to a JSON contating number of offending messages with the offending messages.
 * @param {object} message discord message object
 */
function filter(message) {
    // User message, all lowercase, no spaces.
    const check = message.content.trim().toLowerCase();

    regCensor.forEach((word, i) => {
        // Check if user message contains a censored word
        if (word.test(check)) {
            // If uer is in offenders JSON their info is updated
            // else, their info is added to offenders JSON
            if (offenders.hasOwnProperty(message.member.id)) {
                offenders[message.member.id]['offenses']++;
                offenders[message.member.id]['messages'].push(message.content);
                console.log(`\t${message.author.tag} message contained : ${censor[i]}, ${offenders[message.member.id]['offenses']} offences`);
            }
            else {
                offenders[message.member.id] = { offenses: 1, messages: [message.content] };
                console.log(`\t${message.author.tag} message contained : ${censor[i]}, first offence`);
            }

            // Updates offender JSON file
            fs.writeFile("./offenders.json", JSON.stringify(offenders, null, 4), 'utf8', err => {
                if (err ? console.log(err) : console.log("Offender JSON write success"));
            });

            // Gets all memebers of the server, if member has "Moderator" role a private message is sent informing them about the infraction
            message.guild.fetchMembers()
                .then(pGuild => {
                    pGuild.members
                        .filterArray(member => {
                            return member.roles.find("name", "Moderator");
                        })
                        .forEach(member => {
                            member.send(`${message.author}'s message contained "${censor[i]}" in the ${message.channel} channel, ${offenders[message.member.id]['offenses']} offences`);
                        });
                });

            throw "that kind of language is not tolerated here.";
        }
    });
}

/**
 * Send a message in the channel it was recieved in
 * @param {object} message discord message object
 * @param {string} content message to send
 */
function send(message, content) {
    message.channel.send(content);
}

/**
 * Send a reply message to author of original message.
 * Deletes user's original message. After a delay the reply message is deleted.
 * @param {object} message discord message object
 * @param {string} content message to send
 */
function sendAtAuthor(message, content) {
    message.delete(250).then(message.channel.send(`${message.member.user}, ${content}`).then(msg => msg.delete(30000)));
}

/**
 * Send a private message to author of original message
 * @param {object} message discord message object
 * @param {string} content message to send
 */
function sendPrivateAuthor(message, content) {
    message.delete(250).then(message.author.send(content));
}

/**
 * All hail the magic conch
 * a-loo-loo-loo-loo
 * @param {string} arg user input string
 */
async function conch(arg) {
    if (arg) {
        console.log(`The conch has responded`);
        return "Evan: \"We're working on it.\"";
    }
    else {
        throw "you need to actually ask me a question (ex: \`!conch Thing?\`).";
    }
}

/**
 * If this bot has appropriate permissions, update role of user with requested role
 * @param {object} message discord message object
 * @param {string} argNoTag potential role value stripped of tags and emotes to prevent errors
 */
async function addRole(message, argNoTag) {
    if (argNoTag) {
        let argNoTagLower = argNoTag.toLowerCase();

        // // Creates array of all role names in server
        // // Checks if a role in the server matched the role requested
        let roleToAdd = message.guild.roles
            .find(role => {
                return role.name.toLowerCase() === argNoTagLower;
            });

        // If role requested matches a role in the server
        if (roleToAdd) {
            // Get the role object matching the name of the role
            let roleToAddName = roleToAdd.name;

            // If user already has role, remove it
            // else, add it
            if (message.member.roles.find("name", roleToAddName)) {
                return message.member.removeRole(roleToAdd)
                    .then(() => {
                        console.log(`${roleToAddName} was removed from ${message.author.tag}`);
                        return "role removed.";
                    })
                    .catch(error => {
                        throw "I cannot remove that role.";
                    });
            }
            else {
                return message.member.addRole(roleToAdd)
                    .then(() => {
                        console.log(`${roleToAddName} was added to ${message.author.tag}`);
                        return "role added.";
                    })
                    .catch(error => {
                        throw "I cannot give you that role.";
                    });
            }
        }
        else {
            throw "that is not a role.";
        }
    }
    else {
        throw "please put the role you wish to add (ex: \`!role Thing\`).";
    }
}

/**
 * List censor offenses of user including count, and offending messages. Only available to those with 
 * the "Admin", "Moderator", or "Community Team" roles.
 * @param {object} message discord message object
 */
async function getOffender(message) {
    // User object of first mentioned user
    const mentionedUser = message.mentions.users.first();

    // Checks if user has correct permissions to use this command
    if (message.member.roles.find("name", "Admin") || message.member.roles.find("name", "Moderator") || message.member.roles.find("name", "Community Team")) {
        // If there is a mentioned user it will pull up their info from the JSON and return
        // else, will return the number of offenders and all of their @'s
        if (mentionedUser) {
            console.log(`Sent ${message.author.tag} an offender summary of ${mentionedUser.tag}`);
            if (offenders.hasOwnProperty(mentionedUser.id)) {
                let sen = "**USER:** " + mentionedUser + "\n\n**TOTAL OFFENSES:** " + offenders[mentionedUser.id]['offenses'] + "\n\n**MESSAGES:**\n";

                offenders[mentionedUser.id]['messages'].forEach(message => {
                    sen += (message + '\n');
                });

                return sen;
            }
            else {
                return mentionedUser + " has 0 offenses.";
            }
        }
        else {
            console.log(`Sent ${message.author.tag} a list of offending users`);
            let count = 0;
            let users = "";

            for (let key in offenders) {
                if (offenders.hasOwnProperty(key)) {
                    count++;
                    await message.guild.fetchMember(key).then(gMem => (users += (gMem.user + '\n')));
                }
            }

            let sen = "**NUMBER OF OFFENDERS: **" + count + '\n\n';

            if (count !== 0) {
                sen += ("**OFFENDERS:**\n" + users);
            }

            return sen;
        }
    }
    else {
        throw "you do not have permission to use that command."
    }
}

//-----------------------------------------------
// DISCORD API LOGIN
//-----------------------------------------------

client.login(config.token);