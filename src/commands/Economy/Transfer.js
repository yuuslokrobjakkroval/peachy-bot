const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const numeral = require("numeral");
const { COIN } = require("../../utils/Emoji");
const { getCollectionButton, ButtonStyle, twoButton, labelButton } = require('../../functions/function');

class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "give",
            description: {
                content: "Give coin to another user",
                examples: ["give"],
                usage: "give <user> [amount]",
            },
            category: "economy",
            aliases: ["give", "pay", "oy"],
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
        const userId = args[0].replace(/[<@!>]/g, '');
        let amount = args[1] ? parseInt(args[1], 10) : 1;

        if (args[1] !== 'all') {
            if (isNaN(amount) || amount <= 0) {
                return ctx.channel.send('Please mention a valid user and amount.');
            }
        }

        const targetUser = await client.users.fetch(userId);

        if (!targetUser) {
            return ctx.channel.send('Please mention a valid user.');
        }

        let user = await Users.findOne({ userId: ctx.author.id });
        let target = await Users.findOne({ userId: targetUser.id });

        if (!user) {
            return ctx.channel.send('Your balance record does not exist.');
        }

        if (!target) {
            target = { userId: targetUser.id, balance: 0 };
        }

        if (args[1] === 'all') {
            amount = user.balance;
        }

        if (user.balance < amount) {
            return ctx.channel.send('You do not have enough coin.');
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
            .setDescription(`You are about to give ${formattedAmount} ${COIN} to ${targetUsername}. Confirm?`);

        const messageEmbed = await ctx.channel.send({ embeds: [embed], components: [allButtons] });
        const collector = getCollectionButton(messageEmbed); // 30 seconds timeout

        collector.on('collect', async (interaction) => {    
            if (interaction.user.id !== ctx.author.id) {
                await interaction.reply({ content: 'This button is not for you!', ephemeral: true });
                return;
            }

            if (interaction.customId === 'confirm_button') {
                user.balance -= amount;
                target.balance += amount;

                await Users.findOneAndUpdate({ userId: ctx.author.id }, { balance: user.balance });
                await Users.findOneAndUpdate({ userId: targetUser.id }, { balance: target.balance }, { upsert: true });

                // Send confirmation message
                const confirmationEmbed =this.client.embed()
                    .setColor(config.color.main)
                    .setTitle(`**Transaction - ${ctx.author.displayName}**`)
                    .setDescription(`You have given ${formattedAmount} ${COIN} to ${targetUsername}`);

                await ctx.channel.send({ embeds: [confirmationEmbed] });
                await messageEmbed.delete();
            } else if (interaction.customId === 'cancel_button') {
                await ctx.channel.send('You have canceled the transaction. No coins have been transferred.');
                await messageEmbed.delete();
            }

            collector.stop();
        });
    }
}

module.exports = Transfer;