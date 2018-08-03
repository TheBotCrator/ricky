import { BasePlugin } from './base';
import Discord from 'discord.js';
import fs from 'fs';
import pluralize from 'pluralize';

export default class Filter extends BasePlugin {
    private censorWords: string[] = this.getWords();
    private regexWords: RegExp[] = this.convertToRegex(this.censorWords);

    private offenders: { [key: string]: { [key: string]: any } } = require('../../data/offenders.json');

    onMessage(message: Discord.Message, command: string): boolean {
        const msg: string = message.content.trim().toLowerCase();

        return this.regexWords.some(regex => {
            if (regex.test(msg)) {
                message.delete().then(() => message.channel.send(`${message.member.user}, that kind of language is not tolerated here.`));

                const badWord: string = (msg.match(regex) as string[])[0]; // Cast it as string[] becuase we already know a word is in there, just grab the first one
                const authorAsString: string = message.author.toString();

                // If uer is in offenders JSON their info is updated
                // else, their info is added to offenders JSON
                if (this.offenders.hasOwnProperty(authorAsString)) {
                    this.offenders[authorAsString]['offenses']++;
                    this.offenders[authorAsString]['messages'].push(msg);
                    console.log(`\t${message.author.tag} message contained: ${badWord}, ${this.offenders[authorAsString]['offenses']} offenses`);
                }
                else {
                    this.offenders[authorAsString] = { 'offenses': 1, 'messages': [msg] };
                    console.log(`\t${message.author.tag} message contained : ${badWord}, first offence`);
                }

                // Write to offenders file
                const offendersWriteStream: fs.WriteStream = fs.createWriteStream('./data/offenders.json');
                offendersWriteStream.write(JSON.stringify(this.offenders, null, 4), () => {
                    console.log('Offender JSON write success');
                });
                offendersWriteStream.end();

                // Gets all memebers of the server, if member has "Moderator" role a private message is sent informing them about the infraction
                message.guild.fetchMembers().then(pGuild => {
                    pGuild.members.forEach(member => {
                        if (member.roles.exists('name', 'Moderator')) {
                            member.send(`${message.author}'s message contained "${badWord}" in the ${message.channel} channel, ${this.offenders[authorAsString]['offenses']} offenses`);
                        }
                    });
                });

                return true;
            }
            else {
                return false;
            }
        });
    }

    onMessageUpdate(oldMessage: Discord.Message, newMessage: Discord.Message): void {
        this.onMessage(newMessage, '');
    }

    onReady(client: Discord.Client): void {
        console.log(`List of censored words:\n\t${this.censorWords}\n`);
    }

    private getWords(): string[] {
        const words: string[] = [];

        fs.readFileSync(`./data/censor.txt`, { encoding: 'utf8' })
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
            .split(' ')
            .filter(Boolean)
            .forEach(word => {
                words.push(word, pluralize(word));
            });

        return words;
    }

    private convertToRegex(censorList: string[]): RegExp[] {
        const replace: { [key: string]: string } = { 'a': '(a|4|@)', 'b': '(b|8)', 'c': '(c|<)', 'e': '(e|3)', 'f': '(f|ph)', 'g': '(g|6|9)', 'i': '(i|1)', 'l': '(l|1)', 'o': '(o|0)', 's': '(s|5|$)', 't': '(t|7|\\+)', 'w': '(w|vv)' };
        const regexList: RegExp[] = [];

        // Loop over every word in censor, creating a regex pattern and adding it to an array
        censorList.forEach(word => {
            // Loop over every letter in the word, replacing each letter with the letter and it's most common substitutes
            const wordUpdate: string[] = word.split('').map(letter => {
                return replace.hasOwnProperty(letter) ? replace[letter] : letter;
            });

            let sen: string = '(?=(?!\\w)|\\b)' + wordUpdate[0] + '+';

            for (let i = 1; i < wordUpdate.length; i++) {
                sen += ('\\s*' + wordUpdate[i] + '+');
            }

            regexList.push(new RegExp(sen + '(?!\\w)'));
        });

        return regexList;
    }
}