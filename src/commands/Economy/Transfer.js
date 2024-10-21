const { Command } = require("../../structures");
const { ButtonStyle, twoButton, labelButton } = require('../../functions/function');
const Users = require("../../schemas/user");
const config = require("../../config.js");
const gif = require("../../utils/Gif");
const emojiImage = require("../../utils/Emoji");

module.exports = class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "transfer",
            description: {
                content: "Transfer coins to another user.",
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
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const transferMessages = language.locales.get(language.defaultLocale)?.economyMessages?.transferMessages;

        // Fetch the target user
        const targetUser = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

        // Prevent transferring to self or bot
        if (ctx.author.id === targetUser.id) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.selfTransfer, color);
        }
        if (targetUser.id === client.user.id) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.botTransfer, color);
        }

        // Fetch user data for both sender and receiver
        const user = await Users.findOne({ userId: ctx.author.id });
        const verify = user.verification.verify.status === 'verified';
        const target = await Users.findOne({ userId: targetUser.id }) || new Users({ userId: targetUser.id, balance: { coin: 0, bank: 0 } });

        if (user.balance.coin < 1) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
        }

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.balanceNotExist, color);
        }

        // Validate target user and amount
        let amount = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: user.balance.coin, half: Math.ceil(user.balance.coin / 2) };
            const multiplier = { k: 1000, m: 1000000, b: 1000000000 };

            if (amount in amountMap) {
                amount = amountMap[amount]
            } else if (amount.match(/\d+[kmbtq]/)) {
                const unit = amount.slice(-1).toLowerCase();
                const number = parseInt(amount);
                amount = number * (multiplier[unit] || 1);
            } else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.red).setDescription(transferMessages.invalidAmount),
                    ],
                });
            }
        }

        if (user.balance.coin < amount) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.insufficientFunds, color);
        }

        // Create confirm and cancel buttons
        const confirmButton = labelButton('confirm_button', 'Confirm', ButtonStyle.Success);
        const cancelButton = labelButton('cancel_button', 'Cancel', ButtonStyle.Danger);
        const allButtons = twoButton(confirmButton, cancelButton);

        // Embed for confirmation
        const embed = client.embed()
            .setColor(config.color.main)
            .setTitle(transferMessages.title.replace('{{user}}', ctx.author.displayName))
            // .setTitle(transferMessages.confirm)
            .setDescription(transferMessages.confirm
                .replace('{{amount}}', amount)
                .replace('{{emoji}}',  emoji.coin)
                .replace('{{user}}', targetUser.displayName)
            );

        const messageEmbed = await ctx.channel.send({ embeds: [embed], components: [allButtons] });

        const filter = (interaction) => interaction.user.id === ctx.author.id;
        const collector = messageEmbed.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== ctx.author.id) {
                return await interaction.reply({ content: generalMessages.notForYou || "This action is not for you.", ephemeral: true });
            } else {
                await interaction.deferUpdate();
                if (interaction.customId === 'confirm_button') {
                    // Perform the transfer
                    user.balance.coin -= parseInt(amount);
                    target.balance.coin += parseInt(amount);

                    try {
                        await Users.findOneAndUpdate({userId: ctx.author.id}, { balance: user.balance });
                        await Users.findOneAndUpdate({userId: targetUser.id}, { balance: target.balance }, {upsert: true});

                        const confirmationEmbed = client.embed()
                            .setColor(config.color.main)
                            .setTitle(transferMessages.title.replace('{{user}}', ctx.author.displayName))
                            .setDescription(transferMessages.success
                                .replace('{{amount}}', amount)
                                .replace('{{emoji}}', emoji.coin)
                                .replace('{{user}}', targetUser.displayName)
                            )
                            .setFooter({
                                text: `Request By ${ctx.author.displayName}`,
                                iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
                            });

                        await ctx.channel.send({ embeds: [confirmationEmbed] });

                        // Optional: Thanks GIF message
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
                        // Use generalMessages for database error
                        await ctx.channel.send(generalMessages.databaseUpdate);
                    }
                } else if (interaction.customId === 'cancel_button') {
                    await ctx.channel.send(transferMessages.cancel);
                    await messageEmbed.delete();
                }
            }
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = client.embed()
                    .setColor(color.warning)
                    .setTitle(transferMessages.expire)
                    .setDescription(transferMessages.timeout);

                messageEmbed.edit({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};
