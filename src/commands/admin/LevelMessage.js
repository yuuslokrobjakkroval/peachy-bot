const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class LevelMessage extends Command {
    constructor(client) {
        super(client, {
            name: 'level-message',
            description: {
                content: 'Set a custom level-up message. Available variables: {userMention}, {userName}, {userLevel}.',
                examples: ['level-message Congratulations {userMention} on reaching level {userLevel}!'],
                usage: 'level-message <message>',
            },
            category: 'leveling',
            aliases: [],
            cooldown: 5,
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'message',
                    description: 'The custom level-up message. Available variables: {userMention}, {userName}, {userLevel}.',
                    type: 3, // Type 3 for STRING
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        try {
            if (!ctx.guild) {
                return await ctx.sendMessage({ content: 'This command can only be used in a server.', ephemeral: true });
            }

            const guildId = ctx.guild.id;
            const userMessage = ctx.isInteraction ? ctx.interaction.options.getString('message') : args.join(' ');

            const variables = {
                '{userMention}': `<@${ctx.author.id}>`,
                '{userName}': ctx.author.username,
                '{userLevel}': '{userLevel}', // Placeholder for the user's level
            };

            // Update the user's level message
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await ctx.sendMessage({ content: 'User not found.', ephemeral: true });
            }

            user.levelBackground.messages[0].content = userMessage.replace(/{(.*?)}/g, (match, variable) => variables[variable] || match);
            await user.save();

            await ctx.sendMessage('Custom level-up message set successfully!');
        } catch (error) {
            console.error('Error setting custom level-up message:', error);
            await ctx.sendMessage({ content: 'An error occurred while setting the custom level-up message.', ephemeral: true });
        }
    }
};
