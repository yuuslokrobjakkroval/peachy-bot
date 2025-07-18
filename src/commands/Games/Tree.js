const { Command } = require("../../structures");
const { generateTreeCanvas } = require("../../utils/GenerateImages");
const Tree = require("../../schemas/tree");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  ComponentType,
} = require("discord.js");

module.exports = class ViewTree extends Command {
  constructor(client) {
    super(client, {
      name: "tree",
      description: {
        content: "View or start your tree!",
        examples: ["tree"],
        usage: "tree",
      },
      category: "games",
      aliases: [],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "EmbedLinks", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    if (!ctx.interaction) {
      return ctx.sendMessage(
        "⚠️ This command only works with slash commands right now.",
      );
    }

    const userId = ctx.author.id;
    let userTree = await Tree.findOne({ userId });

    if (!userTree) {
      // Show modal for new tree name, this is an interaction response
      const modal = new ModalBuilder()
        .setTitle("Name Your Tree")
        .setCustomId(`tree-name-modal-${userId}`);

      const nameInput = new TextInputBuilder()
        .setCustomId("treeName")
        .setLabel("What will you name your tree?")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(32)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(nameInput);
      modal.addComponents(row);

      await ctx.interaction.showModal(modal);
      return;
    }

    // Defer reply immediately to avoid unknown interaction on slow operations
    await ctx.interaction.deferReply();

    const buffer = await generateTreeCanvas({
      height: userTree.tree.height,
    });

    const attachment = new AttachmentBuilder(buffer, { name: "tree.png" });

    const embed = {
      title: `${userTree.tree.name} 🌳`,
      description: `Height: **${userTree.tree.height} ft**\nWatered **${userTree.tree.waterCount}** times`,
      image: { url: "attachment://tree.png" },
      color: color.main,
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("water_tree")
        .setLabel("💧 Water Tree")
        .setStyle(ButtonStyle.Primary),
    );

    // Edit the deferred reply with the actual content
    const message = await ctx.interaction.editReply({
      embeds: [embed],
      files: [attachment],
      components: [row],
    });

    // Button collector (only for user)
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000, // 5 minutes
      filter: (i) => i.user.id === userId,
    });

    collector.on("collect", async (interaction) => {
      const now = Date.now();
      const cooldown = 60 * 1000; // 1 min
      const last = new Date(userTree.tree.lastWatered).getTime();

      if (now - last < cooldown) {
        const remaining = Math.ceil((cooldown - (now - last)) / 1000);
        return interaction.reply({
          content: `⏳ Please wait **<t:${
            Math.round(Date.now() / 1000) + remaining
          }:R>** before watering again.`,
          flags: 64,
        });
      }

      userTree.tree.height += 1;
      userTree.tree.xp += 10;
      userTree.tree.waterCount += 1;
      userTree.tree.lastWatered = new Date();
      await userTree.save();

      const newBuffer = await generateTreeCanvas({
        height: userTree.tree.height,
      });

      const newAttachment = new AttachmentBuilder(newBuffer, {
        name: "tree.png",
      });

      const newEmbed = {
        title: `${userTree.tree.name} 🌳`,
        description: `Height: **${userTree.tree.height} ft**\nWatered **${userTree.tree.waterCount}** times`,
        image: { url: "attachment://tree.png" },
        color: color.main,
      };

      // Update the original message with new embed and image
      await interaction.update({
        embeds: [newEmbed],
        files: [newAttachment],
        components: [row],
      });
    });

    collector.on("end", async () => {
      // Disable button after collector ends
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("water_tree")
          .setLabel("💧 Water Tree")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
      );

      await message.edit({
        components: [disabledRow],
      });
    });
  }
};
