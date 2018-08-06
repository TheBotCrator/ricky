import { BasePlugin } from './plugins/base';

// Each plugin will be evaluated in this order, most of the time it will be for the onMessage()
// This is the order that onMessage() will be evaluated in
const PluginConfig = [
    './plugins/filter',
    './plugins/commandCheck',
    './plugins/roles',
    './plugins/mute',
    './plugins/offenders',
    './plugins/conch',
];

export const plugins: BasePlugin[] = [];
PluginConfig.forEach(path => {
    // Get each class
    let bClass = require(path);

    try {
        plugins.push(new bClass.default());
    }
    catch (err) {
        //This is only here if there is no default export for classes
    }
});