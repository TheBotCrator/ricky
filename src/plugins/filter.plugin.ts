import { BasePlugin } from './base.plugin';
import * as Discord from 'discord.js';
import * as fs from 'fs';
import * as pluralize from 'pluralize';

const offenders = require('../../data/offenders.json');

const censor = convertToRegex(
    fs.readFileSync('./data/censor.txt', 'utf8')
        .trim()
        .toLowerCase()
        .replace(/(\r\n|\n){2,}/g, '\n')
        .split(/\r\n|\n/)
        .filter(Boolean)
        .reduce((r, e) =>
            r.push(e, pluralize(e)) && r, []
        )
);

export default class Filter extends BasePlugin {
    onMessage(message: Discord.Message, command: string) {
        const msg = message.content.trim().toLowerCase();

        let saidBad = censor.some(regex => {
            // Check if user message contains a censored word
            if (regex.test(msg)) {
                let word = msg.match(regex)[0];

                let authorAsString = message.author.toString();

                // If uer is in offenders JSON their info is updated
                // else, their info is added to offenders JSON
                if (offenders.hasOwnProperty(authorAsString)) {
                    offenders[authorAsString]['offenses']++;
                    offenders[authorAsString]['messages'].push(message.content);
                    console.log(`\t${message.author.tag} message contained: ${word}, ${offenders[authorAsString]['offenses']} offenses`);
                }
                else {
                    offenders[authorAsString] = { offenses: 1, messages: [message.content] };
                    console.log(`\t${message.author.tag} message contained : ${word}, first offence`);
                }

                // Updates offender JSON file
                fs.writeFile('./data/offenders.json', JSON.stringify(offenders, null, 4), 'utf8', err => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('Offender JSON write success');
                    }
                });

                // Gets all memebers of the server, if member has "Moderator" role a private message is sent informing them about the infraction
                message.guild.fetchMembers()
                    .then(pGuild => {
                        pGuild.members.forEach(member => {
                            if (member.roles.exists('name', 'Moderator')) {
                                member.send(`${message.author}'s message contained "${word}" in the ${message.channel} channel, ${offenders[authorAsString]['offenses']} offenses`);
                            }
                        });
                    });

                message.delete(250).then(() => message.channel.send(`${message.member.user}, that kind of language is not tolerated here.`));

                return true;
            }
            else {
                return false;
            }
        });

        return saidBad || !message.content.startsWith(this.prefix);
    }

    onMessageUpdate(newMessage: Discord.Message): void {
        this.onMessage(newMessage, null);
    }
}

/**
 * Takes each word in the censor list and creates a new array with a corresponding regex expression for testing in the word filter
 * @param {Array<string>} censor array containing list of banned words
 */
function convertToRegex(censor: Array<string>) {
    //Logs list of censored words
    console.log(`List of censored words:\n\t${censor}\n`);

    let replace = { 'a': '(a|4|@)', 'b': '(b|8)', 'c': '(c|<)', 'e': '(e|3)', 'f': '(f|ph)', 'g': '(g|6|9)', 'i': '(i|1)', 'l': '(l|1)', 'o': '(o|0)', 's': '(s|5|$)', 't': '(t|7|\\+)', 'w': '(w|vv)' };
    let regex = [];

    // Loop over every word in censor, creating a regex pattern and adding it to an array
    censor.forEach(word => {
        let wordUpdate = word.split('').map(letter => {
            return replace.hasOwnProperty(letter) ? replace[letter] : letter;
        });

        let sen = '(?=(?!\\w)|\\b)' + wordUpdate[0] + '+';

        for (let i = 1; i < wordUpdate.length; i++) {
            sen += ('\\s*' + wordUpdate[i] + '+');
        }

        regex.push(new RegExp(sen + '(?!\\w)'));
    });

    return regex;
}