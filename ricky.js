//-----------------------------------------------
// GLOBAL/REQUIREMENTS
//-----------------------------------------------
const config = require("./config.json");

const Discord = require('discord.js');
const fs = require('fs');

//
// Start up functions
//

// Create offenders JSON, if one does not already exist 
if (!fs.existsSync("./offenders.json")) {
    fs.writeFileSync("./offenders.json", '{}');
    console.log("Offenders file was not found, one has been created\n");
}
const offenders = require("./offenders.json");


// Create censor list, if one does not already exist
if (!fs.existsSync("./censor.txt")) {
    fs.writeFileSync("./censor.txt", '\uFFFF');
    console.log("\n***A CENSORED WORD FILE WAS NOT FOUND; ONE HAS BEEN CREATED***\n***PLEASE EDIT THIS FILE BY PLACING EACH WORD ON A NEW LINE***\n");
}
const censor = fs.readFileSync("./censor.txt", 'utf8').trim().split('\n');
//Logs list of censored words
console.log(`\nList of censored words:\n\t${censor}\n`)


// Creates a new Dicord "Client"
const client = new Discord.Client();


/**
 * On ready function. Logs console message.
 */
client.on('ready', () => {
    console.log("\nBot Online\n");
})


/**
 * On message function. Handles incoming user input, message censorship, and parsing for valid commands
 * @param {object} message discord message object
 */
client.on('message', message => {

    // ignore messages sent by bots
    if (message.author.bot) return;

    // Handle censorship
    try {
        filter(message, censor, offenders);
    } catch (error) {
        message.delete(250).then(message.channel.send(`${message.member.user}, ${error}`).then(msg => msg.delete(30000)));
        return;
    }

    // Look for bot command prefix
    if (!(message.content.startsWith(config.prefix))) return;

    //$something CALISE MACHINE <:triggered:336226202492600331>
    const command = message.content.slice(config.prefix.length).split(/ +/)[0].toLowerCase(); //something

    //$10 or $$$
    if (/^\d+$/.test(command) || /\$+/.test(command)) return;

    const arg = message.content.slice(config.prefix.length + command.length).replace(/\s+/g, ' ').trim(); //CALISE MACHINE <:triggered:336226202492600331>
    const argNoTag = arg.replace(/<@?!?\D+\d+>/g, '').trim(); //CALISE MACHINE

    console.log('\t' + message.author.username + ": " + message); //used for debugging

    // Main bot command handling
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
 * On reconnect function. Logs console message.
 */
client.on("reconnecting", () => {
    console.log("Reconnecting...");
});


/**
 * On resume function. Logs console message.
 * @param {int} replayed count of events replayed
 */
client.on("resume", replayed => {
    console.log(`Reconnectd. ${replayed} events replayed.`);
});


/**
 * On unhandled rejection function. Logs console message w/ error stack
 * @param {error} err error object
 */
process.on("unhandledRejection", err => {
    console.error(err.stack);
});


// Discord API login
client.login(config.token);

//-----------------------------------------------
// UTILITY FUNCTIONS
//-----------------------------------------------

/**
 * Compares user message with list of banned words. If message contains said words, message is deleted
 * and user is added to a JSON including count, and offending messages.
 * @param {String} message discord message object
 * @param {Array} censor array containing list of banned words
 * @param {Object} offenders JSON containing all offenders
 */
function filter(message, censor, offenders) {
    const check = message.content.toLowerCase().replace(" ", '').trim();
    for (let i = 0; i < censor.length; i++) {
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
 * If user of origin has appropriate permissions, update role of mentioned user with passed role
 * @param {Object} message discord message object
 * @param {String} argNoTag potential role value stripped of emotes to prevent potential errors
 */
async function addRole(message, argNoTag) {
    if (argNoTag) {
        let argNoTagLower = argNoTag.toLowerCase();

        let roleList = message.guild.roles.array();
        let names = roleList.map(role => {
            return role.name;
        });

        let roleToAdd;
        names.forEach(name => {
            if (name.toLowerCase() === argNoTagLower) {
                roleToAdd = name;
                return;
            }
        });

        if (roleToAdd) {
            let addedRole = message.guild.roles.find("name", roleToAdd);

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
 * the "Admin" or "Community Team" roles
 * @param {Object} message discord message object
 * @param {String} offenders user input offender string
 */
async function getOffender(message, offenders) {
    const mentionedUser = message.mentions.members.first();
    if (message.member.roles.find("name", "Admin") || message.member.roles.find("name", "Community Team")) {
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