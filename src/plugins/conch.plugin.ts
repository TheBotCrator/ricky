import { BasePlugin } from './base.plugin';
import * as Discord from 'discord.js';

export default class Conch extends BasePlugin {
    onMessage(message: Discord.Message, command: string) {
        if (command === 'conch') {
            const arg = message.content.slice(this.prefix.length + command.length).replace(/\s+/g, ' ').trim();

            if (arg) {
                console.log('The Conch has responded');
                message.channel.send('Evan: "We\'re working on it."');
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