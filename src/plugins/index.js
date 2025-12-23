const fs = require('fs');

function loadPlugins(client) {
    const pluginsFolder = __dirname;
    const pluginFiles = fs.readdirSync(pluginsFolder).filter((file) => file.endsWith('.js') && file !== 'index.js');

    pluginFiles.forEach(async (file) => {
        const plugin = require(`./${file}`);
        if (plugin.initialize) plugin.initialize(client);
        client.logger.info(`Loaded plugin: ${plugin.name} v${plugin.version}`);
    });
}

module.exports = loadPlugins;
