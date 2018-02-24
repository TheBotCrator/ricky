const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");

const fs = require('fs');

client.on('ready', () => {
    console.log("Roger Roger");
})

client.on('message', message => {
    if (message.author.bot || !(message.content.startsWith(config.prefix))) return;

    const command = message.content.slice(config.prefix.length).split(/ +/)[0].toLowerCase(); //something

    //$10
    if (/^\d+$/.test(command)) return;

    const nickname = message.member.nickname || message.author.username;

    const arg = message.content.slice(config.prefix.length + command.length).replace(/\s+/g, ' ').trim(); //CALISE MACHINE <:triggered:336226202492600331>

    const argNoTag = arg.replace(/<@?!?\D+\d+>/g, '').trim();
    const argNoTagNoSpaces = argNoTag.replace(/\s/g, '').trim(); //CALISEMACHINE
    const argNoTagLower = argNoTag.toLowerCase().trim() //calise machine

    const argNoTagNoSpacesLower = argNoTagNoSpaces.toLowerCase().trim(); //calisemachine

    const mentionedUser = message.mentions.members.first();

    switch (command) {
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
                        .catch(() => {
                            message.delete(250).then(message.channel.send(`${message.member.user}, I cannot remove the role \`${roleToAdd}\`.`).then(msg => msg.delete(30000)))
                        })
                    }

                    else {
                        message.member.addRole(addedRole)
                        .then(() => {
                            message.delete(250).then(message.channel.send(`${message.member.user}, I have given you the role \`${roleToAdd}.\``).then(msg => msg.delete(30000)))
                        })
                        .catch(error => {
                            message.delete(250).then(message.channel.send(`${message.member.user}, I cannot give you the role \`${roleToAdd}\`.`).then(msg => msg.delete(30000)));
                        });
                    }
                    break;
                }

                else {
                    message.delete(250).then(message.channel.send(`${message.member.user}, \`${argNoTag}\` is not a role.`).then(msg => msg.delete(30000)));
                }
            }

            else {
                message.delete(250).then(message.channel.send(`${message.member.user}, please put the role you wish to add (ex: \`!role Thing\`)`).then(msg => msg.delete(30000)))
            }
            break;

        default:
            message.delete(250).then(message.channel.send(`${message.member.user}, \`\$${command}\` is not a command.`).then(msg => msg.delete(5000)));
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