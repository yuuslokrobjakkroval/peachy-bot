const Command = require("../../structures/Command.js");
const petList = require("../../assets/growing/Pet");
const User = require("../../schemas/user.js");
const QuestTracker = require("../../utils/QuestTracker");

module.exports = class Pet extends Command {
  constructor(client) {
    super(client, {
      name: "pet",
      description: {
        content: "Play the Pet Adventure Game!",
        examples: [
          "pet collect",
          "pet stats",
          "pet train strength",
          "pet quest forest",
          "pet evolve",
        ],
        usage: "pet <action> [option]",
      },
      category: "fun",
      aliases: ["et"],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "action",
          description:
            "Action to perform (collect, stats, train, quest, evolve)",
          type: 3,
          required: true,
        },
        {
          name: "option",
          description: "Option for the action (stat or quest type)",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      const userId = ctx.author.id;
      const action = ctx.isInteraction
        ? ctx.interaction.options.getString("action")
        : args[0];
      const option = ctx.isInteraction
        ? ctx.interaction.options.getString("option")
        : args[1];
      let reply;
      // Use a default color if color.info is undefined or invalid
      const embedColor = color && color.info ? color.info : "#FFCFCF";
      let embed = client.embed().setColor(embedColor);

      // Get or create user
      let user = await User.findOne({ userId });
      if (!user) {
        user = await User.create({ userId });
      }

      if (action === "collect") {
        if (user.adventurePet.petId) {
          embed.setDescription("❗ You already have a pet!");
        } else {
          const pet = petList[Math.floor(Math.random() * petList.length)];
          user.adventurePet = {
            petId: pet.id,
            level: 1,
            exp: 0,
            stats: { strength: 1, agility: 1, intelligence: 1 },
            evolved: false,
            inventory: [],
          };
          await user.save();
          embed.setDescription(
            `🎉 **You collected a pet!**\nName: **${pet.name}** ${pet.emoji[0]}`
          );
        }
        reply = { embeds: [embed] };
      } else if (action === "stats") {
        if (!user.adventurePet.petId) {
          embed.setDescription("❗ You have no pet! Use `pet collect` first.");
        } else {
          // Find pet info from petList
          const petInfo = petList.find((p) => p.id === user.adventurePet.petId);
          const petName = petInfo ? petInfo.name : user.adventurePet.petId;
          const petEmoji = petInfo
            ? petInfo.emoji[user.adventurePet.level - 1]
            : "";
          embed.setDescription(
            `**🐾 Your Pet Stats**\n` +
              `Name: **${petName}** ${petEmoji}\n` +
              `Level: **${user.adventurePet.level}**\n` +
              `EXP: **${user.adventurePet.exp}**\n` +
              `Stats:\n` +
              `• Strength: **${user.adventurePet.stats.strength}**\n` +
              `• Agility: **${user.adventurePet.stats.agility}**\n` +
              `• Intelligence: **${user.adventurePet.stats.intelligence}**\n` +
              `Evolved: ${user.adventurePet.evolved ? "✅" : "❌"}\n` +
              `Inventory: ${user.adventurePet.inventory.length > 0 ? user.adventurePet.inventory.join(", ") : "None"}`
          );
        }
        reply = { embeds: [embed] };
      } else if (action === "train") {
        const stat = option;
        if (!user.adventurePet.petId) {
          embed.setDescription("❗ You have no pet!");
        } else if (!["strength", "agility", "intelligence"].includes(stat)) {
          embed.setDescription(
            "❗ Choose a stat: **strength**, **agility**, **intelligence**"
          );
        } else {
          user.adventurePet.stats[stat] += 1;
          await user.save();
          embed.setDescription(
            `💪 Trained **${stat}**! New value: **${user.adventurePet.stats[stat]}**`
          );

          // Track pet training for quests
          await User.findOneAndUpdate(
            { userId },
            { $inc: { petTrainingCount: 1 } }
          );
          await QuestTracker.updateQuestProgress(userId, "pet_train");
        }
        reply = { embeds: [embed] };
      } else if (action === "quest") {
        const type = option || "forest";
        if (!user.adventurePet.petId) {
          embed.setDescription("❗ You have no pet!");
        } else {
          // Quest logic
          const result = this.doQuest(user.adventurePet, type);

          // Update pet data
          user.adventurePet.exp += result.expGained;
          if (result.reward) {
            user.adventurePet.inventory.push(result.reward.name);
          }

          // Level up logic
          const expList = require("../../assets/growing/ExpList");
          while (
            user.adventurePet.level < 10 &&
            user.adventurePet.exp >= expList[user.adventurePet.level + 1]
          ) {
            user.adventurePet.level++;
          }

          await user.save();

          if (result.success) {
            embed.setDescription(
              `**🌲 Quest Result**\nSuccess! 🎉\nYou found a **${result.reward.name}** and gained **${result.expGained} EXP**.`
            );

            // Track successful pet quest for quests
            await User.findOneAndUpdate(
              { userId },
              { $inc: { petQuestWins: 1 } }
            );
            await QuestTracker.updateQuestProgress(userId, "pet_quest_win");
          } else {
            embed.setDescription(
              `**🌲 Quest Result**\nFailed! 😢\nYou gained **${result.expGained} EXP**.`
            );
          }
        }
        reply = { embeds: [embed] };
      } else if (action === "evolve") {
        if (!user.adventurePet.petId) {
          embed.setDescription("❗ You have no pet!");
        } else if (user.adventurePet.level < 10) {
          embed.setDescription("🔒 Reach level 10 to evolve!");
        } else if (user.adventurePet.evolved) {
          embed.setDescription("⚡ Your pet is already evolved!");
        } else {
          user.adventurePet.evolved = true;
          user.adventurePet.stats.strength += 5;
          user.adventurePet.stats.agility += 5;
          user.adventurePet.stats.intelligence += 5;
          await user.save();
          embed.setDescription("✨ Your pet has evolved! Stats boosted.");
        }
        reply = { embeds: [embed] };
      } else {
        embed.setDescription(
          "**Pet Game Commands:**\n• collect\n• stats\n• train [stat]\n• quest [type]\n• evolve"
        );
        reply = { embeds: [embed] };
      }

      if (ctx.isInteraction) {
        await ctx.interaction.reply(reply);
      } else {
        await ctx.sendMessage(reply);
      }
    } catch (error) {
      const errorMessage =
        "An error occurred while processing your pet command. Please try again later.";
      if (ctx.isInteraction) {
        await ctx.interaction.reply(errorMessage);
      } else {
        await ctx.sendMessage(errorMessage);
      }
      await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
      console.error(error);
    }
  }

  doQuest(pet, questType) {
    // Quest logic similar to PetData.js
    let baseChance = 0.5;
    let statBonus = 0;
    let reward = null;

    switch (questType) {
      case "forest":
        statBonus = pet.stats.agility * 0.05;
        break;
      case "mountain":
        statBonus = pet.stats.strength * 0.05;
        break;
      case "lake":
        statBonus = pet.stats.intelligence * 0.05;
        break;
      default:
        statBonus =
          (pet.stats.strength + pet.stats.agility + pet.stats.intelligence) *
          0.01;
    }

    const successChance = baseChance + statBonus;
    const success = Math.random() < successChance;

    if (success) {
      reward = {
        type: "item",
        name: `${questType} Gem`,
        value: Math.floor(Math.random() * 10 + 5),
      };
    }

    return {
      success,
      reward,
      expGained: success ? 50 : 10,
    };
  }
};
