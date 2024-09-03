const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const config = require("../../config.js");
const numeral = require("numeral");

const handleEmoji = (no) => {
    switch (no) {
        case 1:
            return this.client.emoji.rank.one;
        case 2:
            return this.client.emoji.rank.two;
        case 3:
            return this.client.emoji.rank.three;
        case 4:
            return this.client.emoji.rank.four;
        case 5:
            return this.client.emoji.rank.five;
        case 6:
            return this.client.emoji.rank.six;
        case 7:
            return this.client.emoji.rank.seven;
        case 8:
            return this.client.emoji.rank.eight;
        default:
            return this.client.emoji.rank.nine;
    }
}

class Ranking extends Command {
    constructor(client) {
        super(client, {
            name: "ranking",
            description: {
                content: "Displays the top users with the highest coins balances",
                examples: ["ranking"],
                usage: "ranking",
            },
            category: "economy",
            aliases: ["top"],
            cooldown: 1,
            args: false,
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
        try {
            const usersWithBalance = await Users.find({ balance: { $gt: 0 } }).sort({ balance: -1 }).limit(10);

            const memberPromises = usersWithBalance.map(async (user, index) => {
                const member = await ctx.guild.members.fetch(user.userId);
                return {
                    emoji: handleEmoji(index + 1),
                    displayName: member ? member.displayName : 'Unknown User',
                    balance: numeral(user.balance).format(),
                };
            });

            const memberData = await Promise.all(memberPromises);

            const description = memberData.map(({ emoji, displayName, balance }) => {
                return `${emoji} ${displayName}\n ${balance} coin ${client.emoji.coin}\n`;
            }).join('\n');

            const embed = this.client.embed()
                .setColor(config.color.main)
                .setTitle(`${client.emoji.mainLeft}** Top Phum Coin LeaderBoard **${client.emoji.mainRight}\n`)
                .setDescription(`Here are the top users with the highest coin balances:\n ${description}`);

            await ctx.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error("Error fetching top users:", error);
            await ctx.channel.send("There was an error while trying to fetch the top users.");
        }
    }
}

module.exports = Ranking;
