const { Command } = require('../../structures/index.js');
const Response = require('../../schemas/response');

module.exports = class ClearAutoResponse extends Command {
    constructor(client) {
        super(client, {
            name: 'clearautoresponse',
            description: {
                content: 'Clear all autoresponse triggers for this guild.',
                examples: ['clearAutoResponse'],
                usage: 'clearAutoResponse',
            },
            category: 'developer',
            aliases: ['clearar'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: true,
                staff: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        try {
            const guildId = ctx.guild.id;
            Response.findOne({ guildId }).then(responseDoc => {
                if (!responseDoc || !responseDoc.autoresponse || responseDoc.autoresponse.length === 0) {
                    return client.utils.sendErrorMessage(client, ctx, 'No autoresponses found to clear for this guild.', color);
                }

                // Clear all autoresponse entries
                responseDoc.autoresponse = [];
                responseDoc.save();

                // Send a success message
                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(`${emoji.tick} Successfully cleared all autoresponses for this guild.`);

                return client.utils.sendMessage({embeds: [embed]});
            })
        } catch (error) {
            console.error('Error in Clear Respond Command:', error);
            // const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;
            // return client.utils.sendErrorMessage(client, ctx, balanceMessages.errors.fetchFail, color);
            return client.utils.sendErrorMessage(client, ctx, 'Clear Response is Error', color);
        }
    }
};
