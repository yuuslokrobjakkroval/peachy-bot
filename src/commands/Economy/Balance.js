const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");
const gif = require('../../utils/Gif.js');

module.exports = class Balance extends Command {
    constructor(client) {
        super(client, {
            name: 'balance',
            description: {
                content: 'Displays your balance and daily transfer/receive limits.',
                examples: ['balance'],
                usage: 'balance',
            },
            category: 'economy',
            aliases: ['bal', 'money', 'cash'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
            const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;

            // Fetch the user data from the database
            const user = await Users.findOne({ userId: ctx.author.id });

            // If the user is not found in the database
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Destructure the coin and bank from the user's balance, set defaults to 0
            const { coin = 0, bank = 0 } = user.balance;

            // Prepare and send the embed
            const embed = client
                .embed()
                .setTitle(`${emoji.mainLeft} ${balanceMessages.title.replace('%{displayName}', ctx.author.displayName)} ${emoji.mainRight}`)
                .setColor(color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(
                    balanceMessages.description
                        .replace('%{coinEmote}', emoji.coin)
                        .replace('%{coin}', client.utils.formatNumber(coin))
                        .replace('%{bankEmote}', emoji.bank)
                        .replace('%{bank}', client.utils.formatNumber(bank))
                )
                .setImage(gif.balanceBanner);

            // Send the embed message
            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Balance command:', error);
            const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;
            return await client.utils.sendErrorMessage(client, ctx, balanceMessages.errors.fetchFail, color);
        }
    }
};
