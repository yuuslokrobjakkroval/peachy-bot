const { Command } = require("../../structures");
const Users = require("../../schemas/User");
const config = require("../../config.js");
const numeral = require("numeral");
const { COIN, IMMORTAL, IMMORTAL_TITLE, DIVINE, ANCIENT, LEGEND, ARCHON, CRUSADER, GUARDIAN, HERALD } = require("../../utils/Emoji");

const handleEmoji = (no) => {
    switch (no) {
        case 1:
            return IMMORTAL;
        case 2:
            return DIVINE;
        case 3:
            return ANCIENT;
        case 4:
            return LEGEND;
        case 5:
            return ARCHON;
        case 6:
            return CRUSADER;
        case 7:
            return GUARDIAN;
        case 8:
            return HERALD;
        default:
            return HERALD;
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
                return `${emoji} ${displayName}\n ${balance} coin ${COIN}\n`;
            }).join('\n');

            const embed = this.client.embed()
                .setColor(config.color.main)
                .setTitle(`${IMMORTAL_TITLE}** Top Phhum Coin LeaderBoard **${IMMORTAL_TITLE}\n`)
                .setDescription(`Here are the top users with the highest coin balances:\n ${description}`);

            await ctx.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error("Error fetching top users:", error);
            await ctx.channel.send("There was an error while trying to fetch the top users.");
        }
    }
}

module.exports = Ranking;
