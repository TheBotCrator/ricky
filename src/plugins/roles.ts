import { BasePlugin } from './base';
import Discord from 'discord.js';

export default class Roles extends BasePlugin {
    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'role') {
            const arg: string = message.content.slice(this.prefix.length + command.length).replace(/\s+/g, ' ').trim();

            if (arg) {
                // /<(?:@!?\d+|:.+?:\d+)>/g is the regex to test for all types of discord tags
                // <@999>
                // <@!999>
                // <:aaa:999>
                // <:a9a:999>
                // <:999:999>
                const hasTags: boolean = /<(?:@!?\d+|:.+?:\d+)>/g.test(message.content);

                if (hasTags) {
                    message.channel.send(`${message.member.user}, there aren't any roles containing that tag or custom emote.`);
                }
                else {
                    const argLower: string = arg.toLowerCase();

                    const role: Discord.Role = message.guild.roles.find(role => {
                        return role.name.toLowerCase() === argLower;
                    });

                    if (role) {
                        this.addRemoveRole(message, role);
                    }
                    else {
                        message.channel.send(`${message.member.user}, \`${arg}\` is not a role`);
                    }
                }
            }
            else {
                message.channel.send(`${message.member.user}, please put the role you wish to add (ex: \`${this.prefix}role Thing\`).`);
            }

            return true;
        }
        else if (command === 'roles') {
            this.getSendAddableRoles(message);
            return true;
        }
        else {
            return false;
        }
    }

    private addRemoveRole(message: Discord.Message, role: Discord.Role) {
        if (message.member.roles.exists('id', role.id)) {
            message.member.removeRole(role)
                .then(() => {
                    message.channel.send(`${message.member.user}, \`${role.name}\` role removed.`);
                    console.log(`'${role.name}' was removed from ${message.author.tag}`);
                })
                .catch(() => {
                    message.channel.send(`${message.member.user}, I cannot remove the \`${role.name}\` role.`);
                });
        }
        else {
            message.member.addRole(role)
                .then(() => {
                    message.channel.send(`${message.member.user}, \`${role.name}\` role added`);
                    console.log(`'${role.name}' was added to ${message.author.tag}`);
                })
                .catch(() => {
                    message.channel.send(`${message.member.user}, I cannot give you the \`${role.name}\` role.`);
                });
        }
    }

    private getSendAddableRoles(message: Discord.Message) {
        const botName: string = message.client.user.username;
        const botRolePosition: number = message.guild.roles.find('name', botName).position;

        let sen = '';
        message.guild.roles.forEach(role => {
            if (0 < role.position && role.position < botRolePosition) {
                sen += `\n${role.name}:\n\`${this.prefix}role ${role.name}\``;
            }
        });

        message.author.send(sen);
        message.channel.send(`${message.member.user}, I have sent you a list of roles.`);
        console.log(`Sent ${message.author.tag} a list of roles`);
    }
}