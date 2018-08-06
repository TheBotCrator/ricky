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
            // Checks if the user has correct permissions to use this command
            if (message.member.roles.exists('name', 'Admin') || message.member.roles.exists('name', 'Moderator')) {

                // List of everyone the user has tagged in their message
                const mentionedUsers: Discord.User[] = message.mentions.users.array();

                if (mentionedUsers.length) {
                    mentionedUsers.forEach(user => {
                        // Stupidity check
                        if (user === message.author) {
                            message.channel.send(`${message.author}, you cannot mute yourself.`);
                        }
                        else {
                            // If the user is muted, unmute them. If they are not muted, mute them.
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
                    message.channel.send(`${message.author}, please put the user(s) you wish to mute (ex: \`${this.prefix}mute @user @user, @user\`).`);
                }
            }
            else {
                message.channel.send(`${message.author}, 'you do not have permission to use that command.'`);
            }
            return true;
        }
        else {
            return false;
        }
    }

    onChannelUpdate(oldChannel: Discord.Channel, newChannel: Discord.Channel): void {
        if (newChannel.type === 'text') {
            const textChannel: Discord.TextChannel = newChannel as Discord.TextChannel;
            const MutableChannelID: string = textChannel.guild.roles.find('name', 'MutableChannel').id;

            // If the channel has the MutableChannel overwrite, add permission overwrites for muted users
            // If not, remove the muted overwrites
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
            // Create a MutableChannel role if one is not there already
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

        // Check if the channel has the MutableChannel overwrite, if it does, mute the provided user in that channel
        message.guild.channels.forEach(channel => {
            if (channel.type === 'text' && channel.permissionOverwrites.exists('id', MutableChannelID)) {
                channel.overwritePermissions(user, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false,
                });
            }
        });

        message.channel.send(`${user} has been muted.`);
        console.log(`${message.author.tag} muted ${user.tag}`);

        // Updated muted.txt
        const mutedWriteStream: fs.WriteStream = fs.createWriteStream('./data/muted.txt', { flags: 'a' });
        mutedWriteStream.write(`${user.id}\n`, () => {
            this.muted.push(user.id);
            console.log('Muted txt write success');
        });
        mutedWriteStream.end();
    }

    private unMute(message: Discord.Message, user: Discord.User): void {
        const MutableChannelID: string = message.guild.roles.find('name', 'MutableChannel').id;

        // If the channel has the MutableChannel overwrite, and that user is muted, remove the mute
        message.guild.channels.forEach(channel => {
            if (channel.type === 'text' && channel.permissionOverwrites.exists('id', MutableChannelID)) {
                if (channel.permissionOverwrites.exists('id', user.id)) {
                    channel.permissionOverwrites.find('id', user.id).delete();
                }
            }
        });

        message.channel.send(`${user} has been unmuted.`);
        console.log(`${message.author.tag} unmuted ${user.tag}`);

        this.muted.splice(this.muted.indexOf(user.id), 1);

        // Updated muted.txt sync, this is done if multiple people are unmuted
        const mutedOpen: number = fs.openSync('./data/muted.txt', 'w');
        if (this.muted.length) {
            fs.writeSync(mutedOpen, this.muted.join('\n') + '\n');
            console.log('Muted txt write success');
        }
        fs.closeSync(mutedOpen);
    }

    // Add overwrites to the channel for each muted user
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

    // Remove overwrites to the channel for each muted user
    private removeOverwrites(channel: Discord.TextChannel): void {
        this.muted.forEach(userID => {
            if (channel.permissionOverwrites.exists('id', userID)) {
                channel.permissionOverwrites.find('id', userID).delete();
            }
        });
    }
}