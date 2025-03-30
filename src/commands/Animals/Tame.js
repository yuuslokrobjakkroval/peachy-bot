const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const petList = require("../../assets/growing/Pet");
const moment = require("moment");

module.exports = class Catch extends Command {
  constructor(client) {
    super(client, {
      name: "tame",
      description: {
        content: "Tame a random egg to add to your zoo.",
        examples: ["tame"],
        usage: "tame",
      },
      category: "animals",
      aliases: ["t"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const animalMessages = language.locales.get(language.defaultLocale)?.animalMessages;

    try {
      // Get user data
      const user = await client.utils.getUser(ctx.author.id);
      if (!user) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userNotFound,
          color
        );
      }

      // Check for cooldown
      const cooldownTime = 10 * 60 * 1000; // 10 min cooldown
      const isCooldownExpired = await client.utils.checkCooldown(
        ctx.author.id,
        this.name.toLowerCase(),
        cooldownTime
      );

      if (!isCooldownExpired) {
        const lastCooldownTimestamp = await client.utils.getCooldown(
          ctx.author.id,
          this.name.toLowerCase()
        );
        const remainingTime = Math.ceil(
          (lastCooldownTimestamp + cooldownTime - Date.now()) / 1000
        );
        const duration = moment.duration(remainingTime, "seconds");
        const minutes = Math.floor(duration.asMinutes());
        const seconds = Math.floor(duration.asSeconds()) % 60;

        const cooldownMessage =
          animalMessages?.catch?.cooldown
            ?.replace("%{minutes}", minutes)
            ?.replace("%{seconds}", seconds) ||
          `Please wait ${minutes}m ${seconds}s before catching another egg!`;

        const cooldownEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(cooldownMessage);
        return ctx.sendMessage({ embeds: [cooldownEmbed] });
      }

      // Check if the user already has 10 pets
      if (user.zoo && user.zoo.length >= 10) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.catch?.zooFull ||
              "Your zoo is full! You can only have 10 pets at a time. Sell a pet with `sell <pet id>` to make space."
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Randomly select a pet from the petList
      let randomPet;
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loops in case of edge cases

      do {
        randomPet = petList[Math.floor(Math.random() * petList.length)];
        attempts++;
        if (attempts >= maxAttempts) {
          const embed = client
            .embed()
            .setColor(color.danger)
            .setDescription(
              animalMessages?.catch?.allPetsOwned ||
                "You already own one of each pet type! Sell a pet with `sell <pet id>` to catch a new one."
            );
          return ctx.sendMessage({ embeds: [embed] });
        }
      } while (user.zoo && user.zoo.some((pet) => pet.id === randomPet.id));

      // Create the new pet (egg) at Level 1
      const newPet = {
        id: randomPet.id, // e.g., "bubbles"
        level: 1, // Always start at Level 1
        levelXp: 0, // Start with 0 XP
        lastXpGain: Date.now(),
      };

      // Add the pet to the user's zoo
      await Users.updateOne(
        { userId: user.userId },
        { $push: { zoo: newPet } }
      );

      // Update the cooldown
      await client.utils.updateCooldown(
        ctx.author.id,
        this.name.toLowerCase(),
        cooldownTime
      );

      // Create an embed to display the result
      const successEmbed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          (generalMessages?.title
            ?.replace("%{mainLeft}", emoji.mainLeft)
            ?.replace("%{title}", "CATCH")
            ?.replace("%{mainRight}", emoji.mainRight) || "✨ **CATCH** ✨") +
            (animalMessages?.catch?.success
              ?.replace("%{petName}", randomPet.name)
              ?.replace("%{emoji}", randomPet.emoji[0]) ||
              `\nYou caught a **${randomPet.name}** egg! ${randomPet.emoji[0]}\nIt has been added to your zoo.`)
        )
        .setFooter({
          text:
            generalMessages?.requestedBy?.replace(
              "%{username}",
              ctx.author.displayName
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return ctx.sendMessage({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error processing Catch command:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.userFetchError ||
          "An error occurred while fetching user data.",
        color
      );
    }
  }
};
