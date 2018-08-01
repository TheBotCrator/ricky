import { BasePlugin } from './base';
import Discord from 'discord.js';
import fs from 'fs';

export default class Mute extends BasePlugin {
    private muted: string[] = fs.readFileSync('./data/muted.txt', { encoding: 'utf8' })
        .trim()
        .split(/\r\n|\n/)
        .filter(Boolean);

    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'mute' || command === 'unmute') {
            if (message.member.roles.exists('name', 'Admin') || message.member.roles.exists('name', 'Moderator')) {
                const mentionedUsers: Discord.User[] = message.mentions.users.array();

                if (mentionedUsers.length) {
                    mentionedUsers.forEach(user => {
                        if (user === message.author) {
                            message.channel.send(`${message.member.user}, you cannot mute yourself.`);
                        }
                        else {
                            if (this.muted.includes(user.id)) {
                                this.unMute(message, user);
                            }
                            else {
                                this.mute(message, user);
                            }
                        }
                    });
                }
                else {
                    message.channel.send(`${message.member.user}, please put the user(s) you wish to mute (ex: \`${this.prefix}mute @user @user, @user\`).`);
                }
            }
            else {
                message.channel.send(`${message.member.user}, 'you do not have permission to use that command.'`);
            }
            return true;
        }
        else {
            return false;
        }
    }

    onChannelUpdate(oldChannel: Discord.Channel, newChannel: Discord.Channel): void {
        if (newChannel.type === 'text') {
            const textChannel = newChannel as Discord.TextChannel;
            const MutableChannelID: string = textChannel.guild.roles.find('name', 'MutableChannel').id;

            if (textChannel.permissionOverwrites.exists('id', MutableChannelID)) {
                this.addOverwrites(textChannel);
            }
            else {
                this.removeOverwrites(textChannel);
            }
        }
    }

    onReady(client: Discord.Client): void {
        client.guilds.forEach(guild => {
            if (!guild.roles.exists('name', 'MutableChannel')) {
                guild.createRole({
                    name: 'MutableChannel',
                    permissions: []
                });
                console.log(`A MutableChannel role was not found in ${guild.name}, one has been created.\nThis is used to mute users. Please place this role above the bot's role so it is not accessable in the role command and add it to all mutable channels\n`);
            }

            guild.channels.forEach(channel => {
                this.onChannelUpdate(channel, channel);
            });
        });
    }

    private mute(message: Discord.Message, user: Discord.User): void {
        const MutableChannelID: string = message.guild.roles.find('name', 'MutableChannel').id;

        message.guild.channels.forEach(channel => {
            if (channel.type === 'text' && channel.permissionOverwrites.exists('id', MutableChannelID)) {
                channel.overwritePermissions(user, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false,
                });
            }
        });

        message.channel.send(`${message.member.user}, ${user} has been muted.`);
        console.log(`${message.author.tag} muted ${user.tag}`);

        const mutedWriteStream = fs.createWriteStream('./data/muted.txt', { flags: 'a' });
        mutedWriteStream.write(`${user.id}\n`, () => {
            this.muted.push(user.id);
            console.log('Muted txt write success');
        });

        mutedWriteStream.end();
    }

    private unMute(message: Discord.Message, user: Discord.User): void {
        const MutableChannelID: string = message.guild.roles.find('name', 'MutableChannel').id;

        message.guild.channels.forEach(channel => {
            if (channel.type === 'text' && channel.permissionOverwrites.exists('id', MutableChannelID)) {
                if (channel.permissionOverwrites.exists('id', user.id)) {
                    channel.permissionOverwrites.find('id', user.id).delete();
                }
            }
        });

        message.channel.send(`${message.member.user}, ${user} has been unmuted.`);
        console.log(`${message.author.tag} unmuted ${user.tag}`);

        this.muted.splice(this.muted.indexOf(user.id), 1);

        const mutedWriteStream = fs.createWriteStream('./data/muted.txt');
        mutedWriteStream.write(this.muted.join('\n'), () => {
            console.log('Muted txt write success');
        });
        mutedWriteStream.end();
    }

    private addOverwrites(channel: Discord.TextChannel): void {
        this.muted.forEach(userID => {
            if (!channel.permissionOverwrites.exists('id', userID)) {
                channel.overwritePermissions(userID, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false
                });
            }
        });
    }

    private removeOverwrites(channel: Discord.TextChannel): void {
        this.muted.forEach(userID => {
            if (channel.permissionOverwrites.exists('id', userID)) {
                channel.permissionOverwrites.find('id', userID).delete();
            }
        });
    }
}