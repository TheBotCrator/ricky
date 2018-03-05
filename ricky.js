const config = require("./config.json");

const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');

if(!fs.existsSync("./offenders.json")){
    fs.writeFileSync("./offenders.json", '{}');
}

if(!fs.existsSync("./censor.txt")){
    fs.writeFileSync("./censor.txt");
}

const censor = fs.readFileSync('./censor.txt', 'utf8').split('\n');
const offenders = require("./offenders.json");

client.on('ready', () => {
    console.log("Let's get rightttttttttt into the news");
})

client.on('message', message => {

    if(message.author.bot) return;

    const check = message.content.toLowerCase().replace(" ", '').trim();
    for(let i = 0; i < censor.length; i++){
        if(check.includes(censor[i])){
            message.delete(250).then(message.channel.send(`${message.member.user}, that kind of language is not tolerated here.`).then(msg => msg.delete(30000)));
            
            if(offenders.hasOwnProperty(message.member.id)){
                offenders[message.member.id]['offenses']++;
                offenders[message.member.id]['messages'].push(message.content);
            }
            else {
                offenders[message.member.id] = {offenses: 1, messages : [message.content]};
            }
            
            fs.writeFile("./offenders.json", JSON.stringify(offenders, null, 4), 'utf8', err => {
                if (err) return console.log(err);
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
            if (arg) {
                message.channel.send(`Evan: "We're working on it."`);
            }

            else {
                message.channel.send(`${message.member.user}, you need to actually ask me a question (ex: \`!conch Thing?\`).`)
            }
            break;

        case "role":
            if (argNoTag) {
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
                                message.delete(250).then(message.channel.send(`${message.member.user}, I have removed the role \`${roleToAdd}\`.`).then(msg => msg.delete(30000)))
                            })
                            .catch(error => {
                                message.delete(250).then(message.channel.send(`${message.member.user}, I cannot remove the role \`${roleToAdd}\`.`).then(msg => msg.delete(30000)))
                            });
                    }

                    else {
                        message.member.addRole(addedRole)
                            .then(() => {
                                message.delete(250).then(message.channel.send(`${message.member.user}, I have given you the role \`${roleToAdd}.\``).then(msg => msg.delete(30000)))
                            })
                            .catch(error => {
                                message.delete(250).then(message.channel.send(`${message.member.user}, I cannot give you the role \`${roleToAdd}\`.`).then(msg => msg.delete(30000)))
                            });
                    }
                }

                else {
                    message.delete(250).then(message.channel.send(`${message.member.user}, \`${argNoTag}\` is not a role.`).then(msg => msg.delete(30000)));
                }
            }

            else {
                message.delete(250).then(message.channel.send(`${message.member.user}, please put the role you wish to add (ex: \`!role Thing\`).`).then(msg => msg.delete(30000)))
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