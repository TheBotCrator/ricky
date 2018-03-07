const config = require("./config.json");

const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');

if (!fs.existsSync("./offenders.json")) {
    fs.writeFileSync("./offenders.json", '{}');
    console.log("offenders file was not found, one has been created");
}

if (!fs.existsSync("./censor.txt")) {
    fs.writeFileSync("./censor.txt");
    console.log("censored words file not found, one has been created");
}

const censor = fs.readFileSync('./censor.txt', 'utf8').trim().split('\n');
console.log(censor);
const offenders = require("./offenders.json");

client.on('ready', () => {
    console.log("Bot Online");
})

client.on('message', message => {

    if (message.author.bot) return;

    const check = message.content.toLowerCase().replace(" ", '').trim();
    for (let i = 0; i < censor.length; i++) {
        if (check.includes(censor[i])) {
            console.log(message.author.username + " message contained a censored word, word was " + censor[i]);
            message.delete(250).then(message.channel.send(`${message.member.user}, that kind of language is not tolerated here.`).then(msg => msg.delete(30000)));

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
                if (err) return console.log(err);
                else {
                    console.log("offender write success");
                }
            });
            return;
        }
    }

    if (!(message.content.startsWith(config.prefix))) return;

    //$something CALISE MACHINE <:triggered:336226202492600331>
    const command = message.content.slice(config.prefix.length).split(/ +/)[0].toLowerCase(); //something

    //$10 or $$$
    if (/^\d+$/.test(command) || /\$+/.test(command)) return;

    const arg = message.content.slice(config.prefix.length + command.length).replace(/\s+/g, ' ').trim(); //CALISE MACHINE <:triggered:336226202492600331>
    const argNoTag = arg.replace(/<@?!?\D+\d+>/g, '').trim(); //CALISE MACHINE

    const argNoTagLower = argNoTag.toLowerCase().trim(); //calise machine

    console.log("\t" + message.author.username + ": " + message); //used for debugging

    switch (command) {
        case "conch":
            try {
                let completed = conch(arg);
                message.channel.send(completed);
            } catch (e) {
                message.channel.send(e);
            }
            break;

        case "role":
            try {
                let completed = addRole(message, argNoTag);
                message.delete(250).then(message.channel.send(completed).then(msg => msg.delete(30000)));
            } catch (e) {
                message.delete(250).then(message.channel.send(e).then(msg => msg.delete(30000)));
            }
            break;
    }
});

client.on("reconnecting", () => {
    console.log("Reconnecting...");
});

client.on("resume", replayed => {
    console.log(`Reconnectd. ${replayed} events replayed.`);
});

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n" + err.stack);
});

client.login(config.token);

function conch(arg) {
    if (arg) {
        return `Evan: "We're working on it."`;
    }
    else {
        throw `${message.member.user}, you need to actually ask me a question (ex: \`!conch Thing?\`).`;
    }
}

function addRole(message, role) {
    if (role) {
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
                message.member.removeRole(addedRole)
                    .then(() => {
                        return `${message.member.user}, I have removed the role \`${roleToAdd}\`.`;
                        console.log(roleToAdd + " was removed from " + message.author.username);
                    })
                    .catch(error => {
                        throw `${message.member.user}, I cannot remove the role \`${roleToAdd}\`.`;
                    });
            }

            else {
                message.member.addRole(addedRole)
                    .then(() => {
                        return `${message.member.user}, I have given you the role \`${roleToAdd}.\``;
                        console.log(roleToAdd + " was added to " + message.author.username);
                    })
                    .catch(error => {
                        throw `${message.member.user}, I cannot give you the role \`${roleToAdd}\`.`;
                    });
            }
        }

        else {
            throw `${message.member.user}, \`${argNoTag}\` is not a role.`;
        }
    }
    else {
        throw `${message.member.user}, please put the role you wish to add (ex: \`!role Thing\`).`;
    }
}