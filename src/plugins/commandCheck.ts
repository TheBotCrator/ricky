import { BasePlugin } from './base';
import Discord from 'discord.js';

export default class Check extends BasePlugin {
    onMessage(message: Discord.Message, command: string): boolean {
        return !message.content.startsWith(this.prefix);
    }
}