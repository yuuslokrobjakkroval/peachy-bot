const { Command } = require('../../structures/index.js');
const moment = require('moment');
const Users = require('../../schemas/user.js');

function getZodiacSign(zodiacSign, day, month) {
    const zodiacSigns = [
        { sign: 'capricorn', start: [12, 22], end: [1, 19] },
        { sign: 'aquarius', start: [1, 20], end: [2, 18] },
        { sign: 'pisces', start: [2, 19], end: [3, 20] },
        { sign: 'aries', start: [3, 21], end: [4, 19] },
        { sign: 'taurus', start: [4, 20], end: [5, 20] },
        { sign: 'gemini', start: [5, 21], end: [6, 20] },
        { sign: 'cancer', start: [6, 21], end: [7, 22] },
        { sign: 'leo', start: [7, 23], end: [8, 22] },
        { sign: 'virgo', start: [8, 23], end: [9, 22] },
        { sign: 'libra', start: [9, 23], end: [10, 22] },
        { sign: 'scorpio', start: [10, 23], end: [11, 21] },
        { sign: 'sagittarius', start: [11, 22], end: [12, 21] }
    ];

    for (const zodiac of zodiacSigns) {
        const [startMonth, startDay] = zodiac.start;
        const [endMonth, endDay] = zodiac.end;

        if (
            (month === startMonth && day >= startDay) ||
            (month === endMonth && day <= endDay) ||
            (startMonth > endMonth && (month === startMonth || month === endMonth))
        ) {
            return { sign: zodiac.sign, emoji: zodiacSign[zodiac.sign] };
        }
    }
    return null;
}

module.exports = class Birthday extends Command {
    constructor(client) {
        super(client, {
            name: 'birthday',
            description: {
                content: 'Sets, resets or provides help for your profile birthday and zodiac sign.',
                examples: [
                    'birthday 20-01',
                    'birthday reset',
                    'birthday help'
                ],
                usage: 'birthday <date || reset || help>',
            },
            category: 'profile',
            aliases: ['bd'],
            cooldown: 5,
            args: false,
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
                    name: 'help',
                    description: 'Displays example and usage information for the command.',
                    type: 1,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const user = await Users.findOne({ userId: ctx.author.id });
        const embed = client.embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} 𝐁𝐈𝐑𝐓𝐇𝐃𝐀𝐘 𝐈𝐍𝐅𝐎 ${client.emoji.mainRight}`)
        const zodiacEmojiImage = user.profile.zodiacSign ? client.utils.emojiToImage(client.emoji.zodiac[user.profile.zodiacSign]) : ctx.author.displayAvatarURL({ dynamic: true, size: 1024 });
        embed.setThumbnail(zodiacEmojiImage);

        const subCommand = ctx.isInteraction ? ctx.interaction.options.data[0].name : args[0];
        const dateFormats = ['DD-MM', 'MM-DD', 'MM/DD', 'MM-DD', 'DD/MM'];

        switch (subCommand) {
            case 'help': {
                // Show help
                embed.addFields([
                        { name: '**Usage :**', value: `\`\`\`birthday <date || reset || show || help>\n\`\`\``, inline: false },
                        { name: '**Examples :**', value: `\`\`\`birthday 20-03\nbirthday reset\nbirthday help\n\`\`\``, inline: false }
                    ]);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'reset': {
                // Reset birthday and zodiac sign
                embed.setDescription('Your birthday and zodiac sign have been reset.');

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.birthday': null, 'profile.zodiacSign': null } }).exec();

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                // If no arguments, show birthday and zodiac sign
                if (!args.length) {
                    const birthdayMessage = user.profile.birthday
                        ? `Your birthday is **\`${user.profile.birthday}\`**.\n`
                        : 'No birthday set.';

                    const zodiacMessage = user.profile.zodiacSign
                        ? `Your zodiac sign is **\`${client.utils.formatCapitalize(user.profile.zodiacSign)}\`**.\n`
                        : 'No zodiac sign set.';

                    embed.setDescription(`${birthdayMessage}\n${zodiacMessage}`);

                    await ctx.sendMessage({ embeds: [embed] });
                    break;
                }

                // Set birthday and zodiac sign
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
                    embed.setDescription(`The date must be in one of the supported formats:\n• DD-MM\n• MM-DD\n• MM/DD\n• MM-DD\n• DD/MM`);
                    await ctx.sendMessage({ embeds: [embed] });
                } else {
                    const formattedDate = parsedDate.format('DD-MMM');
                    const day = parsedDate.date();
                    const month = parsedDate.month() + 1;

                    const zodiacSign = getZodiacSign(client.emoji.zodiac, day, month);
                    const zodiacEmojiImage = zodiacSign ? client.utils.emojiToImage(zodiacSign.emoji) : ctx.author.displayAvatarURL({ dynamic: true, size: 1024 });

                    embed.setThumbnail(zodiacEmojiImage).setDescription(`Your birthday has been set to\n**\`${formattedDate}\`**\nYour zodiac sign is\n**\`${client.utils.formatCapitalize(zodiacSign.sign)}\`** ${zodiacSign.emoji}.`);
                    await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.birthday': formattedDate, 'profile.zodiacSign': zodiacSign.sign } }).exec();

                    await ctx.sendMessage({ embeds: [embed] });
                }
            }
        }
    }
};
