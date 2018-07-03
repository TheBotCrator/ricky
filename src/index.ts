//-----------------------------------------------
// GLOBAL && REQUIREMENTS
//-----------------------------------------------

// Checks for necessary files in the directory
import * as fs from 'fs';
CheckNecessaryFiles();

import * as Discord from 'discord.js';
import { plugins } from './plugin.loader';

// Login credentials and prefix for the bot
const token = require('../data/config.json').token as string;
const prefix = require('../data/config.json').prefix as string;

// Creates a new Dicord "Client"
const client = new Discord.Client();

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

    if (message.content.startsWith(prefix)) {
        console.log(`\t${message.author.tag}: ${message.content}`);
    }
    
    const command = message.content.slice(prefix.length).split(/ +/g)[0].toLowerCase();

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
        console.log('MUTABLECHANNEL ROLE WAS DELETED, PLEASE DO NOT DO THIS AS IT WILL BREAK THE MUTE COMMAND');
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
// UTILITY FUNCTIONS
//-----------------------------------------------

/**
 * Checks if all necessary files are in the directory.
 * If these files are not there, they are created synchronously and a console message is logged.
 * If the most important file, config.json, is not there then the process exits.
 */
function CheckNecessaryFiles() {
    // Create the main directory for all necessary txt and JSON files
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
        console.log('Data folder for all program necessary files was not found, one has been created\n');
    }

    // Create offenders JSON if one does not already exist 
    if (!fs.existsSync('./data/offenders.json')) {
        fs.writeFileSync('./data/offenders.json', '{}');
        console.log('Offenders file was not found, one has been created\n');
    }

    // Create muted user list if one does not already exist
    if (!fs.existsSync('./data/muted.txt')) {
        fs.closeSync(fs.openSync('./data/muted.txt', 'w'));
        console.log('Muted users file was not found, one has been created\n');
    }

    // Create censor list if one does not already exist
    if (!fs.existsSync('./data/censor.txt')) {
        fs.closeSync(fs.openSync('./data/censor.txt', 'w'));
        console.log('CENSORED WORD FILE WAS NOT FOUND, ONE HAS BEEN CREATED\nPLEASE EDIT THIS FILE BY PLACING EACH WORD ON A NEW LINE\n');
    }

    // Create config JSON if one does not already exist
    if (!fs.existsSync('./data/config.json')) {
        fs.writeFileSync('./data/config.json', '{\n\t"prefix" : "PREFIX_HERE",\n\t"token" : "DISCORD_TOKEN_HERE"\n}');
        console.log('***CONFIG JSON NOT DETECTED, ONE HAS BEEN CREATED***\n***PLEASE EDIT THIS FILE TO INCLUDE PREFIX AND DISCORD TOKEN***\n');
        process.exit(0);
    }
}

//-----------------------------------------------
// DISCORD API LOGIN
//-----------------------------------------------

client.login(token);