//-----------------------------------------------
// GLOBAL && REQUIREMENTS
//-----------------------------------------------

const config = require("./config.json");

const Discord = require('discord.js');
const fs = require('fs');

// Create offenders JSON if one does not already exist 
if (!fs.existsSync("./offenders.json")) {
    fs.writeFileSync("./offenders.json", '{}');
    console.log("Offenders file was not found, one has been created");
}
const offenders = require("./offenders.json");

// Create censor list if one does not already exist
if (!fs.existsSync("./censor.txt")) {
    fs.writeFileSync("./censor.txt", '\uFFFF');
    console.log("\n***A CENSORED WORD FILE WAS NOT FOUND; ONE HAS BEEN CREATED***\n***PLEASE EDIT THIS FILE BY PLACING EACH WORD ON A NEW LINE***\n");
}
const censor = fs.readFileSync("./censor.txt", 'utf8').trim().split('\n');
//Logs list of censored words
console.log(`List of censored words:\n\t${censor}\n`)


// Creates a new Dicord "Client"
const client = new Discord.Client();


/**
 * On ready event. Logs console message.
 */
client.on('ready', () => {
    console.log("Bot Online\n");
})


/**
 * On message event. Handles incoming user input, message censorship, and parsing for valid commands
 * @param {object} message discord message object
 */
client.on('message', message => {

    // Ignore messages sent by bots
    if (message.author.bot) return;

    // Censorship
    try {
        filter(message, censor, offenders);
    } catch (error) {
        message.delete(250).then(message.channel.send(`${message.member.user}, ${error}`).then(msg => msg.delete(30000)));
        return;
    }

    
    //-----------------------------------------------
    // MESSAGE PARSING
    //-----------------------------------------------

    // Ignore message if it doesn't start with correct prefix
    // "hello world" => ignored
    if (!message.content.startsWith(config.prefix)) return;

    // Splits user message on spacing, getting the first "word", which is the "command"
    // "$insertCommandHere <@!100022489140195328> <:thOnk:337235802733936650> is a great emote" => "insertCommandHere"
    const command = message.content.slice(config.prefix.length).split(/ +/g)[0].toLowerCase(); //something

    // Ignores message if they are talking about money
    // "$10" or "$$$" => ignored
    if (/^\d+$/.test(command) || /\$+/.test(command)) return;

    // Extracts the argument, everything else in the message minus the prefix and command
    // "$insertCommandHere <@!100022489140195328> <:thOnk:337235802733936650> is a great emote" => "<@!100022489140195328> <:thOnk:337235802733936650> is a great emote"
    const arg = message.content.slice(config.prefix.length + command.length).trim(); //CALISE MACHINE <:triggered:336226202492600331>
    
    // Removes any tagged users or custom emotes from an arg
    // "<@!100022489140195328> <:thOnk:337235802733936650> is a great emote" => "is a great emote"
    const argNoTag = arg.replace(/<@?!?\D+\d+>/g, '').trim();

    // Logs the user's name and entire message
    console.log(`\t${message.author.username}: ${message.content}`);


    //-----------------------------------------------
    // COMMAND HANDLING
    //-----------------------------------------------

    switch (command) {
        // The magic conch
        case "conch":
            conch(arg)
                .then(completed => {
                    message.channel.send(completed)
                })
                .catch(error => {
                    message.delete(250).then(message.channel.send(`${message.member.user}, ${error}`));
                });
            break;

        // Automated role assignment
        case "role":
            addRole(message, argNoTag)
                .then(completed => {
                    message.delete(250).then(message.channel.send(`${message.member.user}, ${completed}`).then(msg => msg.delete(300000)));
                })
                .catch(error => {
                    message.delete(250).then(message.channel.send(`${message.member.user}, ${error}`).then(msg => msg.delete(30000)));
                });
            break;

        // Offender retrieval
        case "offender":
        case "offenders":
            getOffender(message, offenders)
                .then(completed => {
                    message.delete(250).then(message.author.send(completed));
                })
                .catch(error => {
                    message.delete(250).then(message.channel.send(`${message.member.user}, ${error}`).then(msg => msg.delete(30000)));
                });
            break;
    }
});


/**
 * On reconnect event. Logs console message.
 */
client.on("reconnecting", () => {
    console.log("Reconnecting...");
});


/**
 * On resume event. Logs console message.
 * @param {int} replayed count of events replayed
 */
client.on("resume", replayed => {
    console.log(`Reconnectd. ${replayed} events replayed.`);
});


// Discord API login
client.login(config.token);


/**
 * On unhandled rejection event. Logs console message w/ error stack.
 * @param {error} err error object
 */
process.on("unhandledRejection", err => {
    console.error(err.stack);
});


//-----------------------------------------------
// UTILITY FUNCTIONS
//-----------------------------------------------

/**
 * Compares user message with list of banned words. If message contains said words, message is deleted
 * and user is added to a JSON contating number of offending messages with the offending messages.
 * @param {Object} message discord message object
 * @param {Array} censor array containing list of banned words
 * @param {Object} offenders JSON containing all offenders
 */
function filter(message, censor, offenders) {
    // User message, all lowercase, no spaces.
    const check = message.content.toLowerCase().replace(/\s/g, '').trim();

    for (let i = 0; i < censor.length; i++) {
        // If user message contains a censored word, the word is deleted and their info is added/updated to the offenders JSON
        if (check.includes(censor[i])) {
            console.log(message.author.username + " message contained a censored word, word was: " + censor[i]);

            if (offenders.hasOwnProperty(message.member.id)) {
                console.log(message.member.user.username + " is a repeat offender")
                offenders[message.member.id]['offenses']++;
                offenders[message.member.id]['messages'].push(message.content);
            }
            else {
                console.log(message.author.username + ": first offense");
                offenders[message.member.id] = { offenses: 1, messages: [message.content] };
            }

            fs.writeFile("./offenders.json", JSON.stringify(offenders, null, 4), 'utf8', err => {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("offender write success");
                }
            });

            throw "that kind of language is not tolerated here.";
        }
    }
}

/**
 * All hail the magic conch
 * a-loo-loo-loo-loo
 * @param {String} arg user input string
 */
async function conch(arg) {
    if (arg) {
        return "Evan: \"We're working on it.\"";
    }
    else {
        throw "you need to actually ask me a question (ex: \`!conch Thing?\`).";
    }
}


/**
 * If user has appropriate permissions, update role of mentioned user with passed role
 * @param {Object} message discord message object
 * @param {String} argNoTag potential role value stripped of tags and emotes to prevent potential errors
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

        // If role was found
        if (roleToAdd) {
            // Get the role object matching the name of the role
            let addedRole = message.guild.roles.find("name", roleToAdd);

            // If user already has role, remove it, else add it
            if (message.member.roles.find("name", roleToAdd)) {
                return message.member.removeRole(addedRole)
                    .then(() => {
                        console.log(roleToAdd + " was removed from " + message.author.username);
                        return "role removed.";
                    })
                    .catch(error => {
                        throw "I cannot remove that role.";
                    });
            }
            else {
                return message.member.addRole(addedRole)
                    .then(() => {
                        console.log(roleToAdd + " was added to " + message.author.username);
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
 * @param {Object} message discord message object
 * @param {Object} offenders JSON containing all offenders
 */
async function getOffender(message, offenders) {
    // Gets GuildMember object of first mentioned user
    const mentionedUser = message.mentions.members.first();

    // Checks if user has correct permissions to use this command
    if (message.member.roles.find("name", "Admin") || message.member.roles.find("name", "Community Team")) {
        // If there is a mentioned user it will pull up their info from the JSON and send the user a PM
        // else, will PM the user the number of offenders and all of their @'s
        if (mentionedUser) {
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