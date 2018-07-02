import { BasePlugin } from './base.plugin';
import * as Discord from 'discord.js';

export default class Roles extends BasePlugin {
    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'role') {
            const arg = message.content.slice(this.prefix.length + command.length).replace(/\s+/g, ' ').trim();
            const argNoTag = arg.replace(/<@?!?\D+\d+>/g, '').trim();

            if (argNoTag) {
                let argNoTagLower = argNoTag.toLowerCase();

                // // Checks if a role in the server matched the role requested
                let roleToAdd = message.guild.roles.find(role => {
                    return role.name.toLowerCase() === argNoTagLower;
                });

                // If role requested matches a role in the server
                if (roleToAdd) {
                    let roleToAddName = roleToAdd.name;

                    // If user already has role, remove it
                    // else, add it
                    if (message.member.roles.exists('name', roleToAddName)) {
                        message.member.removeRole(roleToAdd)
                            .then(() => {
                                console.log(`${roleToAddName} was removed from ${message.author.tag}`);
                                message.channel.send(`${message.member.user}, role removed.`);
                            })
                            .catch(() => {
                                message.channel.send(`${message.member.user}, I cannot remove that role.`);
                            });
                    }
                    else {
                        message.member.addRole(roleToAdd)
                            .then(() => {
                                console.log(`${roleToAddName} was added to ${message.author.tag}`);
                                message.channel.send(`${message.member.user}, role added`);
                            })
                            .catch(() => {
                                message.channel.send(`${message.member.user}, I cannot give you that role.`);
                            });
                    }
                }
                else {
                    message.channel.send(`${message.member.user}, that is not a role`);
                }
            }
            else if (arg) {
                message.channel.send(`${message.member.user}, there aren't any roles containing that tag or custom emote.`);
            }
            else {
                message.channel.send(`${message.member.user}, please put the role you wish to add (ex: \`${this.prefix}role Thing\`).`);
            }

            return true;
        }
        //ADDABLE ROLE LIST
        else if (command === 'roles') {
            let botName = message.client.user.username;
            let botRolePosition = message.guild.roles.find('name', botName).position;

            let sen = '';
            message.guild.roles.array().forEach(role => {
                if (0 < role.position && role.position < botRolePosition) {
                    sen += `\n${role.name}:\n\`${this.prefix}role ${role.name}\``;
                }
            });

            message.author.send(sen);
            message.channel.send(`${message.member.user}, I have sent you a list of roles.`);

            return true;
        }
        else {
            return false;
        }
    }
}