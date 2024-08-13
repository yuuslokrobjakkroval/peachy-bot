const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const numeral = require("numeral");
const { COIN } = require("../../utils/Emoji");

class AddMoney extends Command {
    constructor(client) {
        super(client, {
            name: "addmoney",
            description: {
                content: "Add coins to a user's balance",
                examples: ["addmoney"],
                usage: "addmoney <user> <amount>",
            },
            category: "admin",
            aliases: ["addmoney", "add", "am"],
            cooldown: 1,
            args: true,
            permissions: {
                dev: true, // Restrict to bot developers (owners)
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args) {
        const userId = args[0].replace(/[<@!>]/g, '');
        let amount = parseInt(args[1], 10);

        if (isNaN(amount) || amount <= 0) {
            return ctx.channel.send('Please specify a valid amount of coins.');
        }

        const targetUser = await client.users.fetch(userId);

        if (!targetUser) {
            return ctx.channel.send('Please mention a valid user.');
        }

        let target = await Users.findOne({ userId: targetUser.id });

        if (!target) {
            target = { userId: targetUser.id, balance: 0 };
        }

        const formattedAmount = numeral(amount).format() || '0';
        const targetUsername = targetUser.displayName;

        // Update the target user's balance
        target.balance += amount;

        await Users.findOneAndUpdate({ userId: targetUser.id }, { balance: target.balance }, { upsert: true });

        // Send confirmation message
        const confirmationEmbed = this.client.embed()
            .setColor(config.color.main)
            .setTitle(`**Add Coins - ${ctx.author.displayName}**`)
            .setDescription(`You have added ${formattedAmount} ${COIN} to ${targetUsername}'s balance.`);

        await ctx.channel.send({ embeds: [confirmationEmbed] });
    }
}

module.exports = AddMoney;
