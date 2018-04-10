//-----------------------------------------------
// GLOBAL && REQUIREMENTS
//-----------------------------------------------

const Discord = require('discord.js');
const fs = require('fs');

// Checks for necessary files in the directory
CheckNecessaryFiles();

// Offenders json
const offenders = require("./offenders.json");

// List of censored words
const censor = fs.readFileSync("./censor.txt", 'utf8').toLowerCase().trim().split((/[\r\n]+/));
const regCensor = convertFilterToRegex(censor);
//Logs list of censored words
console.log(`List of censored words:\n\t${censor}\n`)
console.log(`List of regex words:\n\t${regCensor}\n`)

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
    console.log(`\n***SERVER HAS BEEN DISCONNECTED***\nCLEAN DISCONNECT: ${event.wasClean}\nCLOSE CODE: ${event.code}`)
})

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

    // Ignore messages sent by bots
    if (message.author.bot) return;

    // Ignore message if it is not in a channel
    if (message.channel.type !== "text") return;

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
 * On ready event. Emitted when the client becomes ready to start working.
 * Logs console message.
 */
client.on("ready", () => {
    console.log("Bot Online\n");
})

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
function convertFilterToRegex() {
    function getAlt(i, j) {
        if (replace.hasOwnProperty(censor[i][j])) {
            let or = "[" + censor[i][j];
            for (let k = 0; k < replace[censor[i][j]].length; k++) {
                or += "|" + replace[censor[i][j]][k];
            }
            or += "]";
            return or + "+";
        }
        return censor[i][j] + "+";
    }
    // /\bf+\s*a+\s*g+\b/
    let replace = { "a": ["4", "@"], "b": ["8"], "c": ["<"], "e": ["3"], "f": ["ph"], "g": ["6", "9"], "i": ["1"], "l": ["1"], "o": ["0"], "s": ["5", "$"], "t": ["7", "+"], "w": ["vv"] }
    let regex = [];

    for (let i = 0; i < censor.length; i++) {
        let sen = "\\b" + getAlt(i, 0);

        for (let j = 1; j < censor[i].length; j++) {
            sen += "\\s*" + getAlt(i, j);
        }

        sen += "\\b"
        sen = new RegExp(sen);
        regex.push(sen)
    }
    return regex;
}

/**
 * Compares user message with list of banned words. If message contains said words, message is deleted
 * and user is added to a JSON contating number of offending messages with the offending messages.
 * @param {object} message discord message object
 */
function filter(message) {
    // User message, all lowercase, no spaces.
    const check = message.content.toLowerCase().trim();

    for (let i = 0; i < censor.length; i++) {
        // Check if user message contains a censored word
        if (regCensor[i].test(check)) {
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

            fs.writeFile("./offenders.json", JSON.stringify(offenders, null, 4), 'utf8', err => {
                if (err ? console.log(err) : console.log("Offender JSON write success"));
            });

            throw "that kind of language is not tolerated here.";
        }
    }
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
 * Send a private message to author of original message.
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
        console.log(`The conch has responded`)
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

        // Creates array of all role names in server
        let roleList = message.guild.roles.array();
        let names = roleList.map(role => {
            return role.name;
        });

        // Checks if the role requested matches a role in the sever
        let roleToAdd;
        names.forEach(name => {
            if (name.toLowerCase() === argNoTagLower) {
                roleToAdd = name;
                return;
            }
        });

        // If role requested matches a role in the server
        if (roleToAdd) {
            // Get the role object matching the name of the role
            let addedRole = message.guild.roles.find("name", roleToAdd);

            // If user already has role, remove it
            // else, add it
            if (message.member.roles.find("name", roleToAdd)) {
                return message.member.removeRole(addedRole)
                    .then(() => {
                        console.log(`${roleToAdd} was removed from ${message.author.tag}`);
                        return "role removed.";
                    })
                    .catch(error => {
                        throw "I cannot remove that role.";
                    });
            }
            else {
                return message.member.addRole(addedRole)
                    .then(() => {
                        console.log(`${roleToAdd} was added to ${message.author.tag}`);
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
 * the "Admin" or "Community Team" roles.
 * @param {object} message discord message object
 */
async function getOffender(message) {
    // User object of first mentioned user
    const mentionedUser = message.mentions.users.first();

    // Checks if user has correct permissions to use this command
    if (message.member.roles.find("name", "Admin") || message.member.roles.find("name", "Community Team")) {
        // If there is a mentioned user it will pull up their info from the JSON and return
        // else, will return the number of offenders and all of their @'s
        if (mentionedUser) {
            console.log(`Sent ${message.author.tag} an offender summary of ${mentionedUser.tag}`);
            if (offenders.hasOwnProperty(mentionedUser.id)) {
                let sentence = "";
                sentence += ("**USER:** " + mentionedUser + '\n\n')
                sentence += ("**TOTAL OFFENSES:** " + offenders[mentionedUser.id]['offenses'] + '\n\n');
                sentence += ("**MESSAGES:**\n")

                for (let i = 0; i < offenders[mentionedUser.id]['messages'].length; i++) {
                    sentence += (offenders[mentionedUser.id]['messages'][i] + '\n');
                }
                return sentence;
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
                    await message.guild.fetchMember(key).then(gMem => (users += gMem.user + '\n'));
                }
            }

            let sentence = "";

            sentence += "**NUMBER OF OFFENDERS: **" + count + '\n\n';
            if (count !== 0) {
                sentence += "**OFFENDERS:**\n";
                sentence += users;
            }

            return sentence;
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