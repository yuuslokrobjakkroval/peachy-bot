const { Command } = require('../../structures/index.js');
const moment = require('moment');
const Users = require('../../schemas/User.js');

module.exports = class Birthday extends Command {
    constructor(client) {
        super(client, {
            name: 'birthday',
            description: {
                content: 'Sets, resets, shows, or provides help for your profile birthday.',
                examples: [
                    'birthday 20-03-2024',
                    'birthday reset',
                    'birthday show',
                    'birthday help'
                ],
                usage: 'birthday <date || reset || show || help>',
            },
            category: 'profile',
            aliases: ['bd'],
            cooldown: 5,
            args: true,
            guildOnly: false,
            player: {
                voice: false,
                active: false,
            },
            permissions: {
                admin: false,
                dev: false,
                staff: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'set',
                    description: 'Sets the birthday in the profile card.',
                    type: 1,
                    options: [
                        {
                            name: 'date',
                            description: 'The date you want to set as your birthday.',
                            type: 3,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'reset',
                    description: 'Resets the birthday to the default one',
                    type: 1,
                },
                {
                    name: 'show',
                    description: 'Show your birthday.',
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

    async run(client, ctx, args) {
        const user = await Users.findOne({ userId: ctx.author.id });
        const embed = client.embed().setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() });

        const subCommand = ctx.isInteraction ? ctx.interaction.options.data[0].name : args[0];
        const dateFormats = ['DD-MM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'MM-DD-YYYY', 'DD/MM/YYYY'];

        switch (subCommand) {
            case 'help': {
                embed
                    .setColor(client.color.main)
                    .setDescription(`**Usage:** \`birthday <date || reset || show || help>\`\n\n**Examples:**\n\`birthday 20-03-2024\`\n\`birthday reset\`\n\`birthday show\`\n\`birthday help\``);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'reset': {
                embed
                    .setColor(client.color.main)
                    .setDescription('The birthday for you has been reset.');

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.birthday': null } }).exec();

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'show': {
                embed
                    .setColor(client.color.main)
                    .setDescription(user.profile.birthday ? `The birthday for you is **\`${user.profile.birthday}\`**.` : 'No birthday set.');

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                let date = ctx.isInteraction ? ctx.interaction.options.data[0]?.options[0]?.value.toString() : args.join(' ');

                if (!date) {
                    await client.utils.oops(client, ctx, 'Please provide a valid date for your birthday or a valid subcommand.');
                    return;
                }

                let parsedDate;
                for (const format of dateFormats) {
                    parsedDate = moment(date, format, true);
                    if (parsedDate.isValid()) break;
                }

                if (!parsedDate.isValid()) {
                    embed.setColor(client.color.main).setDescription(`The date must be in one of the supported formats:\n• DD-MM-YYYY\n• YYYY-MM-DD\n• MM/DD/YYYY\n• MM-DD-YYYY\n• DD/MM/YYYY`);
                    await ctx.sendMessage({ embeds: [embed] });
                } else {
                    const formattedDate = parsedDate.format('DD-MMM-YYYY');
                    embed
                        .setColor(client.color.main)
                        .setDescription(`The birthday for you has been set to **\`${formattedDate}\`**`);

                    await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.birthday': formattedDate } }).exec();

                    await ctx.sendMessage({ embeds: [embed] });
                }
                break;
            }
        }
    }
};
