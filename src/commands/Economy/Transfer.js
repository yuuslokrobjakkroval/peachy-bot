const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const numeral = require("numeral");
const { COIN } = require("../../utils/Emoji");

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
            aliases: ["give", 'pay', 'oy'],
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

        if(args[1] !== 'all') {
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

        user.balance -= amount;
        target.balance += amount;

        await Users.findOneAndUpdate({ userId: ctx.author.id }, { balance: user.balance });
        await Users.findOneAndUpdate({ userId: targetUser.id }, { balance: target.balance }, { upsert: true });

        const embed = this.client.embed()
            .setColor(config.color.main)
            .setTitle(`**Transaction - ${ctx.author.displayName}**`)
            .setDescription(`You have given ${numeral(amount).format()} ${COIN} to ${targetUser.displayName}`);

        await ctx.channel.send({ embeds: [embed] });
    }
}

module.exports = Transfer;