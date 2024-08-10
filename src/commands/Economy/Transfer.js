const { Command } = require("../../structures");
const Currency = require("../../schemas/user");
const config = require("../../config.js");
const numeral = require("numeral");
const { SKYREALM } = require("../../utils/Emoji");
const { MessageEmbed } = require('discord.js');

class Transfer extends Command {
    constructor(client) {
        super(client, {
            name: "give",
            description: {
                content: "Give coin to another user",
                examples: ["give"],
                usage: "give <user> <amount>",
            },
            category: "economy",
            aliases: ["give", 'pay', 'oy'],
            cooldown: 1,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: false,  // Ensure this is false if you are using message-based commands
            options: [],
        });
    }

    async run(client, ctx, args) {
        // Extract user ID from mention or args
        const userId = args[0].replace(/[<@!>]/g, ''); // Remove Discord mention syntax
        const amount = parseInt(args[1], 10);

        if (!userId || isNaN(amount) || amount <= 0) {
            return ctx.send('Please mention a valid user and amount.');
        }

        const targetUser = await client.users.fetch(userId);

        if (!targetUser) {
            return ctx.send('Please mention a valid user.');
        }

        // Fetch the users' balances
        let user = await Currency.findOne({ userId: ctx.author.id });
        let target = await Currency.findOne({ userId: targetUser.id });

        if (!user) {
            return ctx.channel.send('Your balance record does not exist.');
        }

        if (!target) {
            target = { userId: targetUser.id, balance: 0 };
        }

        if (user.balance < amount) {
            return ctx.channel.send('You do not have enough coin.');
        }

        // Update balances
        user.balance -= amount;
        target.balance += amount;

        // Save changes
        await Currency.findOneAndUpdate({ userId: ctx.author.id }, { balance: user.balance });
        await Currency.findOneAndUpdate({ userId: targetUser.id }, { balance: target.balance }, { upsert: true });

        // Create an embed for the transaction
        const embed = this.client.embed()
            .setColor(config.color.main)
            .setTitle(`Transaction - ${ctx.author.globalName}`)
            .setDescription(`You have given ${numeral(amount).format()} coin ${SKYREALM} to ${targetUser.globalName}`);

        await ctx.channel.send({ embeds: [embed] });
    }
}

module.exports = Transfer;
