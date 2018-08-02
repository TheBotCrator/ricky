import { BasePlugin } from './base';
import * as Discord from 'discord.js';

export default class Offenders extends BasePlugin {

    private offenders: { [key: string]: { [key: string]: any } } = require('../../data/offenders.json');

    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'offender' || command === 'offenders') {
            if (message.member.roles.exists('name', 'Admin') || message.member.roles.exists('name', 'Moderator')) {
                const mentionedUsers: Discord.User[] = message.mentions.users.array();

                if (mentionedUsers.length) {
                    message.delete();

                    mentionedUsers.forEach(user => {
                        this.oneLookUp(message, user);
                    });
                }
                else {
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

        for (let user in this.offenders) {
            if (this.offenders.hasOwnProperty(user)) {
                count++;
                users += (user + '\n');
            }
        }

        let sen = '**NUMBER OF OFFENDERS: **' + count + '\n\n';

        if (count !== 0) {
            sen += ('**OFFENDERS:**\n' + users);
        }

        message.author.send(sen);
        message.channel.send(`${message.member.user}, I have sent you a list of language offenders.`);

        console.log(`Sent ${message.author.tag} a list of language offenders`);
    }

    private oneLookUp(message: Discord.Message, user: Discord.User) {
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