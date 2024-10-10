const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const gif = require("../../utils/Gif");
const numeral = require("numeral");
const { getCollectionButton, ButtonStyle, twoButton, labelButton } = require('../../functions/function');

const pendingTransfers = new Map();

module.exports = class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "transfer",
            description: {
                content: "Transfer coin to another user.",
                examples: ["transfer @user 100", "transfer all"],
                usage: "transfer <user> [amount]",
            },
            category: "economy",
            aliases: ["pay", "give", "oy"],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const transferMessages = language.locales.get(language.defaultLocale)?.economyMessages?.transferMessages;
        const targetUser = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

        let amount = args[1] === 'all' ? 'all' : parseInt(args[1], 10);

        // Prevent transferring to yourself or the bot
        if (ctx.author.id === targetUser.id) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.selfTransfer, color);
        }
        if (targetUser.id === client.user.id) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.botTransfer, color);
        }

        // Validate the amount
        if (amount !== 'all' && (isNaN(amount) || amount <= 0)) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.invalidAmount, color);
        }

        const sourceUserData = await Users.findOne({ userId: ctx.author.id });
        const targetUserData = await Users.findOne({ userId: targetUser.id }) || new Users({ userId: targetUser.id, balance: { coin: 0, bank: 0 } });

        // Ensure source user exists
        if (!sourceUserData) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.balanceNotExist, color);
        }

        // Handle 'all' amount transfer
        if (amount === 'all') {
            amount = sourceUserData.balance.coin;
        }

        // Validate the transfer amount
        if (sourceUserData.balance.coin < amount) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.transferInsufficientFunds, color);
        }

        const targetUsername = targetUser.displayName;
        const formattedAmount = numeral(amount).format() || '0';

        // Create confirm and cancel buttons
        const confirmButton = labelButton('confirm_button', 'Confirm', ButtonStyle.Success);
        const cancelButton = labelButton('cancel_button', 'Cancel', ButtonStyle.Danger);
        const allButtons = twoButton(confirmButton, cancelButton);

        // Embed for confirmation
        const embed = client.embed()
            .setColor(config.color.main)
            .setTitle(transferMessages.transactionConfirm) // Updated title
            .setDescription(`You are about to give ${formattedAmount} ${emoji.coin} to ${targetUsername}. Confirm?`);

        const messageEmbed = await ctx.channel.send({ embeds: [embed], components: [allButtons] });
        const collector = getCollectionButton(messageEmbed);

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== ctx.author.id) {
                await interaction.reply({ content: language.get('errors.not_for_you'), ephemeral: true });
                return;
            }

            if (interaction.customId === 'confirm_button') {
                // Perform the transfer
                sourceUserData.balance.coin -= amount;
                targetUserData.balance.coin += amount;

                try {
                    await Users.findOneAndUpdate({ userId: ctx.author.id }, { balance: sourceUserData.balance });
                    await Users.findOneAndUpdate({ userId: targetUser.id }, { balance: targetUserData.balance }, { upsert: true });

                    const confirmationEmbed = client.embed()
                        .setColor(config.color.main)
                        .setTitle(transferMessages.transactionSuccess) // Updated confirmation message
                        .setDescription(`You have given ${formattedAmount} ${emoji.coin} to ${targetUsername}.`);

                    await ctx.channel.send({ embeds: [confirmationEmbed] });

                    // Thanks GIF message
                    setTimeout(async () => {
                        const imageEmbed = client.embed()
                            .setColor(config.color.main)
                            .setDescription(`${targetUser} wants to say thanks to ${ctx.author}.`)
                            .setImage(gif.thanks);

                        await ctx.channel.send({ embeds: [imageEmbed] });
                    }, 2000);

                    await messageEmbed.delete();
                } catch (error) {
                    console.error('Database update error:', error);
                    await ctx.channel.send(language.get('errors.database_update'));
                }
            } else if (interaction.customId === 'cancel_button') {
                await ctx.channel.send(transferMessages.transactionCancel); // Updated cancel message
                await messageEmbed.delete();
            }

            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = client.embed()
                    .setColor(config.color.warning)
                    .setTitle(transferMessages.transactionExpired)
                    .setDescription(transferMessages.transactionTimeout);

                messageEmbed.edit({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};
