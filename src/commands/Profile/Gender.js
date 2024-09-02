const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Gender extends Command {
    constructor(client) {
        super(client, {
            name: 'gender',
            description: {
                content: 'Sets, resets, or shows your gender.',
                examples: [
                    'gender male',
                    'gender female',
                    'gender reset',
                    'gender show',
                    'gender help'
                ],
                usage: 'gender <male || female || reset || show || help>',
            },
            category: 'profile',
            aliases: [],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'set',
                    description: 'Sets the gender in profile card',
                    type: 1,
                    options: [
                        {
                            name: 'text',
                            description: 'The gender to set (male/female/other).',
                            type: 3,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'reset',
                    description: 'Resets the gender to the default one',
                    type: 1,
                },
                {
                    name: 'show',
                    description: 'Show the current gender for you.',
                    type: 1,
                },
                {
                    name: 'help',
                    description: 'Displays example and usage information for the command.',
                    type: 1,
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        const user = await Users.findOne({ userId: ctx.author.id });
        const embed = client.embed().setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() });

        const subCommand = ctx.isInteraction ? ctx.interaction.options.data[0].name : args[0];

        switch (subCommand) {
            case 'help': {
                embed
                    .setColor(client.color.main)
                    .setDescription(`**Usage:** \`gender <male || female || reset || show || help>\`\n\n**Examples:**\n\`gender male\`\n\`gender female\`\n\`gender reset\`\n\`gender show\`\n\`gender help\``);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'reset': {
                embed
                    .setColor(client.color.main)
                    .setDescription('Your gender has been reset.');

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.gender': 'Not specified' } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'show': {
                embed
                    .setColor(client.color.main)
                    .setDescription(user.profile.gender ? `\`\`\`arm\n${user.profile.gender}\`\`\`` : 'Not specified.');

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                const text = ctx.isInteraction ? ctx.interaction.options.data[0]?.options[0]?.value?.toString() : args.join(' ');

                if (!text || !['male', 'female', 'other'].includes(text.toLowerCase())) {
                    await client.utils.oops(client, ctx, 'Please provide a valid gender (male, female, other).');
                    return;
                }

                embed
                    .setDescription('Your gender has been set.')
                    .addFields([{ name: 'New gender', value: `\`\`\`arm\n${text}\n\`\`\``, inline: false }]);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.gender': text } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }
        }
    }
};
