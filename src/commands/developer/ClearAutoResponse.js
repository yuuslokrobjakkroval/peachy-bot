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

    async run(client, ctx, args, color, emoji, language) {
        const guildId = ctx.guild.id;
        
        // Find the response document for this guild
        const responseDoc = await Response.findOne({ guildId });

        if (!responseDoc || !responseDoc.autoresponse || responseDoc.autoresponse.length === 0) {
            return ctx.sendErrorMessage(client, ctx, 'No autoresponses found to clear for this guild.', color);
        }

        // Clear all autoresponse entries
        responseDoc.autoresponse = [];
        
        // Save the updated document
        await responseDoc.save();

        // Send a success message
        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(`${emoji.tick} Successfully cleared all autoresponses for this guild.`);

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
