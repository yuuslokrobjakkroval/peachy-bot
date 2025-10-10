const { Command } = require("../../structures/index.js");
const FishingTools = require("../../assets/inventory/FishingTools.js");
const Fish = require("../../assets/inventory/Fish.js");

module.exports = class Fish extends Command {
  constructor(client) {
    super(client, {
      name: "fish",
      description: {
        content: "Go fishing with logic puzzles and mini-games!",
        examples: ["fish", "fish puzzle", "fish quick"],
        usage: "fish [mode]",
      },
      category: "inventory",
      aliases: ["fishing"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks", "AddReactions"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "mode",
          description: "Fishing mode: normal, puzzle, or quick",
          type: 3,
          required: false,
          choices: [
            { name: "Normal Fishing", value: "normal" },
            { name: "Puzzle Fishing", value: "puzzle" },
            { name: "Quick Fishing", value: "quick" },
          ],
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const author = ctx.author;
    const user = await client.utils.getCachedUser(author.id);

    if (!user) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "You need to register first! Use the `/register` command.",
        color
      );
    }

    // Parse mode - handle both text and slash commands
    let mode =
      args[0]?.toLowerCase() || ctx.options?.getString("mode") || "normal";

    // Get equipped fishing tool
    let userTool = user.equip.find((equip) =>
      FishingTools.some((tool) => tool.id === equip.id)
    );

    if (!userTool) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "You need a fishing tool! Available tools: `pole`, `net`, `spear`, `trap`",
        color
      );
    }

    const equippedTool = FishingTools.find((tool) => tool.id === userTool.id);
    if (!equippedTool) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "Invalid fishing tool equipped!",
        color
      );
    }

    // Check cooldown
    const cooldown = user.cooldowns.find((c) => c.name === "fish");
    const cooldownTime =
      mode === "quick" ? 5000 : mode === "puzzle" ? 20000 : 10000;
    const isOnCooldown = cooldown
      ? Date.now() - cooldown.timestamp < cooldownTime
      : false;

    if (isOnCooldown) {
      const remainingTime = Math.ceil(
        (cooldown.timestamp + cooldownTime - Date.now()) / 1000
      );
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        `You're still fishing! Please wait <t:${Math.round(Date.now() / 1000) + remainingTime}:R>.`,
        color,
        remainingTime * 1000
      );
    }

    // Execute fishing based on mode
    switch (mode) {
      case "puzzle":
        return await this.puzzleFishing(
          client,
          ctx,
          user,
          equippedTool,
          color,
          emoji,
          language
        );
      case "quick":
        return await this.quickFishing(
          client,
          ctx,
          user,
          equippedTool,
          color,
          emoji,
          language
        );
      default:
        return await this.normalFishing(
          client,
          ctx,
          user,
          equippedTool,
          color,
          emoji,
          language
        );
    }
  }

  async normalFishing(client, ctx, user, tool, color, emoji, language) {
    // Standard resource gathering using existing system
    return await client.resourceManager.gatherResource(
      ctx,
      "Fish",
      FishingTools,
      Fish,
      emoji,
      color,
      language
    );
  }

  async quickFishing(client, ctx, user, tool, color, emoji, language) {
    const author = ctx.author;

    // Quick fishing - simple reaction game
    const reactionEmojis = ["🎣", "🐟", "🌊", "⚡"];
    const targetEmoji =
      reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        "🎣 **QUICK FISHING CHALLENGE** 🎣\n\nClick the correct reaction when it appears!\n\n**Target:** " +
          targetEmoji
      )
      .setFooter({ text: "You have 5 seconds!" });

    const message = await ctx.sendMessage({ embeds: [embed] });

    // Add reactions
    for (const emoji of reactionEmojis) {
      await message.react(emoji);
    }

    // Wait for reaction
    const filter = (reaction, user) => {
      return (
        reactionEmojis.includes(reaction.emoji.name) && user.id === author.id
      );
    };

    try {
      const collected = await message.awaitReactions({
        filter,
        max: 1,
        time: 5000,
        errors: ["time"],
      });
      const reaction = collected.first();

      if (reaction.emoji.name === targetEmoji) {
        // Success - give bonus fish
        const bonusFish = this.generateBonusFish(tool);
        await this.updateUserInventory(client, author.id, bonusFish, "quick");

        const successEmbed = client
          .embed()
          .setColor(color.success)
          .setDescription(
            `🎉 **Perfect catch!** You caught ${bonusFish.emoji} **${bonusFish.name}**!`
          )
          .addFields({
            name: "💰 Value",
            value: `**${client.utils.formatNumber(bonusFish.price.sell)}** ${emoji.coin}`,
            inline: true,
          });

        return await ctx.editMessage({ embeds: [successEmbed] });
      } else {
        // Wrong reaction
        const failEmbed = client
          .embed()
          .setColor(color.error)
          .setDescription("❌ **Wrong reaction!** The fish got away...");

        await this.updateCooldown(client, author.id, "fish", 5000);
        return await ctx.editMessage({ embeds: [failEmbed] });
      }
    } catch (error) {
      // Timeout
      const timeoutEmbed = client
        .embed()
        .setColor(color.error)
        .setDescription("⏰ **Too slow!** The fish swam away...");

      await this.updateCooldown(client, author.id, "fish", 5000);
      return await ctx.editMessage({ embeds: [timeoutEmbed] });
    }
  }

  async puzzleFishing(client, ctx, user, tool, color, emoji, language) {
    const author = ctx.author;
    const puzzles = [
      {
        type: "math",
        question: () => {
          const a = Math.floor(Math.random() * 20) + 1;
          const b = Math.floor(Math.random() * 20) + 1;
          const operations = ["+", "-", "*"];
          const op = operations[Math.floor(Math.random() * operations.length)];
          let answer;
          let question;

          switch (op) {
            case "+":
              answer = a + b;
              question = `${a} + ${b}`;
              break;
            case "-":
              answer = Math.abs(a - b);
              question = `${Math.max(a, b)} - ${Math.min(a, b)}`;
              break;
            case "*":
              answer = a * b;
              question = `${a} × ${b}`;
              break;
          }
          return { question, answer };
        },
      },
      {
        type: "sequence",
        question: () => {
          const sequences = [
            { pattern: [2, 4, 6, 8], next: 10, question: "2, 4, 6, 8, ?" },
            { pattern: [1, 4, 9, 16], next: 25, question: "1, 4, 9, 16, ?" },
            { pattern: [1, 1, 2, 3, 5], next: 8, question: "1, 1, 2, 3, 5, ?" },
            { pattern: [3, 6, 12, 24], next: 48, question: "3, 6, 12, 24, ?" },
          ];
          const selected =
            sequences[Math.floor(Math.random() * sequences.length)];
          return { question: selected.question, answer: selected.next };
        },
      },
      {
        type: "riddle",
        question: () => {
          const riddles = [
            {
              question: "I have scales but I'm not a dragon. What am I?",
              answer: "fish",
            },
            {
              question: "What gets wetter the more it dries?",
              answer: "towel",
            },
            { question: "What has fins but can't swim?", answer: "shark" },
            {
              question: "I'm full of holes but still hold water. What am I?",
              answer: "sponge",
            },
          ];
          const selected = riddles[Math.floor(Math.random() * riddles.length)];
          return selected;
        },
      },
    ];

    const selectedPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    const puzzleData = selectedPuzzle.question();

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `🧩 **PUZZLE FISHING CHALLENGE** 🧩\n\nSolve this ${selectedPuzzle.type} puzzle to catch a rare fish!\n\n**${puzzleData.question}**`
      )
      .setFooter({ text: "You have 30 seconds! Type your answer." });

    await ctx.sendMessage({ embeds: [embed] });

    // Wait for answer
    const filter = (m) => m.author.id === author.id;

    try {
      const collected = await ctx.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      const response = collected.first();
      const userAnswer = response.content.toLowerCase().trim();
      const correctAnswer = puzzleData.answer.toString().toLowerCase();

      if (userAnswer === correctAnswer) {
        // Correct answer - give rare fish
        const rareFish = this.generateRareFish(tool);
        await this.updateUserInventory(client, author.id, rareFish, "fish");

        const successEmbed = client
          .embed()
          .setColor(color.success)
          .setDescription(
            `🎉 **Excellent!** Your clever thinking attracted ${rareFish.emoji} **${rareFish.name}**!`
          )
          .addFields(
            {
              name: "🧠 Puzzle Bonus",
              value: "Rare fish catch!",
              inline: true,
            },
            {
              name: "💰 Value",
              value: `**${client.utils.formatNumber(rareFish.price.sell)}** ${emoji.coin}`,
              inline: true,
            }
          );

        return await ctx.sendMessage({ embeds: [successEmbed] });
      } else {
        // Wrong answer
        const failEmbed = client
          .embed()
          .setColor(color.error)
          .setDescription(
            `❌ **Wrong answer!** The correct answer was **${puzzleData.answer}**.\nThe fish got spooked and swam away...`
          );

        await this.updateCooldown(client, author.id, "fish", 20000);
        return await ctx.sendMessage({ embeds: [failEmbed] });
      }
    } catch (error) {
      // Timeout
      const timeoutEmbed = client
        .embed()
        .setColor(color.error)
        .setDescription(
          `⏰ **Time's up!** The correct answer was **${puzzleData.answer}**.\nThe fish lost interest and left...`
        );

      await this.updateCooldown(client, author.id, "fish", 20000);
      return await ctx.sendMessage({ embeds: [timeoutEmbed] });
    }
  }

  generateBonusFish(tool) {
    // Generate better fish for quick game success
    const fishList = Fish.filter((f) =>
      ["uncommon", "rare"].includes(f.rarity)
    );
    return fishList[Math.floor(Math.random() * fishList.length)];
  }

  generateRareFish(tool) {
    // Generate rare/legendary fish for puzzle success
    const fishList = Fish.filter((f) =>
      ["rare", "legendary", "mythical"].includes(f.rarity)
    );
    return fishList[Math.floor(Math.random() * fishList.length)];
  }

  async updateUserInventory(client, userId, fish, cooldownType) {
    await client.utils.updateUserWithRetry(userId, async (user) => {
      // Add fish to inventory
      const existingFish = user.inventory.find((item) => item.id === fish.id);
      if (existingFish) {
        existingFish.quantity += 1;
      } else {
        user.inventory.push({ id: fish.id, quantity: 1 });
      }

      // Update tool durability if not hand
      const toolIds = ["pole", "net", "spear", "trap"];
      const equipItem = user.equip.find((equip) => toolIds.includes(equip.id));
      if (equipItem) {
        equipItem.quantity -= 1;
        if (equipItem.quantity <= 0) {
          user.equip = user.equip.filter((equip) => equip.id !== equipItem.id);
        }
      }

      // Update cooldown
      const cooldownTime =
        cooldownType === "quick"
          ? 5000
          : cooldownType === "puzzle"
            ? 20000
            : 10000;
      const existingCooldown = user.cooldowns.find((c) => c.name === "fish");
      if (existingCooldown) {
        existingCooldown.timestamp = Date.now();
      } else {
        user.cooldowns.push({
          name: "fish",
          timestamp: Date.now(),
          duration: cooldownTime,
        });
      }
    });
  }

  async updateCooldown(client, userId, cooldownName, duration) {
    await client.utils.updateUserWithRetry(userId, async (user) => {
      const existingCooldown = user.cooldowns.find(
        (c) => c.name === cooldownName
      );
      if (existingCooldown) {
        existingCooldown.timestamp = Date.now();
      } else {
        user.cooldowns.push({
          name: cooldownName,
          timestamp: Date.now(),
          duration: duration,
        });
      }
    });
  }
};
