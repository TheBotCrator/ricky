//-----------------------------------------------
// GLOBAL && REQUIREMENTS
//-----------------------------------------------

// Discord and custom Plugin Imports
import * as Discord from 'discord.js';
import { plugins } from './pluginLoader';

// Login credentials and prefix for the bot
const config: {[key: string]: string} = require('../data/config.json');

// Creates a new Dicord "Client"
const client: Discord.Client = new Discord.Client();

//-----------------------------------------------
// EVENT HANDLERS
//-----------------------------------------------

/**
 * Emitted whenever a channel is updated 0 e.g. name change, topic change.
 * Will check if the channel has the "MutableChannel" permission overwite, if so, will add
 * all muted users specific permission overwites to this channel.
 * 
 * @param {Discord.Channel} oldChannel channel before update
 * @param {Discord.Channel} newChannel channel after update
 */
client.on('channelUpdate', (oldChannel, newChannel) => {
    plugins.forEach(clss => clss.onChannelUpdate(oldChannel, newChannel));
});

/**
 * On disconnect event. Emitted when the client's WebSocket disconnects and will no longer attempt to reconnect.
 * Logs console message.
 * @param {CloseEvent} event WebSocket close event
 */
client.on('disconnect', event => {
    console.log(`\n***SERVER HAS BEEN DISCONNECTED***\nCLEAN DISCONNECT: ${event.wasClean}\nCLOSE CODE: ${event.code}`);
});

/**
 * On error event. Emitted whenever the client's WebSocket encounters a connection error.
 * Logs console message.
 * @param {error} error encountered error
 */
client.on('error', error => {
    console.log(`\n${error}\n`);
});

/**
 * On message event. Emitted whenever a message is created.
 * Handles incoming user input, message censorship, and parsing for valid commands.
 * @param {Discord.Message} message created discord message
 */
client.on('message', message => {
    // Ignore messages sent by bots and messages not sent in a text channel
    if (message.author.bot || message.channel.type !== 'text') {
        return;
    }
    
    const command: string = message.content.slice(config.prefix.length).split(' ')[0].toLowerCase();

    plugins.some(clss => clss.onMessage(message, command));
});

/**
 * On messageUpdate event. Emitted whenever a message is updated - e.g. embed or content change.
 * Filters edited message.
 * @param {Discord.Message} oldMessage The message before the update
 * @param {Discord.Message} newMessage The message after the update
 */
client.on('messageUpdate', (oldMessage, newMessage) => {
    plugins.forEach(clss => clss.onMessageUpdate(oldMessage, newMessage));
});

/**
 * On ready event. Emitted when the client becomes ready to start working.
 * Logs console message.
 */
client.on('ready', () => {
    plugins.forEach(clss => clss.onReady(client));
    console.log('Bot Online\n');
});

/**
 * On reconnect event. Emitted when the client tries to reconnect to the WebSocked. 
 * Logs console message.
 */
client.on('reconnecting', () => {
    console.log('\nReconnecting...');
});

/**
 * On resume event. Emitted whenever a WebSocket resumes. 
 * Logs console message.
 * @param {number} replayed number of events that were replayed
 */
client.on('resume', replayed => {
    console.log(`Reconnectd. ${replayed} events replayed.\n`);
});

/**
 * Emitted whenever a guild role is deleted.
 * This will check if the deleted role was MutableChannel, if so, MutableChannel is recreated as it is
 * necessary for bot functionality.
 * @param {Discord.Role} role deleted role
 */
client.on('roleDelete', role => {
    if (role.name === 'MutableChannel') {
        role.guild.createRole({
            name: 'MutableChannel',
            permissions: []
        });
        console.log('\nMUTABLECHANNEL ROLE WAS DELETED, PLEASE DO NOT DO THIS AS IT WILL BREAK THE MUTE COMMAND\n');
    }
});

/**
 * On warn event. Emitted for general warnings.
 * Logs console message.
 * @param {string} info warning
 */
client.on('warn', info => {
    console.log(`\n${info}\n`);
});

/**
 * On unhandled Promise rejection.
 * Logs console message on where and why the error happened.
 * @param {error} reason error object
 * @param {Promise} p promise that was rejected
 */
process.on('unhandledRejection', (reason, p) => {
    console.log('\nUnhandled Rejection at:');
    console.log(p);
    console.log(`Reason: ${reason}`);
});

//-----------------------------------------------
// DISCORD API LOGIN
//-----------------------------------------------

client.login(config.token);