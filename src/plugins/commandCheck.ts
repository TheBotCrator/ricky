import { BasePlugin } from './base';
import Discord from 'discord.js';

export default class Check extends BasePlugin {
    onMessage(message: Discord.Message, command: string): boolean {
        // Check if message starts with the correct prefix for commands
        if (message.content.startsWith(this.prefix)) {
            console.log(`\t${message.author.tag}: ${message.content}`);
            return false;
        }
        else {
            return true;
        }
    }
}