import { BasePlugin } from './base';
import * as Discord from 'discord.js';

const offendersJSON = require('../../data/offenders.json');

export default class Offenders extends BasePlugin {
    onMessage(message: Discord.Message, command: string): boolean {
        if (command === 'offender' || command === 'offenders') {
            // Checks if user has correct permissions to use this command
            if (message.member.roles.exists('name', 'Admin') || message.member.roles.exists('name', 'Moderator')) {
                // User object of first mentioned user
                const mentionedUser = message.mentions.users.first();

                // If there is a mentioned user it will pull up their info from the JSON and return
                // else, will return the number of offenders and all of their @'s
                if (mentionedUser) {

                    let mentionedUserAsString = mentionedUser.toString();

                    console.log(`Sent ${message.author.tag} an offender summary of ${mentionedUser.tag}`);

                    if (offendersJSON.hasOwnProperty(mentionedUserAsString)) {
                        let sen = '**USER:** ' + mentionedUser + '\n\n**TOTAL OFFENSES:** ' + offendersJSON[mentionedUserAsString]['offenses'] + '\n\n**MESSAGES:**\n';

                        offendersJSON[mentionedUserAsString]['messages'].forEach(message => {
                            sen += (message + '\n');
                        });

                        message.delete(250).then(() => message.author.send(sen));
                    }
                    else {
                        message.delete(250).then(() => message.author.send(`${mentionedUser} has 0 offenses`));
                    }
                }
                else {
                    console.log(`Sent ${message.author.tag} a list of language offenders`);
                    let count = 0;
                    let users = '';

                    for (let key in offendersJSON) {
                        if (offendersJSON.hasOwnProperty(key)) {
                            count++;
                            users += (key + '\n');
                        }
                    }

                    let sen = '**NUMBER OF OFFENDERS: **' + count + '\n\n';

                    if (count !== 0) {
                        sen += ('**OFFENDERS:**\n' + users);
                    }

                    message.author.send(sen);
                    message.channel.send(`${message.member.user}, I have sent you a list of language offenders.`);
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
}