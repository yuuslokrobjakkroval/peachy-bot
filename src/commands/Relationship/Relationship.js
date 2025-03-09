const { Command } = require("../../structures");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts} = require("@napi-rs/canvas");

GlobalFonts.registerFromPath(
    "./src/data/fonts/Kelvinch-Roman.otf",
    "Kelvinch-Roman"
);
GlobalFonts.registerFromPath(
    "./src/data/fonts/Kelvinch-Bold.otf",
    "Kelvinch-Bold"
);
GlobalFonts.registerFromPath(
    "./src/data/fonts/Adore Cats.ttf",
    "Kelvinch-SemiBoldItalic"
);

module.exports = class Profile extends Command {
  constructor(client) {
    super(client, {
      name: "relationship",
      description: {
        content: "𝑺𝒉𝒐𝒘𝒔 𝒕𝒉𝒆 𝒓𝒆𝒍𝒂𝒕𝒊𝒐𝒏𝒔𝒉𝒊𝒑 𝒃𝒆𝒕𝒘𝒆𝒆𝒏 𝒚𝒐𝒖 𝒂𝒏𝒅 𝒚𝒐𝒖𝒓 𝒑𝒂𝒓𝒕𝒏𝒆𝒓",
        examples: ["profile @user"],
        usage: "profile <user>",
      },
      category: "relationship",
      aliases: ["ship", "rs"],
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
          name: "user",
          description: "The user to view the profile of",
          type: 6,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    let loadingMessage;
    try {
      const targetUser = this.getTargetUser(ctx, args);
      const user = await client.utils.getUser(targetUser.id);
      const syncUserInfo = await client.users.fetch(targetUser.id);
      if (user?.relationship?.partner?.userId) {
        const partner = await client.utils.getUser(
          user?.relationship?.partner?.userId
        );
        const syncPartnerInfo = await client.users.fetch(partner?.userId);
        if (!user) {
          return await this.sendUserNotFoundEmbed(ctx, color);
        }

        try {
          loadingMessage = await this.sendLoadingMessage(
            client,
            ctx,
            color,
            emoji
          );
        } catch (error) {
          await this.handleError(ctx, loadingMessage);
          console.error(error);
        }

        await new Promise((resolve) => setTimeout(resolve, 4000));

        let bannerImage;
        if (user?.profile?.gender === "male") {
          bannerImage = "https://i.imgur.com/fMtSCsL.png";
        } else if (user?.profile?.gender === "female") {
          bannerImage = "https://i.imgur.com/W0cNDDP.png";
        } else {
          bannerImage = "https://i.imgur.com/4DqQYT7.png";
        }

        const canvas = createCanvas(1280, 800);
        const context = canvas.getContext("2d");

        await this.drawPartnership(
          client,
          context,
          user,
          syncUserInfo,
          partner,
          syncPartnerInfo,
          color,
          emoji,
          bannerImage
        );

        const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
          name: `${ctx.author.username}.png`,
        });

        ctx.isInteraction
          ? await ctx.interaction.editReply({
              content: "",
              embeds: [],
              files: [attachment],
            })
          : await loadingMessage.edit({
              content: "",
              embeds: [],
              files: [attachment],
            });
      } else {
        client.utils.sendErrorMessage(
          client,
          ctx,
          `You not yet to get relationship`,
          color
        );
      }
    } catch (error) {
      await this.handleError(ctx, loadingMessage);
      console.error(error);
    }
  }

  getTargetUser(ctx, args) {
    return ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.users.first() ||
          ctx.guild.members.cache.get(args[0]) ||
          ctx.author;
  }

  async sendUserNotFoundEmbed(ctx, color) {
    const embed = ctx.client
      .embed()
      .setColor(color.main)
      .setDescription("User Not Found");
    return ctx.sendMessage({
      embeds: [embed],
    });
  }

  async sendLoadingMessage(client, ctx, color, emoji) {
    const embed = client
      .embed()
      .setColor(color.main)
      .setTitle(`****${emoji.mainLeft} 𝐑𝐄𝐋𝐀𝐓𝐈𝐎𝐍𝐒𝐇𝐈𝐏 ${emoji.mainRight}****`)
      .setDescription("****Generating...****")
      .setImage("https://i.imgur.com/ygbvn3G.gif");
    return await ctx.sendDeferMessage({
      embeds: [embed],
    });
  }

  async handleError(ctx, loadingMessage) {
    await loadingMessage?.edit({
      content:
        "An error occurred while generating your profile. Please try again later.",
      files: [],
    });
  }

  drawRoundedRectangle(
    ctx,
    x,
    y,
    width,
    height,
    radius,
    color,
    borderColor,
    borderWidth
  ) {
    // Draw the main rectangle with rounded corners
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    // Fill the rectangle with color
    ctx.fillStyle = color;
    ctx.fill();

    // Add a border stroke
    if (borderWidth > 0) {
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }
  }

  async drawPartnership(
    client,
    context,
    user,
    userInfo,
    partner,
    partnerInfo,
    color,
    emoji,
    banner
  ) {
    // Draw the background color
    context.fillStyle = '#f582ae';
    context.fillRect(0, 0, 1280, 800);

    const userAvatar = await loadImage(
      userInfo.displayAvatarURL({ format: "png", size: 256 })
    );
    const userAvatarX = 72;
    const userAvatarY = 186;
    const userAvatarSize = 300;
    if (userAvatar) {
      const borderRadius = 16;
      context.save();
      context.beginPath();
      context.moveTo(userAvatarX + borderRadius, userAvatarY);
      context.lineTo(userAvatarX + userAvatarSize - borderRadius, userAvatarY);
      context.arcTo(
        userAvatarX + userAvatarSize,
        userAvatarY,
        userAvatarX + userAvatarSize,
        userAvatarY + borderRadius,
        borderRadius
      );
      context.lineTo(
        userAvatarX + userAvatarSize,
        userAvatarY + userAvatarSize - borderRadius
      );
      context.arcTo(
        userAvatarX + userAvatarSize,
        userAvatarY + userAvatarSize,
        userAvatarX + userAvatarSize - borderRadius,
        userAvatarY + userAvatarSize,
        borderRadius
      );
      context.lineTo(userAvatarX + borderRadius, userAvatarY + userAvatarSize);
      context.arcTo(
        userAvatarX,
        userAvatarY + userAvatarSize,
        userAvatarX,
        userAvatarY + userAvatarSize - borderRadius,
        borderRadius
      );
      context.lineTo(userAvatarX, userAvatarY + borderRadius);
      context.arcTo(
        userAvatarX,
        userAvatarY,
        userAvatarX + borderRadius,
        userAvatarY,
        borderRadius
      );
      context.closePath();

      context.lineWidth = 8;
      context.stroke();
      context.clip();
      context.drawImage(
        userAvatar,
        userAvatarX,
        userAvatarY,
        userAvatarSize,
        userAvatarSize
      );
      context.restore();
    }

    // PARTNER SECTION
    const partnerAvatar = await loadImage(
      partnerInfo.displayAvatarURL({ format: "png", size: 256 })
    );
    const partnerAvatarX = 400;
    const partnerAvatarY = 186;
    const partnerAvatarSize = 300;
    if (partnerAvatar) {
      const borderRadius = 16;
      context.save();
      context.beginPath();
      context.moveTo(partnerAvatarX + borderRadius, partnerAvatarY);
      context.lineTo(
        partnerAvatarX + partnerAvatarSize - borderRadius,
        partnerAvatarY
      );
      context.arcTo(
        partnerAvatarX + partnerAvatarSize,
        partnerAvatarY,
        partnerAvatarX + partnerAvatarSize,
        partnerAvatarY + borderRadius,
        borderRadius
      );
      context.lineTo(
        partnerAvatarX + partnerAvatarSize,
        partnerAvatarY + partnerAvatarSize - borderRadius
      );
      context.arcTo(
        partnerAvatarX + partnerAvatarSize,
        partnerAvatarY + partnerAvatarSize,
        partnerAvatarX + partnerAvatarSize - borderRadius,
        partnerAvatarY + partnerAvatarSize,
        borderRadius
      );
      context.lineTo(
        partnerAvatarX + borderRadius,
        partnerAvatarY + partnerAvatarSize
      );
      context.arcTo(
        partnerAvatarX,
        partnerAvatarY + partnerAvatarSize,
        partnerAvatarX,
        partnerAvatarY + partnerAvatarSize - borderRadius,
        borderRadius
      );
      context.lineTo(partnerAvatarX, partnerAvatarY + borderRadius);
      context.arcTo(
        partnerAvatarX,
        partnerAvatarY,
        partnerAvatarX + borderRadius,
        partnerAvatarY,
        borderRadius
      );
      context.closePath();

      context.lineWidth = 8;
      context.stroke();
      context.clip();
      context.drawImage(
        partnerAvatar,
        partnerAvatarX,
        partnerAvatarY,
        partnerAvatarSize,
        partnerAvatarSize
      );
      context.restore();
    }

    // BANNER SECTION
    if (banner) {
      const bannerImage = await loadImage(banner);
      const x = 15;
      const y = 32;
      const width = 1250;
      const height = 736;
      context.drawImage(bannerImage, x, y, width, height);
    }

    // USER SECTION
    context.fillStyle = "#4C585B";
    context.font = "28px Kelvinch-SemiBoldItalic, Arial";
    context.fillText(
      client.utils.formatCapitalize(userInfo.username),
      958,
      210
    );
    context.fillText(
      client.utils.formatCapitalize(
        user.social.facebook?.name ? user.social.facebook.name : "Not Set"
      ),
      958,
      290
    );
    context.fillText(
      client.utils.formatCapitalize(
        user.social.instagram?.name ? user.social.instagram.name : "Not Set"
      ),
      958,
      370
    );

    // PARTNER SECTION
    context.fillStyle = "#4C585B";
    context.font = "28px Kelvinch-SemiBoldItalic, Arial";
    context.fillText(
      client.utils.formatCapitalize(partnerInfo.username),
      958,
      545
    );
    context.fillText(
      client.utils.formatCapitalize(
        partner.social.facebook?.name ? partner.social.facebook.name : "Not Set"
      ),
      958,
      625
    );
    context.fillText(
      client.utils.formatCapitalize(
        partner.social.instagram?.name
          ? partner.social.instagram.name
          : "Not Set"
      ),
      958,
      705
    );

    if (user?.relationship?.partner?.date) {
      const partnerDate = new Date(user?.relationship?.partner?.date);
      const currentDate = Date.now();
      const diffInDays = Math.floor(
        (currentDate - partnerDate) / (1000 * 60 * 60 * 24)
      );
      context.fillStyle = "#000000";
      context.textAlign = "center";
      context.font = "28px Kelvinch-SemiBoldItalic, Arial";
      context.fillText(`${diffInDays + 1} Days`, 380, 656);
    }
  }
};
