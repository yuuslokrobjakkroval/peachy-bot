const { Command } = require("../../structures");
const Tree = require("../../schemas/tree");

module.exports = class ShopCommand extends Command {
  constructor(client) {
    super(client, {
      name: "growingshop",
      description: {
        content: "Open the tree shop to buy upgrades or sell your tree.",
        examples: ["growingshop"],
        usage: "growingshop",
      },
      category: "games",
      cooldown: 5,
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color) {
    const tree = await Tree.findOne({ userId: ctx.author.id });

    if (!tree) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.warning)
            .setDescription(
              "🌱 You don't have a tree yet. Use `/starttree` to plant one!"
            ),
        ],
      });
    }

    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "🌾 Buy Fertilizer (50 coins)",
            style: 1,
            custom_id: "buy_fertilizer",
            disabled: tree.upgrades.fertilizer,
          },
          {
            type: 2,
            label: "🌧 Buy Rain (100 coins)",
            style: 1,
            custom_id: "buy_rain",
            disabled: tree.upgrades.rain,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "💰 Sell Tree",
            style: 4,
            custom_id: "sell_tree",
          },
        ],
      },
    ];

    await ctx.sendMessage({
      embeds: [
        client
          .embed()
          .setTitle("🌿 Growing Shop")
          .setColor(color.success)
          .setDescription(
            `Welcome to the **Growing Shop**!\n\n` +
              `🌾 **Fertilizer** – Gain +5 XP per watering (**50 coins**)\n` +
              `🌧 **Rain** – Water more often (25% shorter cooldown) (**100 coins**)\n\n` +
              `💰 **Sell Tree** – Trade your tree for coins based on your level & XP.\n\n` +
              `🪙 You currently have **${tree.coins} coins**.`
          ),
      ],
      components,
    });

    const collector = ctx.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 30_000,
      max: 1,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();

      // BUY FERTILIZER
      if (interaction.customId === "buy_fertilizer") {
        if (tree.coins < 50) {
          return ctx.sendFollowUp({
            embeds: [
              client
                .embed()
                .setColor(color.error)
                .setDescription(
                  "❌ You don’t have enough coins to buy **Fertilizer**."
                ),
            ],
            ephemeral: true,
          });
        }

        if (tree.upgrades.fertilizer) {
          return ctx.sendFollowUp({
            embeds: [
              client
                .embed()
                .setColor(color.warning)
                .setDescription("🌾 You already own **Fertilizer**."),
            ],
            ephemeral: true,
          });
        }

        tree.coins -= 50;
        tree.upgrades.fertilizer = true;
        await tree.save();

        return ctx.sendFollowUp({
          embeds: [
            client
              .embed()
              .setColor(color.success)
              .setTitle("✅ Fertilizer Purchased!")
              .setDescription(
                "Your tree will now gain **+5 XP** per watering. 🌾"
              ),
          ],
        });
      }

      // BUY RAIN
      if (interaction.customId === "buy_rain") {
        if (tree.coins < 100) {
          return ctx.sendFollowUp({
            embeds: [
              client
                .embed()
                .setColor(color.error)
                .setDescription(
                  "❌ You don’t have enough coins to buy **Rain**."
                ),
            ],
            ephemeral: true,
          });
        }

        if (tree.upgrades.rain) {
          return ctx.sendFollowUp({
            embeds: [
              client
                .embed()
                .setColor(color.warning)
                .setDescription("🌧 You already own **Rain**."),
            ],
            ephemeral: true,
          });
        }

        tree.coins -= 100;
        tree.upgrades.rain = true;
        await tree.save();

        return ctx.sendFollowUp({
          embeds: [
            client
              .embed()
              .setColor(color.success)
              .setTitle("✅ Rain Purchased!")
              .setDescription(
                "Your watering cooldown is now reduced by **25%**! 🌧"
              ),
          ],
        });
      }

      // SELL TREE
      if (interaction.customId === "sell_tree") {
        const xpValue = Math.floor(tree.tree.xp / 2);
        const levelValue = tree.tree.level * 25;
        const totalCoins = xpValue + levelValue;

        await Tree.findOneAndUpdate(
          { userId: ctx.author.id },
          {
            $set: {
              "tree.xp": 0,
              "tree.level": 1,
              "tree.stage": "Seed",
              "tree.lastWatered": 0,
              coins: tree.coins + totalCoins,
              upgrades: {
                fertilizer: false,
                rain: false,
              },
            },
          }
        );

        return ctx.sendFollowUp({
          embeds: [
            client
              .embed()
              .setColor(color.success)
              .setTitle("💰 Tree Sold!")
              .setDescription(
                `You earned **${totalCoins} coins** by selling your tree.\n` +
                  `Your tree has been reset to a 🌱 **Seed**.`
              ),
          ],
        });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        ctx.sendFollowUp({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setDescription("⏱ The shop has closed due to inactivity."),
          ],
          ephemeral: true,
        });
      }
    });
  }
};
