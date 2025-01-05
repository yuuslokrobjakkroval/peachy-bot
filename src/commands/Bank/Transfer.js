const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const globalGif = require("../../utils/Gif");

module.exports = class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "transfer",
            description: {
                content: "Transfer coins to another user.",
                examples: ["transfer @user 100", "transfer all"],
                usage: "transfer <user> [amount]",
            },
            category: "bank",
            aliases: ["pay", "give", "oy", "t"],
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
        const transferMessages = language.locales.get(language.defaultLocale)?.bankMessages?.transferMessages;

        const targetUser = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

        // Prevent transferring to self
        if (ctx.author.id === targetUser.id) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.selfTransfer, color);
        }

        // Prevent transferring to bots
        if (targetUser && targetUser.user.bot) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.botTransfer, color);
        }

        // Fetch user data for both sender and receiver
        const user = await Users.findOne({ userId: ctx.author.id });
        const target = await Users.findOne({ userId: targetUser.id }) || new Users({ userId: targetUser.id, balance: { coin: 0, bank: 0 } });

        if (user.balance.coin < 1) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
        }

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.balanceNotExist, color);
        }

        // Validate target user and amount
        let amount = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;

        if (amount.toString().startsWith('-')) {
            return ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(transferMessages.invalidAmount)
                ],
            });
        }

        if (isNaN(amount) || amount <= 0 || amount.toString().includes(',')) {
            const amountMap = { all: user.balance.coin, half: Math.ceil(user.balance.coin / 2) };
            const multiplier = { k: 1000, m: 1000000, b: 1000000000 };
            if (amount in amountMap) {
                amount = amountMap[amount];
            } else if (amount.match(/\d+[kmbtq]/i)) {
                const unit = amount.slice(-1).toLowerCase();
                const number = parseInt(amount);
                amount = number * (multiplier[unit] || 1);
            } else if (amount.toString().includes(',')) {
                amount = parseInt(amount.replace(/,/g, ''));
            } else {
                return ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.danger).setDescription(withdrawMessages.invalidAmount),
                    ],
                });
            }
        } else {
            return ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(depositMessages.invalidAmount)
                ],
            });
        }

        if (user.balance.coin < amount) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.insufficientFunds, color);
        }

        // Create confirm and cancel buttons
        const confirmButton = client.utils.labelButton('confirm', 'Confirm', 3);
        const cancelButton = client.utils.labelButton('cancel', 'Cancel', 4);
        const allButtons = client.utils.createButtonRow(confirmButton, cancelButton);

        // Embed for confirmation
        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐓𝐑𝐀𝐍𝐒𝐀𝐂𝐓𝐈𝐎𝐍")
                    .replace('%{mainRight}', emoji.mainRight) +
                transferMessages.confirm
                    .replace('%{amount}', client.utils.formatNumber(amount))
                    .replace('%{emoji}', emoji.coin)
                    .replace('%{user}', targetUser.displayName)
            )
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        const msg = await ctx.channel.send({ embeds: [embed], components: [allButtons] });

        user.balance.coin -= parseInt(amount);
        await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();

        const filter = (interaction) => interaction.user.id === ctx.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', (interaction) =>  {
            if (interaction.user.id !== ctx.author.id) {
                return interaction.reply({ content: generalMessages.notForYou || "This action is not for you.", ephemeral: true });
            } else {
                interaction.deferUpdate().then(async () => {
                    if (interaction.customId === 'confirm') {
                        target.balance.coin += parseInt(amount);
                        await Users.updateOne({ userId: targetUser.id }, { 'balance.coin': target.balance.coin } ).exec();
                        const confirmationEmbed = client.embed()
                            .setColor(color.main)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', "𝐓𝐑𝐀𝐍𝐒𝐀𝐂𝐓𝐈𝐎𝐍")
                                    .replace('%{mainRight}', emoji.mainRight) +
                                transferMessages.success
                                    .replace('%{amount}', client.utils.formatNumber(amount))
                                    .replace('%{emoji}', emoji.coin)
                                    .replace('%{user}', targetUser.displayName)
                            )
                            .setFooter({
                                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        ctx.sendMessage({ embeds: [confirmationEmbed] });

                        // Optional: Thanks GIF message
                        setTimeout(() => {
                            const imageEmbed = client.embed()
                                .setColor(color.main)
                                .setDescription(`${targetUser} wants to say thanks to ${ctx.author}.`)
                                .setImage(globalGif.thanks);

                            ctx.sendMessage({ embeds: [imageEmbed] });
                        }, 2000);
                        msg.delete();
                    } else {
                        user.balance.coin += parseInt(amount);
                        await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();
                        const cancelEmbed = client.embed()
                            .setColor(color.main)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', "𝐓𝐑𝐀𝐍𝐒𝐀𝐂𝐓𝐈𝐎𝐍")
                                    .replace('%{mainRight}', emoji.mainRight) +
                                transferMessages.cancel
                            )
                            .setFooter({
                                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });
                        msg.edit({ embeds: [cancelEmbed], components: [] });
                    }
                })
            }
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                user.balance.coin += parseInt(amount);
                await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();
                const timeoutEmbed = client.embed()
                    .setColor(color.warning)
                    .setTitle(transferMessages.expire)
                    .setDescription(transferMessages.timeout);
                msg.edit({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};
