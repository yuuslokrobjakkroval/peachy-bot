const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class LevelDisable extends Command {
    constructor(client) {
        super(client, {
            name: 'level-disable',
            description: {
                content: 'Disables the level system for your server.',
                examples: ['level-disable'],
                usage: 'level-disable',
            },
            category: 'leveling',
            aliases: ['level-disable'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, language) {
        try {
            const guildId = ctx.guild.id;
            const embed = client.embed().setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() });

            // Check if any user has level settings in this guild
            const usersWithLevelSettings = await Users.find({ 'levelBackground.guildId': guildId });
            if (usersWithLevelSettings.length === 0) {
                return await client.utils.oops(client, ctx, 'Level system is not set up. There is nothing to disable.');
            }

            // Update all users in the guild to remove level settings
            await Users.updateMany(
                { 'levelBackground.guildId': guildId },
                {
                    $set: {
                        'levelBackground.channelId': null,
                        'levelBackground.useEmbed': false,
                        'levelBackground.messages': [
                            { content: 'Congratulations <@${userId}>! You leveled up to level ${userLevel}!' }
                        ]
                    }
                }
            );

            embed.setDescription('Level system disabled successfully!');
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error disabling level system:', error);
            await client.utils.oops(client, ctx, 'An error occurred while disabling the level system.');
        }
    }
};
