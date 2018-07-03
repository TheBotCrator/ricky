import { BasePlugin } from './plugins/base.plugin';

const PluginConfig = [
    './plugins/filter.plugin',
    './plugins/roles.plugin',
    './plugins/mute.plugin',
    './plugins/offenders.plugin',
    './plugins/conch.plugin',
];

const plugins: Array<BasePlugin> = [];
PluginConfig.forEach(path => {
    let bClass = require(path);

    try {
        plugins.push(new bClass.default());
    }
    catch (err) {
        //This is only here if there is no default export for classes
    }
});

export { plugins };