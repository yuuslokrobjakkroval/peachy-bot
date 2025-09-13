const Command = require("../../structures/Command.js");
const User = require("../../schemas/user.js");

// Example quest objectives
const dailyObjectives = [
  "Send 10 messages in any channel",
  "Collect 5 items",
  "Win 1 pet quest",
  "Train your pet 3 times",
  "React to 5 messages",
];
const weeklyObjectives = [
  "Win 5 pet quests",
  "Collect 20 items",
  "Reach pet level 7",
  "Send 50 messages",
  "Train your pet 15 times",
];

function getToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function getWeek() {
  const d = new Date();
  const year = d.getFullYear();
  const week = Math.ceil(
    ((d - new Date(year, 0, 1)) / 86400000 +
      new Date(year, 0, 1).getDay() +
      1) /
      7
  );
  return `${year}-W${week}`;
}
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = class Quest extends Command {
  constructor(client) {
    super(client, {
      name: "quest",
      description: {
        content: "View and claim your daily/weekly quests.",
        examples: ["quest", "quest claim daily", "quest claim weekly"],
        usage: "quest [claim] [daily|weekly]",
      },
      category: "fun",
      aliases: [],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "action",
          description: "View or claim quest",
          type: 3,
          required: false,
        },
        {
          name: "type",
          description: "Quest type (daily or weekly)",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color) {
    try {
      const userId = ctx.author.id;
      const action = ctx.isInteraction
        ? ctx.interaction.options.getString("action")
        : args[0];
      const type = ctx.isInteraction
        ? ctx.interaction.options.getString("type")
        : args[1];
      const embedColor = color && color.info ? color.info : "#FFCFCF";
      let embed = client.embed().setColor(embedColor);

      // Fetch user from DB
      let user = await User.findOne({ userId });
      if (!user) {
        user = await User.create({ userId });
      }
      const today = getToday();
      const week = getWeek();

      // Generate daily quest if not set or outdated
      if (!user.quests.daily.date || user.quests.daily.date !== today) {
        user.quests.daily = {
          date: today,
          objective: getRandom(dailyObjectives),
          completed: false,
          claimed: false,
        };
      }
      // Generate weekly quest if not set or outdated
      if (!user.quests.weekly.week || user.quests.weekly.week !== week) {
        user.quests.weekly = {
          week: week,
          objective: getRandom(weeklyObjectives),
          completed: false,
          claimed: false,
        };
      }
      await user.save();

      // Claim logic
      if (action === "claim") {
        if (type === "daily") {
          if (!user.quests.daily.completed) {
            embed.setDescription(
              "❗ You have not completed your daily quest yet!"
            );
          } else if (user.quests.daily.claimed) {
            embed.setDescription(
              "✅ You have already claimed your daily quest reward!"
            );
          } else {
            user.quests.daily.claimed = true;
            await user.save();
            embed.setDescription("🎉 You claimed your daily quest reward!");
            // TODO: Add reward logic here
          }
        } else if (type === "weekly") {
          if (!user.quests.weekly.completed) {
            embed.setDescription(
              "❗ You have not completed your weekly quest yet!"
            );
          } else if (user.quests.weekly.claimed) {
            embed.setDescription(
              "✅ You have already claimed your weekly quest reward!"
            );
          } else {
            user.quests.weekly.claimed = true;
            await user.save();
            embed.setDescription("🎉 You claimed your weekly quest reward!");
            // TODO: Add reward logic here
          }
        } else {
          embed.setDescription("❗ Specify quest type: daily or weekly");
        }
        return ctx.isInteraction
          ? await ctx.interaction.reply({ embeds: [embed] })
          : await ctx.sendMessage({ embeds: [embed] });
      }

      // View quest status
      embed.setDescription(
        `**📅 Daily Quest**\nObjective: ${user.quests.daily.objective}\nCompleted: ${user.quests.daily.completed ? "✅" : "❌"}\nClaimed: ${user.quests.daily.claimed ? "✅" : "❌"}\n\n` +
          `**🗓️ Weekly Quest**\nObjective: ${user.quests.weekly.objective}\nCompleted: ${user.quests.weekly.completed ? "✅" : "❌"}\nClaimed: ${user.quests.weekly.claimed ? "✅" : "❌"}`
      );
      return ctx.isInteraction
        ? await ctx.interaction.reply({ embeds: [embed] })
        : await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      const errorMessage =
        "An error occurred while processing your quest command. Please try again later.";
      if (ctx.isInteraction) {
        await ctx.interaction.reply(errorMessage);
      } else {
        await ctx.sendMessage(errorMessage);
      }
      await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
      console.error(error);
    }
  }
};
