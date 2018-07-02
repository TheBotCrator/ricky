import { BasePlugin } from './base.plugin';
import * as fs from 'fs';
import * as Discord from 'discord.js';

const muted = fs.readFileSync('./data/muted.txt', 'utf8').trim().split(/\r\n|\n/).filter(Boolean);

export default class Mute extends BasePlugin {
    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'mute' || command === 'unmute') {
            // Checks if user has correct permissions to use this command
            if (message.member.roles.exists('name', 'Admin') || message.member.roles.exists('name', 'Moderator')) {
                // User object of first mentioned user
                const mentionedUser = message.mentions.users.first();

                if (mentionedUser) {
                    // Stupidity check
                    if (mentionedUser === message.author) {
                        message.channel.send(`${message.member.user}, you cannot mute yourself.`);
                        return true;
                    }

                    let mentionedUserID = mentionedUser.id;
                    let MutableChannelID = message.guild.roles.find('name', 'MutableChannel').id;

                    // Checks if user is already muted
                    if (muted.includes(mentionedUserID)) {
                        // Iterates over every channel in the server, deleting the user specific permission overwrite
                        message.guild.channels.array()
                            .forEach(gChannel => {
                                if (gChannel.type === 'text' && gChannel.permissionOverwrites.exists('id', MutableChannelID)) {
                                    gChannel.permissionOverwrites.some(overwrite => {
                                        if (overwrite.id === mentionedUserID) {
                                            overwrite.delete();
                                            return true;
                                        }
                                    });
                                }
                            });

                        console.log(`${message.author.tag} unmuted ${mentionedUser.tag}`);

                        // Updates the muted user array
                        muted.splice(muted.indexOf(mentionedUserID), 1);

                        // Updates muted user file
                        fs.writeFile('./data/muted.txt', muted.join('\n'), 'utf8', (err) => {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log('Muted txt write success');
                            }
                        });

                        message.channel.send(`${message.member.user}, that user has been unmuted.`);
                    }
                    else {
                        // Iterates over every channel in the server, adding a user specific permission overwrite that does not allow
                        // that user to send messages or add reactions
                        message.guild.channels.array()
                            .forEach(gChannel => {
                                if (gChannel.type === 'text' && gChannel.permissionOverwrites.exists('id', MutableChannelID)) {
                                    gChannel.overwritePermissions(mentionedUser, {
                                        SEND_MESSAGES: false,
                                        ADD_REACTIONS: false,
                                    });
                                }
                            });

                        console.log(`${message.author.tag} muted ${mentionedUser.tag}`);

                        // Updates the muter user array
                        muted.push(mentionedUser.id);

                        // Updates muted user file
                        fs.appendFile('./data/muted.txt', mentionedUserID + '\n', 'utf8', (err) => {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log('Muted txt write success');
                            }
                        });

                        message.channel.send(`${message.member.user}, that user has been muted.`);
                    }
                }
                else {
                    message.channel.send(`${message.member.user}, please put the user you wish to mute (ex: \`${this.prefix}mute @user\`).`);
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

    onChannelUpdate(newChannel: Discord.Channel, oldChannel: Discord.Channel): void {
        if (newChannel.type === 'text') {
            // Cast newChannel to a Text Channel
            let textChannel = newChannel as Discord.TextChannel;

            // Get MutableChannelID
            let MutableChannelID = textChannel.guild.roles.find('name', 'MutableChannel').id;

            // If channel has mutableChannel, add user specific overwites
            if (textChannel.permissionOverwrites.exists('id', MutableChannelID)) {
                muted.forEach(userID => {
                    if (!textChannel.permissionOverwrites.exists('id', userID)) {
                        textChannel.overwritePermissions(userID, {
                            SEND_MESSAGES: false,
                            ADD_REACTIONS: false
                        });
                    }
                });
            }
            // If it doesn't, remove user specific overwrites if the user is in the muted list
            else {
                textChannel.permissionOverwrites.array().forEach(overwrite => {
                    muted.some(userID => {
                        if (overwrite.id === userID) {
                            overwrite.delete();
                            return true;
                        }
                    });
                });
            }
        }
    }

    onReady(client: Discord.Client): void {
        //Check if MutableChannel is a role, if not, create
        client.guilds.array().forEach(guild => {
            if (!guild.roles.exists('name', 'MutableChannel')) {
                guild.createRole({
                    name: 'MutableChannel',
                    permissions: []
                });
                console.log(`A MutableChannel role was not found in ${guild.name}, one has been created.\nThis is used to mute users. Please place this role above the bot's role so it is not accessable in the role command and add it to all mutable channels\n`);
            }

            guild.channels.array().forEach(channel => {
                this.onChannelUpdate(channel, null);
            });
        });
    }
}