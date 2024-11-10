const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const gif = require("../../utils/Gif");

module.exports = class MultiTransfer extends Command {
    constructor(client) {
        super(client, {
            name: "multitransfer",
            description: {
                content: "Transfer coins to multiple users with an equal split.",
                examples: ["multitransfer @user1 @user2 @user3 1000000", "multitransfer @user1 @user2 all"],
                usage: "multitransfer <user1> <user2> ... <amount>",
            },
            category: "economy",
            aliases: ["mpay", "mgive", "mtransfer", "paymultiple"],
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

        // Fetch the sender's data
        const user = await Users.findOne({ userId: ctx.author.id });
        if (!user || user.balance.coin < 1) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
        }

        // The amount to transfer will be the last argument
        let amount = args.pop();
        let totalAmount;
        console.log(amount);
        

        // Formatting the amount (support for 'all', 'half', 'k', 'm', etc.)
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: user.balance.coin, half: Math.ceil(user.balance.coin / 2) };
            const multiplier = { k: 1000, m: 1000000, b: 1000000000 };

            // Check for predefined amountMap values (all, half)
            if (amount in amountMap) {
                totalAmount = amountMap[amount];
            }
            // Check for custom numeric values with suffix (e.g. 100k, 1m, 5b)
            else if (amount.match(/\d+[kmbtq]/i)) {
                const unit = amount.slice(-1).toLowerCase();
                const number = parseInt(amount.slice(0, -1)); // Remove the suffix
                totalAmount = number * (multiplier[unit] || 1);
            } else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.danger).setDescription(transferMessages.invalidAmount),
                    ],
                });
            }
        } else {
            totalAmount = parseInt(amount);
        }

        if (user.balance.coin < totalAmount) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.insufficientFunds, color);
        }

        const targetUsers = [];

for (let i = 0; i < args.length - 1; i++) {
    const user = ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[i]) || ctx.guild.members.cache.find(m => m.user.tag === args[i]);

    if (user) {
        targetUsers.push(user);
    } else {
        return await client.utils.sendErrorMessage(client, ctx, transferMessages.noTargets, color);
    }
}

    if (targetUsers.length < 1) {
            return await client.utils.sendErrorMessage(client, ctx, transferMessages.noTargets, color);
        }

        // Calculate the share for each user
        const sharePerUser = Math.floor(totalAmount / targetUsers.length);

        // Create confirm and cancel buttons
        const confirmButton = client.utils.labelButton('confirm_button', 'Confirm', 3);
        const cancelButton = client.utils.labelButton('cancel_button', 'Cancel', 4);
        const allButtons = client.utils.createButtonRow(confirmButton, cancelButton);

        // Embed for confirmation
        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐓𝐑𝐀𝐍𝐒𝐀𝐂𝐓𝐈𝐎𝐍")
                    .replace('%{mainRight}', emoji.mainRight) +
                transferMessages.confirmMultiple
                    .replace('%{amount}', client.utils.formatNumber(totalAmount))
                    .replace('%{emoji}', emoji.coin)
                    .replace('%{userList}', targetUsers.map(u => u.displayName).join(', '))
                    .replace('%{share}', client.utils.formatNumber(sharePerUser))
            )
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        const messageEmbed = await ctx.channel.send({ embeds: [embed], components: [allButtons] });

        const filter = (interaction) => interaction.user.id === ctx.author.id;
        const collector = messageEmbed.createMessageComponentCollector({ filter, time: 8000 });

        collector.on('collect', (interaction) => {
            if (interaction.user.id !== ctx.author.id) {
                return interaction.reply({ content: generalMessages.notForYou || "This action is not for you.", ephemeral: true });
            } else {
                interaction.deferUpdate().then(() => {
                    if (interaction.customId === 'confirm_button') {
                        // Perform the transfers to each user
                        user.balance.coin -= totalAmount;
                        Users.findOneAndUpdate(
                            { userId: ctx.author.id },
                            { 'balance.coin': user.balance.coin }
                        ).then(() => {
                            targetUsers.forEach(target => {
                                Users.findOne({ userId: target.id }).then(targetUser => {
                                    if (!targetUser) {
                                        targetUser = new Users({ userId: target.id, balance: { coin: 0, bank: 0 } });
                                    }
                                    targetUser.balance.coin += sharePerUser;

                                    Users.findOneAndUpdate(
                                        { userId: target.id },
                                        { 'balance.coin': targetUser.balance.coin },
                                        { upsert: true, new: true }
                                    ).then(() => {
                                        // If all transfers are successful, confirm with a message
                                        const confirmationEmbed = client.embed()
                                            .setColor(color.main)
                                            .setDescription(
                                                generalMessages.title
                                                    .replace('%{mainLeft}', emoji.mainLeft)
                                                    .replace('%{title}', "𝐓𝐑𝐀𝐍𝐒𝐀𝐂𝐓𝐈𝐎𝐍")
                                                    .replace('%{mainRight}', emoji.mainRight) +
                                                transferMessages.successMultiple
                                                    .replace('%{amount}', client.utils.formatNumber(totalAmount))
                                                    .replace('%{emoji}', emoji.coin)
                                                    .replace('%{userList}', targetUsers.map(u => u.displayName).join(', '))
                                                    .replace('%{share}', client.utils.formatNumber(sharePerUser))
                                            )
                                            .setFooter({
                                                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                                                iconURL: ctx.author.displayAvatarURL(),
                                            });

                                        ctx.channel.send({ embeds: [confirmationEmbed] });

                                        messageEmbed.delete();
                                    });
                                });
                            });
                        });
                    } else {
                        ctx.channel.send(transferMessages.cancel);
                        messageEmbed.delete();
                    }
                });
            }
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
