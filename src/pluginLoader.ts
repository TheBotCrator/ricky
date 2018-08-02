import { BasePlugin } from './plugins/base';

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
    let bClass = require(path);

    try {
        plugins.push(new bClass.default());
    }
    catch (err) {
        //This is only here if there is no default export for classes
    }
});