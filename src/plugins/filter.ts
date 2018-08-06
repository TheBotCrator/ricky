import { BasePlugin } from './base';
import Discord from 'discord.js';
import fs from 'fs';
import pluralize from 'pluralize';

export default class Filter extends BasePlugin {
    // All the words in the censor.txt file
    private censorWords: string[] = this.getWords();

    // The censorWords list, but in regex form for checking
    private regexWords: RegExp[] = this.convertToRegex(this.censorWords);

    // List of language offenders
    private offenders: { [key: string]: { [key: string]: any } } = require('../../data/offenders.json');

    onMessage(message: Discord.Message, command: string): boolean {
        const msg: string = message.content.trim().toLowerCase();

        return this.regexWords.some((regex, index) => {
            // Checks if the user's message contained any banned words
            if (regex.test(msg)) {
                // Deleting that user's message is top priority
                message.delete().then(() => message.channel.send(`${message.member.user}, that kind of language is not tolerated here.`));

                // The word that triggered the regex test and it's cooresponding "normal" version 
                const badWord: string = (msg.match(regex) as string[])[0]; // Cast it as string[] becuase we already know a word is in there, just grab the first one
                const badWordinCensor: string = this.censorWords[index];
                const userAsString: string = message.author.toString();

                // If uer is in offenders JSON their info is updated
                // else, their info is added to offenders JSON
                if (this.offenders.hasOwnProperty(userAsString)) {
                    this.offenders[userAsString]['offenses']++;
                    this.offenders[userAsString]['messages'].push(msg);
                    console.log(`\t${message.author.tag} message contained: ${badWord} (${badWordinCensor}), ${this.offenders[userAsString]['offenses']} offenses`);
                }
                else {
                    this.offenders[userAsString] = { 'offenses': 1, 'messages': [msg] };
                    console.log(`\t${message.author.tag} message contained : ${badWord} (${badWordinCensor}), first offence`);
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
                            member.send(`${message.author}'s message contained "${badWord}" (${badWordinCensor}) in the ${message.channel} channel, ${this.offenders[userAsString]['offenses']} offenses`);
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

    // Gets all of the words in censor.txt and pluralizes them
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

    // Converts all the strings inside the list to word boundary regex checks 
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