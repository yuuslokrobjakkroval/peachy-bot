const { Command } = require("../../structures");
const Users = require("../../schemas/User");
const config = require("../../config.js");
const numeral = require("numeral");
const { COIN } = require("../../utils/Emoji");

class RemoveMoney extends Command {
    constructor(client) {
        super(client, {
            name: "removemoney",
            description: {
                content: "Remove coins from a user's balance",
                examples: ["removemoney @user 100", "removemoney @user all"],
                usage: "removemoney <user> <amount>",
            },
            category: "admin",
            aliases: ["removemoney", "rm"],
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
        const ownerIds = config.users.owners || [];
        if (ownerIds.includes(ctx.author.id)) {


            const userId = args[0].replace(/[<@!>]/g, '');
            const amountArg = args[1];
            let amount;

            if (amountArg.toLowerCase() === 'all') {
                amount = 'all';
            } else {
                amount = parseInt(amountArg, 10);
                if (isNaN(amount) || amount <= 0) {
                    return ctx.channel.send('Please specify a valid amount of coins or use "all".');
                }
            }

            const targetUser = await client.users.fetch(userId);

            if (!targetUser) {
                return ctx.channel.send('Please mention a valid user.');
            }

            let target = await Users.findOne({userId: targetUser.id});

            if (!target) {
                return ctx.channel.send('The user does not have a balance record.');
            }

            if (amount === 'all') {
                amount = target.balance;
            }

            if (target.balance < amount) {
                return ctx.channel.send(`${targetUser.displayName} does not have enough coins.`);
            }

            const formattedAmount = numeral(amount).format() || '0';
            const targetUsername = targetUser.displayName;

            target.balance -= amount;

            await Users.findOneAndUpdate({userId: targetUser.id}, {balance: target.balance});

            const confirmationEmbed = this.client.embed()
                .setColor(config.color.main)
                .setTitle(`**Remove Coins - ${ctx.author.displayName}**`)
                .setDescription(`You have removed ${formattedAmount} ${COIN} from ${targetUsername}'s balance.`);

            await ctx.channel.send({embeds: [confirmationEmbed]});
        }
    }
}

module.exports = RemoveMoney;
