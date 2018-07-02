import * as Discord from 'discord.js';

export abstract class BasePlugin {
    prefix: string;
    constructor() {
        this.prefix = require('../../data/config.json').prefix as string;
    }

    onChannelUpdate(oldChannel, newChannel): void {
    }

    onMessage(message: Discord.Message, command: string): boolean {
        return false;
    }

    onMessageUpdate(newMessage: Discord.Message): void {
    }

    onReady(client: Discord.Client): void {
    }
}