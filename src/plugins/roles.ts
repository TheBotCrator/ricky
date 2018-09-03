import { BasePlugin } from './base';
import Discord from 'discord.js';

export default class Roles extends BasePlugin {
    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'role') {
            const arg: string = message.content.slice(this.prefix.length + command.length).replace(/\s+/g, ' ').trim();

            // Checks if the user actually provided a role
            if (arg) {
                // /<(?:@!?\d+|:.+?:\d+)>/g is the regex to test for all types of discord tags
                // <@999>
                // <@!999>
                // <:aaa:999>
                // <:a9a:999>
                // <:999:999>
                const hasTags: boolean = /<(?:@!?\d+|:.+?:\d+)>/g.test(arg);

                if (hasTags) {
                    message.channel.send(`${message.author}, there aren't any roles containing that tag or custom emote.`);
                }
                else {
                    const argLower: string = arg.toLowerCase();

                    // Get the role that matches what the user wants
                    const roleWant: Discord.Role = message.guild.roles.find(role => role.name.toLowerCase() === argLower);

                    // Check if the role they want is real
                    if (roleWant) {
                        // If they have the role, remove it. If they don't, add it.
                        if (message.member.roles.some(role => role.id === roleWant.id)) {
                            this.removeRole(message, roleWant);
                        }
                        else {
                            this.addRole(message, roleWant);
                        }
                    }
                    else {
                        message.channel.send(`${message.author}, \`${arg}\` is not a role`);
                    }
                }
            }
            else {
                message.channel.send(`${message.author}, please put the role you wish to add (ex: \`${this.prefix}role Thing\`).`);
            }

            return true;
        }
        else if (command === 'roles') {
            // Send the user a list of roles that are able to be added.
            this.sendAddableRoles(message);
            return true;
        }
        else {
            return false;
        }
    }

    private addRole(message: Discord.Message, role: Discord.Role): void {
        // Adds the provided role to the user, if it fails, let them know.
        message.member.addRole(role)
            .then(() => {
                message.channel.send(`${message.author}, \`${role.name}\` role added`);
                console.log(`'${role.name}' was added to ${message.author.tag}`);
            })
            .catch(() => {
                message.channel.send(`${message.author}, I cannot give you the \`${role.name}\` role.`);
            });
    }

    private removeRole(message: Discord.Message, role: Discord.Role): void {
        // Removes the provided role to the user, if it fails, let them know.
        message.member.removeRole(role)
            .then(() => {
                message.channel.send(`${message.author}, \`${role.name}\` role removed.`);
                console.log(`'${role.name}' was removed from ${message.author.tag}`);
            })
            .catch(() => {
                message.channel.send(`${message.author}, I cannot remove the \`${role.name}\` role.`);
            });
    }

    private sendAddableRoles(message: Discord.Message) {
        // Each channel has a special role for the bot, find it's position.
        const botName: string = message.client.user.username;
        const botRolePosition: number = message.guild.roles.find(role => role.name === botName).position;

        let sen: string = '';
        // Get all the roles below the bot's position, but not the bottom one (@everyone) 
        message.guild.roles.forEach(role => {
            if (0 < role.position && role.position < botRolePosition) {
                sen += `\n${role.name}:\n\`${this.prefix}role ${role.name}\``;
            }
        });

        message.author.send(sen);
        message.channel.send(`${message.author}, I have sent you a list of roles.`);
        console.log(`Sent ${message.author.tag} a list of roles`);
    }
}