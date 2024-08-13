const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const numeral = require("numeral");
const { COIN } = require("../../utils/Emoji");

class CheckBalance extends Command {
    constructor(client) {
        super(client, {
            name: "checkbalance",
            description: {
                content: "Check the balance of a specific user",
                examples: ["checkbalance @user"],
                usage: "checkbalance <user>",
            },
            category: "admin",
            aliases: ["checkbalance", "cb"],
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

        if (!userId) {
            return ctx.channel.send('Please mention a valid user.');
        }

        const targetUser = await client.users.fetch(userId);

        if (!targetUser) {
            return ctx.channel.send('Please mention a valid user.');
        }

        const userBalance = await Users.findOne({ userId: targetUser.id });

        if (!userBalance) {
            return ctx.channel.send(`${targetUser.displayName} does not have a balance record.`);
        }

        const formattedBalance = numeral(userBalance.balance).format() || '0';

        // Send balance information
        const balanceEmbed = this.client.embed()
            .setColor(config.color.main)
            .setTitle(`**Balance Check - ${targetUser.displayName}**`)
            .setDescription(`${targetUser.displayName} has ${formattedBalance} ${COIN}.`);

        await ctx.channel.send({ embeds: [balanceEmbed] });
    }
}

module.exports = CheckBalance;
