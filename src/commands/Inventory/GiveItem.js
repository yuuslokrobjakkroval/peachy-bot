const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const Users = require("../../schemas/user");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const AllItems = ShopItems.flatMap((shop) => shop.inventory);

module.exports = class GiveItem extends Command {
  constructor(client) {
    super(client, {
      name: "giveitem",
      description: {
        content: "Give your item to another user.",
        examples: ["giveitem @user gem 1", "gi @user gem 1"],
        usage: "give <user> <item> <amount>, gi <user> <item> <amount>",
      },
      category: "inventory",
      aliases: ["gi"],
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
          name: "user",
          description: "The user you want to give to.",
          type: 6,
          required: true,
        },
        {
          name: "item",
          description: "The item you want to give.",
          type: 3,
          required: true,
        },
        {
          name: "amount",
          description: "The amount you want to give.",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const giveItemMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.giveItemMessages;
    const authorId = ctx.author.id;

    try {
      const user = await Users.findOne({ userId: authorId });

      if (!user || user.inventory.length === 0) {
        return await client.utils.sendErrorMessage(client, ctx, giveItemMessages.emptyInventory, color);
      }

      const target = ctx.isInteraction
          ? ctx.interaction.options.getUser("user") || ctx.author
          : ctx.message.mentions.members.first() ||
          ctx.guild.members.cache.get(args[0]) ||
          ctx.member;
      const isBot = target ? (ctx.isInteraction ? target.bot : target.user.bot) : false;

      if (!target || isBot || target.id === authorId) {
        let errorMessage = "";
        if (!target) errorMessage += giveItemMessages.noUser;
        else if (isBot) errorMessage += giveItemMessages.mentionToBot;
        else if (target.id === authorId) errorMessage += giveItemMessages.mentionToSelf;
        return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
      }

      const itemId = ctx.isInteraction ? ctx.interaction.options.data[1]?.value.toString() : args[1];
      const itemInfo = AllItems.concat(ImportantItems).find(
          ({ id }) => id.toLowerCase() === itemId.toLowerCase()
      );
      const hasItems = user.inventory.find(
          (item) => item.id.toLowerCase() === itemId.toLowerCase()
      );

      if (!itemInfo || !hasItems || !itemInfo.able.gift) {
        let errorMessage = "";
        if (!itemInfo)
          errorMessage += giveItemMessages.itemNotFound.replace("{{itemId}}", itemId);
        if (!hasItems)
          errorMessage += giveItemMessages.noItemInInventory
              .replace("{{itemEmote}}", itemInfo?.emoji)
              .replace("{{itemName}}", itemInfo?.name);
        if (!itemInfo?.able.gift)
          errorMessage += giveItemMessages.itemNotGiftable
              .replace("{{itemEmote}}", itemInfo?.emoji)
              .replace("{{itemName}}", itemInfo?.name);
        return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
      }

      let amount = ctx.isInteraction ? ctx.interaction.options.data[2]?.value || 1 : args[2] || 1;
      if (
          isNaN(amount) ||
          amount <= 0 ||
          amount.toString().includes(".") ||
          amount.toString().includes(",")
      ) {
        const amountMap = {
          all: hasItems.quantity,
          half: Math.ceil(hasItems.quantity / 2),
        };
        if (amount in amountMap) amount = amountMap[amount];
        else {
          return await client.utils.sendErrorMessage(client, ctx, giveItemMessages.invalidAmount, color);
        }
      }

      const itemAmount = parseInt(Math.min(amount, hasItems.quantity));

      const embed = client
          .embed()
          .setColor(color.main)
          .setTitle(giveItemMessages.confirmationTitle.replace("{{author}}", ctx.author.displayName))
          .setDescription(giveItemMessages.confirmationDescription.replace("{{author}}", ctx.author.displayName))
          .addFields([
            {
              name: giveItemMessages.sentItem,
              value: `${itemInfo.emoji} **\`${itemAmount.toLocaleString()}\`** ${itemInfo.name}`,
              inline: true,
            },
            {
              name: giveItemMessages.receivedItem,
              value: `${itemInfo.emoji} **\`${itemAmount.toLocaleString()}\`** ${itemInfo.name}`,
              inline: true,
            },
          ]);

      const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
              .setCustomId(`${this.name}_accept`)
              .setLabel("Accept")
              .setStyle(3),
          new ButtonBuilder()
              .setCustomId(`${this.name}_cancel`)
              .setLabel("Cancel")
              .setStyle(4)
      );

      const msg = ctx.isInteraction
          ? ctx.deferred
              ? await ctx.interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
              : await ctx.interaction.reply({ embeds: [embed], components: [row], fetchReply: true })
          : await ctx.channel.send({ embeds: [embed], components: [row], fetchReply: true });

      const filter = (interaction) => interaction.user.id === ctx.author.id;
      const collector = msg.createMessageComponentCollector({
        filter,
        time: 120000,
        idle: 60000,
      });

      collector.on("collect", async (int) => {
        await int.deferUpdate();

        if (int.customId === `${this.name}_accept`) {
          const user = await Users.findOne({ userId: authorId });
          let targetUser = await Users.findOne({ userId: target.id });

          if (!user || user.inventory.length === 0) {
            await int.editReply({
              embeds: [client.embed().setColor(color.error).setDescription("Your inventory is empty.")],
              components: [],
            });
            return;
          }

          if (!targetUser) {
            await int.editReply({
              embeds: [client.embed().setColor(color.error).setDescription(generalMessages.userNotFound)],
              components: [],
            });
            return;
          }

          const hasItems = user.inventory.find((item) => item.id === itemId);
          if (!hasItems) {
            await int.editReply({
              embeds: [client.embed().setColor(color.error).setDescription(
                  giveItemMessages.noItemInInventory
                      .replace("{{itemEmote}}", itemInfo.emoji)
                      .replace("{{itemName}}", itemInfo.name)
              )],
              components: [],
            });
            return;
          }

          // Remove the item or reduce quantity for the author
          if (hasItems.quantity - itemAmount === 0) {
            await Users.updateOne(
                { userId: authorId },
                { $pull: { inventory: { id: itemId } } }
            );
          } else {
            await Users.updateOne(
                { userId: authorId, "inventory.id": itemId },
                { $inc: { "inventory.$.quantity": -itemAmount } }
            );
          }

          // Add or update item for the target
          const targetHasItem = targetUser.inventory.find((item) => item.id === itemId);
          if (targetHasItem) {
            await Users.updateOne(
                { userId: target.id, "inventory.id": itemId },
                { $inc: { "inventory.$.quantity": itemAmount } }
            );
          } else {
            await Users.updateOne(
                { userId: target.id },
                { $push: { inventory: { id: itemId, quantity: itemAmount } } }
            );
          }

          const successEmbed = client
              .embed()
              .setColor(color.main)
              .setDescription(
                  giveItemMessages.transactionSuccess
                      .replace("{{itemEmote}}", itemInfo.emoji)
                      .replace("{{itemAmount}}", itemAmount)
                      .replace("{{itemName}}", itemInfo.name)
                      .replace("{{target}}", target.displayName)
              );

          await int.editReply({ embeds: [successEmbed], components: [] });
        } else if (int.customId === `${this.name}_cancel`) {
          const cancelEmbed = client
              .embed()
              .setColor(color.main)
              .setDescription(giveItemMessages.transactionCancelled);

          await int.editReply({ embeds: [cancelEmbed], components: [] });
        }
      });

      collector.on("end", async () => {
        await msg.edit({ components: [] });
      });

    } catch (err) {
      console.error('Error in giveitem command:', err);
      return await client.utils.sendErrorMessage(client, ctx, generalMessages.error, color);
    }
  }
};