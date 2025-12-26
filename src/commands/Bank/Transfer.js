const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const globalGif = require('../../utils/Gif');

module.exports = class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: 'transfer',
            description: {
                content: 'Transfer coins to another user.',
                examples: ['transfer @user 100', 'transfer all'],
                usage: 'transfer <user> [amount]',
            },
            category: 'bank',
            aliases: ['pay', 'give', 'oy', 't'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
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

        // Get the target user
        const targetUser = ctx.isInteraction
            ? ctx.interaction.options.getUser('target') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

        // Prevent transferring to self or bots
        if (ctx.author.id === targetUser.id) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.selfTransfer, color);
        }

        if (targetUser && targetUser.user.bot && targetUser.id !== client.user.id) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.botTransfer, color);
        }

        // Fetch user data
        const user = await Users.findOne({ userId: ctx.author.id });

        // Fetch or create target user's data
        let target = await Users.findOne({ userId: targetUser.id });

        if (!target) {
            target = new Users({
                userId: targetUser.id,
                balance: { coin: 0, bank: 0 },
            });
            await target.save();
        }

        // Handle Kla Klouk or Multi Transfer validation
        if (user.validation.isKlaKlouk || user.validation.isMultiTransfer) {
            const activeCommand = user.validation.isKlaKlouk ? 'Kla Klouk' : 'Multiple Transfer';
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                `You have already started the ${activeCommand} event. Please finish it before using this command.`,
                color
            );
        }

        if (user.balance.coin < 1) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
        }

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.balanceNotExist, color);
        }

        const amount = client.utils.formatBalance(
            client,
            ctx,
            color,
            user.balance.coin,
            ctx.isInteraction ? ctx.interaction.options.getString('amount') : args[1] || 1,
            transferMessages.invalidAmount
        );
        if (typeof amount === 'object') return;

        if (user.balance.coin < amount) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.insufficientFunds, color);
        }

        // Create confirm and cancel buttons
        const confirmButton = client.utils.fullOptionButton('confirm', emoji.tick, 'Confirm', 3);
        const cancelButton = client.utils.fullOptionButton('cancel', emoji.deny, 'Cancel', 4);
        const allButtons = client.utils.createButtonRow(confirmButton, cancelButton);

        // Embed for confirmation
        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'TRANSACTION')
                    .replace('%{mainRight}', emoji.mainRight) +
                    transferMessages.confirm
                        .replace('%{amount}', client.utils.formatNumber(amount))
                        .replace('%{emoji}', emoji.coin)
                        .replace('%{user}', targetUser.displayName)
            )
            .setImage(globalGif.banner.transferPending)
            .setFooter({
                text:
                    generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        const msg = await ctx.channel.send({
            embeds: [embed],
            components: [allButtons],
        });

        user.balance.coin -= Number.parseInt(amount);
        await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();

        // Create interaction filter and collector
        const filter = (interaction) => interaction.user.id === ctx.author.id;
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 60000,
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== ctx.author.id) {
                return interaction.reply({
                    content: generalMessages.notForYou || 'This action is not for you.',
                    flags: 64,
                });
            } else {
                await interaction.deferUpdate();

                if (interaction.customId === 'confirm') {
                    target.balance.coin += Number.parseInt(amount);
                    await Users.updateOne({ userId: targetUser.id }, { 'balance.coin': target.balance.coin }).exec();

                    if (targetUser.id === client.user.id) {
                        user.balance.sponsor += Number.parseInt(amount);
                        await Users.updateOne({ userId: ctx.author.id }, { 'balance.sponsor': user.balance.sponsor }).exec();
                    }

                    const confirmationEmbed = client
                        .embed()
                        .setColor(color.main)
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', 'TRANSACTION')
                                .replace('%{mainRight}', emoji.mainRight) +
                                transferMessages.success
                                    .replace('%{amount}', client.utils.formatNumber(amount))
                                    .replace('%{emoji}', emoji.coin)
                                    .replace('%{user}', targetUser.displayName)
                        )
                        .setImage(globalGif.banner.transferSuccess)
                        .setFooter({
                            text:
                                generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                                `Requested by ${ctx.author.displayName}`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    await ctx.sendMessage({ embeds: [confirmationEmbed] });

                    // Optional: Thanks GIF message
                    setTimeout(async () => {
                        const imageEmbed = client
                            .embed()
                            .setColor(color.main)
                            .setDescription(`${targetUser} wants to say thanks to ${ctx.author}.`)
                            .setImage(globalGif.thanks);

                        await ctx.sendMessage({ embeds: [imageEmbed] });
                    }, 2000);

                    if (msg) {
                        await msg.delete();
                    }
                } else {
                    user.balance.coin += Number.parseInt(amount);
                    await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();

                    const cancelEmbed = client
                        .embed()
                        .setColor(color.main)
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', 'TRANSACTION')
                                .replace('%{mainRight}', emoji.mainRight) + transferMessages.cancel
                        )
                        .setFooter({
                            text:
                                generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                                `Requested by ${ctx.author.displayName}`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    await msg.edit({ embeds: [cancelEmbed], components: [] });
                }
            }
        });

        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                user.balance.coin += Number.parseInt(amount);
                await Users.updateOne({ userId: ctx.author.id }, { 'balance.coin': user.balance.coin }).exec();

                const timeoutEmbed = client
                    .embed()
                    .setColor(color.warning)
                    .setTitle(transferMessages.expire)
                    .setDescription(transferMessages.timeout);

                await msg.edit({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};
