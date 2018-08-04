import { BasePlugin } from './base';
import * as Discord from 'discord.js';

export default class Offenders extends BasePlugin {

    private offenders: { [key: string]: { [key: string]: any } } = require('../../data/offenders.json');

    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'offender' || command === 'offenders') {
            // Check if user has permission to use this commadn
            if (message.member.roles.exists('name', 'Admin') || message.member.roles.exists('name', 'Moderator')) {

                // Gets a list of all the users the user tagged
                const mentionedUsers: Discord.User[] = message.mentions.users.array();

                // If they tagged people for a lookup
                if (mentionedUsers.length) {
                    // Delete the message so people don't know they've been audited
                    message.delete();

                    // Look up each user individually
                    mentionedUsers.forEach(user => {
                        this.oneLookUp(message, user);
                    });
                }
                else {
                    // Just send a general list of who's said bad stuff
                    this.allLookUp(message);
                }
            }
            else {
                message.channel.send(`${message.member.user}, you do not have permission to use that command.`);
            }

            return true;
        }
        else {
            return false;
        }
    }

    private allLookUp(message: Discord.Message) {
        let count: number = 0;
        let users: string = '';

        // Just loop over everyone in offenders and add them to a list
        for (let user in this.offenders) {
            if (this.offenders.hasOwnProperty(user)) {
                count++;
                users += (user + '\n');
            }
        }

        let sen: string = '**NUMBER OF OFFENDERS: **' + count + '\n\n';

        // If there are 1 or more people, append a list of who they are
        if (count !== 0) {
            sen += ('**OFFENDERS:**\n' + users);
        }

        message.author.send(sen);
        message.channel.send(`${message.member.user}, I have sent you a list of language offenders.`);

        console.log(`Sent ${message.author.tag} a list of language offenders`);
    }

    private oneLookUp(message: Discord.Message, user: Discord.User) {
        // Check if the user has a record
        if (this.offenders.hasOwnProperty(user.toString())) {
            const userData: { [key: string]: any } = this.offenders[user.toString()];
            let sen: string = '**USER:** ' + user + '\n\n**TOTAL OFFENSES:** ' + userData['offenses'] + '\n\n**MESSAGES:**\n';

            (userData['messages'] as string[]).forEach(message => {
                sen += (message + '\n');
            });

            message.author.send(sen);
        }
        else {
            message.author.send(`${user} has 0 offenses`);
        }

        console.log(`Sent ${message.author.tag} an offender summary of ${user.tag}`);
    }
}