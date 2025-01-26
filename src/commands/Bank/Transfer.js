const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const globalGif = require("../../utils/Gif");

module.exports = class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "transfer",
            description: {
                content: "𝑻𝒓𝒂𝒏𝒔𝒇𝒆𝒓 𝒄𝒐𝒊𝒏𝒔 𝒕𝒐 𝒂𝒏𝒐𝒕𝒉𝒆𝒓 𝒖𝒔𝒆𝒓.",
                examples: ["𝒕𝒓𝒂𝒏𝒔𝒇𝒆𝒓 @𝒖𝒔𝒆𝒓 100", "𝒕𝒓𝒂𝒏𝒔𝒇𝒆𝒓 𝒂𝒍𝒍"],
                usage: "𝒕𝒓𝒂𝒏𝒔𝒇𝒆𝒓 <𝒖𝒔𝒆𝒓> [𝒂𝒎𝒐𝒖𝒏𝒕]",
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
        const transferMessages = language.locales.get(language.defaultLocale)?.bankMessages?.transferMessages;

        const targetUser = ctx.isInteraction
            ? ctx.interaction.options.getUser('target') || ctx.author
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
        const user = await Users.findOne({userId: ctx.author.id});
        const target = await Users.findOne({userId: targetUser.id}) || new Users({
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
                return await client.utils.sendErrorMessage(client, ctx, transferMessages.balanceNotExist, color);
            }

            const amount = client.utils.formatBalance(client, ctx, color, user.balance.coin, ctx.isInteraction ? ctx.interaction.options.getString('amount') : args[1] || 1, transferMessages.invalidAmount);
            if (typeof amount === "object") return;

            if (user.balance.coin < amount) {
                return await client.utils.sendErrorMessage(client, ctx, transferMessages.insufficientFunds, color);
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
                        .replace('%{title}', "𝐓𝐑𝐀𝐍𝐒𝐀𝐂𝐓𝐈𝐎𝐍")
                        .replace('%{mainRight}', emoji.mainRight) +
                    transferMessages.confirm
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
                        flags: 64
                    });
                } else {
                    interaction.deferUpdate().then(async () => {
                        if (interaction.customId === 'confirm') {
                            target.balance.coin += parseInt(amount);
                            await Users.updateOne({userId: targetUser.id}, {'balance.coin': target.balance.coin}).exec();
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

                            ctx.sendMessage({embeds: [confirmationEmbed]});

                            // Optional: Thanks GIF message
                            setTimeout(() => {
                                const imageEmbed = client.embed()
                                    .setColor(color.main)
                                    .setDescription(`${targetUser} wants to say thanks to ${ctx.author}.`)
                                    .setImage(globalGif.thanks);

                                ctx.sendMessage({embeds: [imageEmbed]});
                            }, 2000);
                            msg.delete();
                        } else {
                            user.balance.coin += parseInt(amount);
                            await Users.updateOne({userId: ctx.author.id}, {'balance.coin': user.balance.coin}).exec();
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
                        .setTitle(transferMessages.expire)
                        .setDescription(transferMessages.timeout);
                    msg.edit({embeds: [timeoutEmbed], components: []});
                }
            });
        }
    }
};
