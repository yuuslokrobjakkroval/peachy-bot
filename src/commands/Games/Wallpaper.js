const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const Wallpapers = require("../../assets/json/wallpapers.json");

const wallpaperCategories = [
  ...new Set(Wallpapers.map((wallpaper) => wallpaper.type)),
]; // Extract unique categories

module.exports = class Wallpaper extends Command {
  constructor(client) {
    super(client, {
      name: "wallpaper",
      description: {
        content: "𝑽𝒊𝒆𝒘 𝒘𝒂𝒍𝒍𝒑𝒂𝒑𝒆𝒓𝒔 𝒇𝒐𝒓 𝑷𝑪 𝒐𝒓 𝑷𝒉𝒐𝒏𝒆.",
        examples: ["wallpaper"],
        usage: "wallpaper",
      },
      category: "games",
      aliases: ["wp"],
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
    let selectedCategory = args[0] || wallpaperCategories[0]; // Default to the first category
    const wallpaper = language.locales.get(language.defaultLocale)?.funMessage
      ?.wallpaper;
    let selectedWallpapers = Wallpapers.filter(
      (wallpaper) => wallpaper.type === selectedCategory
    );

    const pages = [];
    const itemsPerPage = 5; // Adjust the number of wallpapers per page
    const totalPages = Math.ceil(selectedWallpapers.length / itemsPerPage);

    for (let i = 0; i < totalPages; i++) {
      const currentItems = selectedWallpapers.slice(
        i * itemsPerPage,
        (i + 1) * itemsPerPage
      );
      const wallpaperList = currentItems
        .map(
          (wallpaper, index) =>
            `${index + 1}. ${wallpaper.emoji} ****${wallpaper.name}****`
        )
        .join("\n\n");

      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle(
          `${emoji.mainLeft} 𝐖𝐀𝐋𝐋𝐏𝐀𝐏𝐄𝐑𝐒 - ${client.utils.formatCapitalize(
            selectedCategory
          )} ${emoji.mainRight}`
        )
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(`${wallpaperList}`)
        .setFooter({ text: `Page ${i + 1} of ${totalPages}` });

      pages.push({ embed });
    }

    await paginateWallpapers(
      client,
      ctx,
      color,
      emoji,
      pages,
      selectedCategory,
      selectedWallpapers,
      wallpaper
    );
  }
};

async function paginateWallpapers(
  client,
  ctx,
  color,
  emoji,
  pages,
  selectedCategory,
  selectedWallpapers,
  wallpaper
) {
  let page = 0;
  let selectedItemIndex = null; // For selecting specific wallpaper within the category
  const itemsPerPage = 5; // Number of wallpapers per page

  const updatePages = (selectedCategory) => {
    selectedWallpapers = Wallpapers.filter(
      (wallpaper) => wallpaper.type === selectedCategory
    );

    pages.length = 0; // Clear previous pages
    const totalPages = Math.ceil(selectedWallpapers.length / itemsPerPage);

    for (let i = 0; i < totalPages; i++) {
      const currentItems = selectedWallpapers.slice(
        i * itemsPerPage,
        (i + 1) * itemsPerPage
      );
      const wallpaperList = currentItems
        .map(
          (wallpaper, index) =>
            `${index + 1}. ${wallpaper.emoji} ****${wallpaper.name}****`
        )
        .join("\n\n");

      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle(
          `${emoji.mainLeft} 𝐖𝐀𝐋𝐋𝐏𝐀𝐏𝐄𝐑𝐒 - ${client.utils.formatCapitalize(
            selectedCategory
          )} ${emoji.mainRight}`
        )
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(`${wallpaperList}`)
        .setFooter({ text: `Page ${i + 1} of ${totalPages}` });

      pages.push({ embed });
    }
  };

  const getButtonRow = () => {
    const prevButton = client.utils.emojiButton("prev_item", "⬅️", 2);
    const nextButton = client.utils.emojiButton("next_item", "➡️", 2);

    const categoryOptions = wallpaperCategories
      .filter((cat) => typeof cat === "string")
      .map((cat) => ({
        label: client.utils.formatCapitalize(cat),
        value: cat,
        default: cat === selectedCategory,
      }));

    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId("category_select")
      .setPlaceholder(wallpaper.selectCategory)
      .addOptions(categoryOptions);

    const itemOptions = selectedWallpapers
      .filter((item) => item && item.id && typeof item.id === "string")
      .map((item) => ({
        label: item.name,
        value: item.id,
        default:
          item.id === selectedWallpapers[selectedItemIndex]?.id.toString(),
      }))
      .slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const itemSelect = new StringSelectMenuBuilder()
      .setCustomId("item_select")
      .setPlaceholder(wallpaper.selectWallpaper)
      .addOptions(
        itemOptions.length
          ? itemOptions
          : [{ label: wallpaper.noWallpapers, value: "none" }]
      );

    const row1 = new ActionRowBuilder().addComponents(categorySelect);
    const row2 = new ActionRowBuilder().addComponents(itemSelect);
    const row3Components = [];
    if (selectedItemIndex !== null) {
      row3Components.push(prevButton, nextButton);
    }

    const row3 =
      row3Components.length > 0
        ? new ActionRowBuilder().addComponents(row3Components)
        : null;

    return {
      components: [row1, row2, row3].filter((row) => row !== null),
      embeds: [pages[page]?.embed],
    };
  };

  const displayItemDetails = (selectedItemIndex) => {
    const selectedWallpaper = selectedWallpapers[selectedItemIndex];

    if (!selectedWallpaper) {
      console.error("Wallpaper not found at index:", selectedItemIndex);
      return {
        embed: client
          .embed()
          .setDescription(wallpaper.wallpaperNotFound)
          .setColor(color.danger),
      }; // Localized message
    }

    const embed = client
      .embed()
      .setColor(color.main)
      .setTitle(
        `${wallpaper.DetailsTitle}\n${emoji.mainLeft} ${selectedWallpaper.name} ${emoji.mainRight}`
      ) // Localized title
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(
        `****ID : ${selectedWallpaper.id}**** \n****${
          wallpaper.descriptionLabel
        } : **** ${selectedWallpaper.description}\n****${
          wallpaper.categoryLabel
        } : **** ${client.utils.formatCapitalize(selectedWallpaper.type)}`
      )
      .setImage(selectedWallpaper.image);

    return { embed };
  };

  const msg = ctx.isInteraction
    ? await ctx.interaction.reply({ ...getButtonRow(), fetchReply: true })
    : await ctx.channel.send({ ...getButtonRow(), fetchReply: true });

  if (!msg) {
    console.error("Message could not be sent.");
    return;
  }

  const collector = msg.createMessageComponentCollector({
    filter: (int) => int.user.id === ctx.author.id,
    time: 300000, // 5 minutes
  });

  collector.on("collect", async (int) => {
    if (int.customId === "prev_item") {
      if (selectedItemIndex !== null) {
        selectedItemIndex--;
        if (selectedItemIndex < 0)
          selectedItemIndex = selectedWallpapers.length - 1;
        await int.update({
          embeds: [displayItemDetails(selectedItemIndex).embed],
          components: getButtonRow().components,
        });
      }
    } else if (int.customId === "next_item") {
      if (selectedItemIndex !== null) {
        selectedItemIndex++;
        if (selectedItemIndex >= selectedWallpapers.length)
          selectedItemIndex = 0;
        await int.update({
          embeds: [displayItemDetails(selectedItemIndex).embed],
          components: getButtonRow().components,
        });
      }
    } else if (int.customId === "prev_page") {
      page--;
      if (page < 0) page = pages.length - 1;
      await int.update(getButtonRow());
    } else if (int.customId === "next_page") {
      page++;
      if (page >= pages.length) page = 0;
      await int.update(getButtonRow());
    } else if (int.customId === "category_select") {
      selectedCategory = int.values[0];
      updatePages(selectedCategory);
      page = 0;
      selectedItemIndex = null;
      await int.update(getButtonRow());
    } else if (int.customId === "item_select") {
      selectedItemIndex = selectedWallpapers.findIndex(
        (w) => w.id.toString() === int.values[0]
      );
      if (selectedItemIndex !== -1) {
        await int.update({
          embeds: [displayItemDetails(selectedItemIndex).embed],
          components: getButtonRow().components,
        });
      }
    }
  });

  collector.on("end", () => {
    msg.edit({ components: [] }); // Disable the buttons after the collector ends
  });
}
