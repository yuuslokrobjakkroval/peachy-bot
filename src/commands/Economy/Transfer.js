const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const gif = require("../../utils/Gif");
const numeral = require("numeral");
const { getCollectionButton, ButtonStyle, twoButton, labelButton } = require('../../functions/function');

module.exports = class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "transfer",
            description: {
                content: "transfer coin to another user",
                examples: ["transfer"],
                usage: "transfer <user> [amount]",
            },
            category: "economy",
            aliases: ["transfer", "pay", "give", "oy"],
            cooldown: 1,
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

    async run(client, ctx, args) {
        const targetUser = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author // Default to the author if no user is provided
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;
        let amount = args[1] ? parseInt(args[1], 10) : 1;

        // Prevent transferring to yourself
        if (ctx.author.id === targetUser.id) {
            return await client.utils.sendErrorMessage(client, ctx, 'You cannot transfer coins to yourself.');
        }

        if (args[1] !== 'all') {
            if (isNaN(amount) || amount <= 0) {
                return await client.utils.sendErrorMessage(client, ctx, 'Please mention a valid user and amount.');
            }
        }

        if (!targetUser) {
            return await client.utils.sendErrorMessage(client, ctx, 'Please mention a valid user.');
        }

        let user = await Users.findOne({userId: ctx.author.id});
        let target = await Users.findOne({userId: targetUser.id});

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, 'Your balance record does not exist.');
        }

        if (!target) {
            target = new Users({userId: targetUser.id, balance: {coin: 0, bank: 0}});
        }

        if (args[1] === 'all') {
            amount = user.balance.coin;
        }

        if (isNaN(amount) || amount <= 0 || user.balance.coin < amount) {
            return await client.utils.sendErrorMessage(client, ctx, 'Invalid amount specified or insufficient balance.');
        }

        const targetUsername = targetUser.displayName;
        const formattedAmount = numeral(amount).format() || '0';

        // Create the confirm and cancel buttons using your custom function
        const confirmButton = labelButton('confirm_button', 'Confirm', ButtonStyle.Success);
        const cancelButton = labelButton('cancel_button', 'Cancel', ButtonStyle.Danger);
        const allButtons = twoButton(confirmButton, cancelButton);

        // Embed for confirmation
        const embed = this.client.embed()
            .setColor(config.color.main)
            .setTitle(`**Transaction - ${ctx.author.displayName}**`)
            .setDescription(`You are about to give ${formattedAmount} ${client.emoji.coin} to ${targetUsername}. Confirm?`);

        const messageEmbed = await ctx.channel.send({embeds: [embed], components: [allButtons]});
        const collector = getCollectionButton(messageEmbed); // 30 seconds timeout

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== ctx.author.id) {
                await interaction.reply({content: 'This button is not for you!', ephemeral: true});
                return;
            }

            if (interaction.customId === 'confirm_button') {
                user.balance.coin -= amount;
                target.balance.coin += amount;

                try {
                    await Users.findOneAndUpdate({userId: ctx.author.id}, {balance: user.balance});
                    await Users.findOneAndUpdate({userId: targetUser.id}, {balance: target.balance}, {upsert: true});

                    const confirmationEmbed = this.client.embed()
                        .setColor(config.color.main)
                        .setTitle(`**Transaction - ${ctx.author.displayName}**`)
                        .setDescription(`You have given ${formattedAmount} ${client.emoji.coin} to ${targetUsername}`);

                    await ctx.channel.send({embeds: [confirmationEmbed]});

                    setTimeout(async () => {
                        const imageEmbed = this.client.embed()
                            .setColor(config.color.main)
                            .setDescription(`${targetUser} wants to say ... to ${ctx.author}`)
                            .setImage(gif.thanks);

                        await ctx.channel.send({embeds: [imageEmbed]});
                    }, 2000);

                    await messageEmbed.delete();
                } catch (error) {
                    console.error('Database update error:', error);
                    await ctx.channel.send('An error occurred while updating the balance.');
                }
            } else if (interaction.customId === 'cancel_button') {
                await ctx.channel.send('You have canceled the transaction. No coins have been transferred.');
                await messageEmbed.delete();
            }

            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = this.client.embed()
                    .setColor(config.color.warning)
                    .setTitle(`Transaction Timed Out`)
                    .setDescription(`You did not respond in time. The transaction has been canceled.`);

                messageEmbed.edit({embeds: [timeoutEmbed], components: []});
            }
        });
    }
}
