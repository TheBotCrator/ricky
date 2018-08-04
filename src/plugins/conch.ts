import { BasePlugin } from './base';
import * as Discord from 'discord.js';

export default class Conch extends BasePlugin {
    onMessage(message: Discord.Message, command: string) {
        if (command === 'conch') {
            const arg: string = message.content.slice(this.prefix.length + command.length).replace(/\s+/g, ' ').trim();
            
            if (arg) {
                message.channel.send('Evan: "We\'re working on it."');
                console.log('The Conch has responded');
            }
            else {
                message.channel.send(`${message.member.user}, you need to actually ask me a question (ex: \`${this.prefix}Conch Thing?\`).`);
            }

            return true;
        }
        else {
            return false;
        }
    }
}