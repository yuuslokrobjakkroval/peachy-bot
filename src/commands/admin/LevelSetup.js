const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class LevelSetup extends Command {
    constructor(client) {
        super(client, {
            name: 'level-setup',
            description: {
                content: 'Set up level settings for your server.',
                examples: ['level-setup channel #levels', 'level-setup embed true'],
                usage: 'level-setup <set>',
            },
            category: 'leveling',
            aliases: [],
            cooldown: 5,
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            slashCommand: false,
            options: [
                {
                    name: 'set',
                    description: 'Sets up the level system for your server.',
                    type: 1,
                    options: [
                        {
                            name: 'channel',
                            description: 'The channel where level messages will be sent.',
                            type: 7, // Channel type
                            required: true,
                        },
                        {
                            name: 'embed',
                            description: 'Whether to send level-up messages as embeds.',
                            type: 5, // Boolean type
                            required: false,
                        },
                    ],
                },
                {
                    name: 'reset',
                    description: 'Resets the level system to its default state.',
                    type: 1,
                },
                {
                    name: 'view',
                    description: 'Shows the current level system settings.',
                    type: 1,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const embed = client.embed().setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() });

        const subCommand = ctx.isInteraction ? ctx.interaction.options.data[0].name : args[0];

        switch (subCommand) {
            case 'set': {
                const channel = ctx.isInteraction ? ctx.interaction.options.getChannel('channel') : ctx.message.mentions.channels.first();
                const useEmbed = ctx.isInteraction ? ctx.interaction.options.getBoolean('embed') || false : args[2] === 'true';

                if (!channel) {
                    return await client.utils.oops(client, ctx, 'Please specify a valid channel.', color);
                }

                // Update all users in the server to have default level background settings
                await Users.updateMany(
                    { 'levelBackground.guildId': ctx.guild.id },
                    {
                        $set: {
                            'levelBackground.channelId': channel.id,
                            'levelBackground.useEmbed': useEmbed,
                            'levelBackground.messages': [
                                { content: 'Congratulations <@${userId}>! You leveled up to level ${userLevel}!' }
                            ]
                        }
                    },
                    { upsert: true }
                );

                embed.setDescription('Level system set up successfully!');
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'reset': {
                await Users.updateMany(
                    { 'levelBackground.guildId': ctx.guild.id },
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

                embed.setDescription('Level system has been reset.');
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'view': {
                const users = await Users.find({ 'levelBackground.guildId': ctx.guild.id });
                if (users.length === 0) {
                    return await client.utils.oops(client, ctx, 'No level system is set up.', color);
                }

                const userSettings = users[0].levelBackground;

                embed
                    .setColor(color.main)
                    .setDescription(`Level system settings:\nChannel: <#${userSettings.channelId}>\nEmbed: ${userSettings.useEmbed ? 'Enabled' : 'Disabled'}`);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default:
                await client.utils.oops(client, ctx, `Please provide a valid subcommand for the \`${this.name}\` command.`, color);
                break;
        }
    }
};
