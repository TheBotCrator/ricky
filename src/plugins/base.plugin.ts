import * as Discord from 'discord.js';

export abstract class BasePlugin {
    protected readonly prefix: string = require('../../data/config.json').prefix as string;

    onChannelUpdate(oldChannel: Discord.Channel, newChannel: Discord.Channel): void { }

    onMessage(message: Discord.Message, command: string): boolean { return false; }

    onMessageUpdate(oldMessage: Discord.Message, newMessage: Discord.Message): void { }

    onReady(client: Discord.Client): void { }
}