const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");
const globalGif = require("../../utils/Gif");

module.exports = class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "angpav",
            description: {
                content: "𝑨𝒏𝒈𝒑𝒂𝒗 𝒄𝒐𝒊𝒏𝒔 𝒕𝒐 𝒂𝒏𝒐𝒕𝒉𝒆𝒓 𝒖𝒔𝒆𝒓.",
                examples: ["𝑨𝒏𝒈𝒑𝒂𝒗 @𝒖𝒔𝒆𝒓 100", "𝑨𝒏𝒈𝒑𝒂𝒗 𝒂𝒍𝒍"],
                usage: "𝑨𝒏𝒈𝒑𝒂𝒗 <𝒖𝒔𝒆𝒓> [𝒂𝒎𝒐𝒖𝒏𝒕]",
            },
            category: "bank",
            aliases: [""],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'target',
                    description: 'The user for transfer.',
                    type: 6,
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount for give to the target',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const angPavMessages = language.locales.get(language.defaultLocale)?.bankMessages?.angPavMessages;

        const targetUser = ctx.isInteraction
            ? ctx.interaction.options.getUser('target') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

        // Prevent transferring to self
        if (ctx.author.id === targetUser.id) {
            return await client.utils.sendErrorMessage(client, ctx, angPavMessages.selfTransfer, color);
        }

        // Prevent transferring to bots
        if (targetUser && targetUser.user.bot) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.botTransfer, color);
        }

        // Fetch user data for both sender and receiver
        const user = await Users.findOne({userId: ctx.author.id});
        const target = await Users.findOne({ userId: targetUser.id }) || new Users({
            userId: targetUser.id,
            balance: {coin: 0, bank: 0}
        });

        if (user.validation.isKlaKlouk || user.validation.isMultiTransfer) {
            const activeCommand = user.validation.isKlaKlouk ? '𝑲𝒍𝒂 𝑲𝒍𝒐𝒖𝒌' : '𝑴𝒖𝒍𝒕𝒊𝒑𝒍𝒆 𝑻𝒓𝒂𝒏𝒔𝒇𝒆𝒓';
            return client.utils.sendErrorMessage(
                client,
                ctx,
                `𝒀𝒐𝒖 𝒉𝒂𝒗𝒆 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒔𝒕𝒂𝒓𝒕𝒆𝒅 𝒕𝒉𝒆 ${activeCommand} 𝒆𝒗𝒆𝒏𝒕. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒇𝒊𝒏𝒊𝒔𝒉 𝒊𝒕 𝒃𝒆𝒇𝒐𝒓𝒆 𝒖𝒔𝒊𝒏𝒈 𝒕𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅.`,
                color
            );
        } else {
            if (user.balance.coin < 1) {
                return await client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
            }

            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, angPavMessages.balanceNotExist, color);
            }

            const amount = client.utils.formatBalance(client, ctx, color, user.balance.coin, ctx.isInteraction ? ctx.interaction.options.getString('amount') : args[1] || 1, angPavMessages.invalidAmount
            );

            if (user.balance.coin < amount) {
                return await client.utils.sendErrorMessage(client, ctx, angPavMessages.insufficientFunds, color);
            }

            // Create confirm and cancel buttons
            const confirmButton = client.utils.fullOptionButton('confirm', emoji.tick, 'Confirm', 3);
            const cancelButton = client.utils.fullOptionButton('cancel', emoji.deny, 'Cancel', 4);
            const allButtons = client.utils.createButtonRow(confirmButton, cancelButton);

            // Embed for confirmation
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐀𝐍𝐆𝐏𝐀𝐕")
                        .replace('%{mainRight}', emoji.mainRight) +
                    angPavMessages.confirm
                        .replace('%{amount}', client.utils.formatNumber(amount))
                        .replace('%{emoji}', emoji.coin)
                        .replace('%{user}', targetUser.displayName)
                )
                .setImage(globalGif.banner.transferPending)
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            const msg = await ctx.channel.send({embeds: [embed], components: [allButtons]});

            user.balance.coin -= parseInt(amount);
            await Users.updateOne({userId: ctx.author.id}, {'balance.coin': user.balance.coin}).exec();

            const filter = (interaction) => interaction.user.id === ctx.author.id;
            const collector = msg.createMessageComponentCollector({filter, time: 60000});

            collector.on('collect', (interaction) => {
                if (interaction.user.id !== ctx.author.id) {
                    return interaction.reply({
                        content: generalMessages.notForYou || "This action is not for you.",
                        ephemeral: true
                    });
                } else {
                    interaction.deferUpdate().then(async () => {
                        if (interaction.customId === 'confirm') {
                            const confirmationEmbed = client.embed()
                                .setColor(color.main)
                                .setDescription(
                                    generalMessages.title
                                        .replace('%{mainLeft}', emoji.mainLeft)
                                        .replace('%{title}', "𝐀𝐍𝐆𝐏𝐀𝐕")
                                        .replace('%{mainRight}', emoji.mainRight) +
                                    `𝑨𝒏𝒈𝒑𝒂𝒗 ${globalEmoji.angpav} 𝒘𝒂𝒔 𝒔𝒆𝒏𝒕 𝒔𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 .`
                                )
                                .setFooter({
                                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                                    iconURL: ctx.author.displayAvatarURL(),
                                });

                            ctx.sendMessage({embeds: [confirmationEmbed]});

                            // Optional: Thanks GIF message
                            setTimeout(async () => {
                                const imageEmbed = client.embed()
                                    .setColor(color.main)
                                    .setDescription(
                                        generalMessages.title
                                            .replace('%{mainLeft}', emoji.mainLeft)
                                            .replace('%{title}', "𝐀𝐍𝐆𝐏𝐀𝐕")
                                            .replace('%{mainRight}', emoji.mainRight) +
                                        `***${ctx.author}*** 𝒉𝒂𝒔 𝒔𝒆𝒏𝒅 𝑨𝒏𝒈𝒑𝒂𝒗 𝒕𝒐 ***${targetUser}***.`
                                    )
                                    .setImage(globalGif.lunarNewYear)

                                const openButton = client.utils.fullOptionButton('open', globalEmoji.angpav, '𝑶𝒑𝒆𝒏', 3);
                                const row = client.utils.createButtonRow(openButton);

                                const angMsg = await ctx.channel.send({embeds: [imageEmbed], components: [row]});

                                const filter = (interaction) => interaction.user.id === targetUser.id;
                                const collector = angMsg.createMessageComponentCollector({ filter, time: 60000 });
                                collector.on('collect', (interaction) => {
                                    if (interaction.user.id !== targetUser.id) {
                                        return interaction.reply({
                                            content: generalMessages.notForYou || "This action is not for you.",
                                            ephemeral: true
                                        });
                                    } else {
                                        interaction.deferUpdate().then(async () => {
                                            if (interaction.customId === 'open') {
                                                target.balance.coin += parseInt(amount);
                                                await Users.updateOne(
                                                    { userId: targetUser.id },
                                                    {'balance.coin': target.balance.coin}
                                                ).exec();

                                                // Optional: Thanks GIF message
                                                setTimeout(() => {
                                                    const imageEmbed = client.embed()
                                                        .setColor(color.main)
                                                        .setThumbnail(globalGif.angpav)
                                                        .setDescription(
                                                            generalMessages.title
                                                                .replace('%{mainLeft}', emoji.mainLeft)
                                                                .replace('%{title}', "𝐀𝐍𝐆𝐏𝐀𝐕")
                                                                .replace('%{mainRight}', emoji.mainRight) +
                                                            angPavMessages.success
                                                                .replace('%{user}', ctx.author.displayName)
                                                                .replace('%{amount}', client.utils.formatNumber(amount))
                                                                .replace('%{emoji}', emoji.coin)
                                                        )
                                                        .setImage(globalGif.thanks)
                                                        .setFooter({
                                                            text: `𝑻𝒉𝒂𝒏𝒌𝒔 𝒕𝒐 ${ctx.author.displayName} 𝒇𝒐𝒓 𝑨𝒏𝒈𝒑𝒂𝒗.`
                                                        })

                                                    ctx.sendMessage({embeds: [imageEmbed]});
                                                }, 2000);
                                                angMsg.delete();
                                            }
                                        })
                                    }
                                });

                                collector.on('end', async collected => {
                                    if (collected.size === 0) {
                                        const timeoutEmbed = client.embed()
                                            .setColor(color.warning)
                                            .setTitle(angPavMessages.expire)
                                            .setDescription(angPavMessages.timeout);
                                        angMsg.edit( { embeds: [timeoutEmbed], components: [] });
                                    }
                                });
                            }, 2000);
                            msg.delete();
                        } else {
                            user.balance.coin += parseInt(amount);
                            await Users.updateOne(
                                { userId: ctx.author.id },
                                { 'balance.coin': user.balance.coin }
                            ).exec();
                            const cancelEmbed = client.embed()
                                .setColor(color.main)
                                .setDescription(
                                    generalMessages.title
                                        .replace('%{mainLeft}', emoji.mainLeft)
                                        .replace('%{title}', "𝐀𝐍𝐆𝐏𝐀𝐕")
                                        .replace('%{mainRight}', emoji.mainRight) +
                                    angPavMessages.cancel
                                )
                                .setFooter({
                                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                                    iconURL: ctx.author.displayAvatarURL(),
                                });
                            msg.edit({embeds: [cancelEmbed], components: []});
                        }
                    })
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    user.balance.coin += parseInt(amount);
                    await Users.updateOne({userId: ctx.author.id}, {'balance.coin': user.balance.coin}).exec();
                    const timeoutEmbed = client.embed()
                        .setColor(color.warning)
                        .setTitle(angPavMessages.expire)
                        .setDescription(angPavMessages.timeout);
                    msg.edit({embeds: [timeoutEmbed], components: []});
                }
            });
        }
    }
};
