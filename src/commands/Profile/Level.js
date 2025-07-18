const { Command } = require("../../structures");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const ShopItems = require("../../assets/inventory/ShopItems");
const inventory = ShopItems.flatMap((shop) => shop.inventory);
const Wallpapers = inventory.filter((value) => value.type === "wallpaper");
const Colors = inventory.filter((value) => value.type === "color");

GlobalFonts.registerFromPath("./public/fonts/Ghibli.otf", "Ghibli");
GlobalFonts.registerFromPath("./public/fonts/Ghibli-Bold.otf", "Ghibli-Bold");

module.exports = class Profile extends Command {
  constructor(client) {
    super(client, {
      name: "level",
      description: {
        content: "Displays your level and XP progress.",
        examples: ["level"],
        usage: "level",
      },
      category: "profile",
      aliases: ["lvl", "xp", "id"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks", "AttachFiles"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  run(client, ctx, args, color, emoji, language) {
    let loadingMessage;
    try {
      const targetUser = this.getTargetUser(ctx, args);
      client.utils.getUser(targetUser.id).then(async (user) => {
        if (!user) {
          return this.sendUserNotFoundEmbed(ctx, color);
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

        const equippedWallpaper = user.equip.find((equippedItem) =>
          equippedItem.id.startsWith("w")
        );
        const equippedColor = user.equip.find((equippedItem) =>
          equippedItem.id.startsWith("p")
        );

        let bannerImage;
        if (equippedWallpaper) {
          bannerImage = Wallpapers.find(
            (wallpaperItem) => wallpaperItem.id === equippedWallpaper.id
          )?.image;
        } else {
          bannerImage = "https://i.imgur.com/8rZFeWI.jpg";
        }

        let backgroundColor;
        if (equippedColor) {
          backgroundColor = Colors.find(
            (colorItem) => colorItem.id === equippedColor.id
          )?.color;
        }

        const canvas = createCanvas(1280, 720);
        const context = canvas.getContext("2d");

        await this.drawStreamlinedLevel(
          client,
          context,
          targetUser,
          user,
          backgroundColor,
          bannerImage
        );

        const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
          name: `${targetUser.username}-level.png`,
        });

        loadingMessage.edit({
          content: "",
          embeds: [],
          files: [attachment],
        });
      });
    } catch (error) {
      console.error("Error in level command:", error);
      if (loadingMessage) {
        this.handleError(ctx, loadingMessage);
      }
    }
  }

  getTargetUser(ctx, args) {
    return ctx.isInteraction
      ? ctx.options.getUser("user")
      : ctx.message.mentions.users.first() ||
          ctx.guild.members.cache.get(args[0]) ||
          ctx.author;
  }

  async sendUserNotFoundEmbed(ctx, color) {
    const embed = ctx.client
      .embed()
      .setColor(color.main)
      .setDescription("User Not Found");
    return await ctx.sendMessage({
      embeds: [embed],
    });
  }

  async sendLoadingMessage(client, ctx, color, emoji) {
    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `# ${emoji.mainLeft} LEVEL CARD ${emoji.mainRight}
    
Creating a stunning premium level card just for you! ✨
Please wait a moment while we craft your personalized stats display...`
      )
      .setImage("https://i.imgur.com/UCsKa6Z.gif");
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

  drawRoundedRectangle(ctx, x, y, width, height, radius, fillStyle) {
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
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  splitText(context, text, maxWidth) {
    const textConverted = text.toString();
    const words = textConverted.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = context.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  getConsumedItems(client, userInfo) {
    if (!userInfo.consumedItems || userInfo.consumedItems.length === 0) {
      return "None";
    }

    const categorizedItems = {};

    userInfo.consumedItems.forEach((item) => {
      const itemType = item.type;
      if (!categorizedItems[itemType]) {
        categorizedItems[itemType] = [];
      }
      categorizedItems[itemType].push(`${item.name} x${item.quantity}`);
    });

    let output = "";
    for (const [type, items] of Object.entries(categorizedItems)) {
      output += `${client.utils.formatCapitalize(type)}\n${items.join(
        ", "
      )}\n\n`;
    }

    return output.trim();
  }

  drawSparkle(ctx, x, y, size, color) {
    ctx.save();

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
      ctx.lineWidth = size / 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, y, size / 5, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.restore();
  }

  drawStar(ctx, x, y, size, color) {
    ctx.save();
    ctx.beginPath();

    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const outerX = x + size * Math.cos(angle);
      const outerY = y + size * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(outerX, outerY);
      } else {
        ctx.lineTo(outerX, outerY);
      }

      const innerAngle = angle + Math.PI / 5;
      const innerX = x + (size / 2) * Math.cos(innerAngle);
      const innerY = y + (size / 2) * Math.sin(innerAngle);

      ctx.lineTo(innerX, innerY);
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x - size / 5, y - size / 5, size / 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();

    ctx.restore();
  }

  drawHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.beginPath();

    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x + size / 4, y);
    ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
    ctx.quadraticCurveTo(x + size / 2, y, x + (size * 3) / 4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
    ctx.quadraticCurveTo(
      x + size,
      y + size / 2,
      x + size / 2,
      y + (size * 3) / 4
    );
    ctx.lineTo(x, y + size / 4);

    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + size / 4, y + size / 4, size / 10, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();

    ctx.restore();
  }

  roundedRect(ctx, x, y, width, height, radius) {
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
  }

  adjustColor(hex, amount) {
    if (typeof hex === "number") {
      hex = `#${hex.toString(16).padStart(6, "0")}`;
    }

    hex = hex.replace("#", "");

    let r = Number.parseInt(hex.substring(0, 2), 16);
    let g = Number.parseInt(hex.substring(2, 4), 16);
    let b = Number.parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  drawGlassEffect(ctx, x, y, width, height, radius, color, alpha = 0.3) {
    ctx.save();
    this.roundedRect(ctx, x, y, width, height, radius);
    ctx.clip();

    const glassGradient = ctx.createLinearGradient(x, y, x, y + height);
    glassGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha + 0.1})`);
    glassGradient.addColorStop(0.2, `rgba(255, 255, 255, ${alpha - 0.05})`);
    glassGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha - 0.1})`);
    glassGradient.addColorStop(1, `rgba(255, 255, 255, ${alpha - 0.15})`);

    ctx.fillStyle = glassGradient;
    ctx.fillRect(x, y, width, height);

    const shineGradient = ctx.createLinearGradient(x, y, x, y + height / 3);
    shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = shineGradient;
    ctx.fillRect(x, y, width, height / 3);

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.2})`;
    ctx.lineWidth = 2;
    this.roundedRect(ctx, x, y, width, height, radius);
    ctx.stroke();

    ctx.restore();
  }

  createPremiumGradient(ctx, x, y, width, height, baseColor, angle = 0) {
    const radians = (angle * Math.PI) / 180;
    const xDiff = Math.cos(radians) * width;
    const yDiff = Math.sin(radians) * height;

    const gradient = ctx.createLinearGradient(x, y, x + xDiff, y + yDiff);

    if (typeof baseColor === "number") {
      baseColor = `#${baseColor.toString(16).padStart(6, "0")}`;
    }

    const lighterColor = this.adjustColor(baseColor, 40);
    const darkerColor = this.adjustColor(baseColor, -40);

    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, darkerColor);

    return gradient;
  }

  drawPremiumBorder(
    ctx,
    x,
    y,
    width,
    height,
    radius,
    thickness = 4,
    baseColor
  ) {
    ctx.save();

    const borderGradient = this.createPremiumGradient(
      ctx,
      x,
      y,
      width,
      height,
      baseColor,
      45
    );

    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = thickness;
    this.roundedRect(ctx, x, y, width, height, radius);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    this.roundedRect(
      ctx,
      x + thickness / 2,
      y + thickness / 2,
      width - thickness,
      height - thickness,
      radius - thickness / 2
    );
    ctx.stroke();

    ctx.restore();
  }

  drawBackgroundPattern(ctx, width, height, baseColor, patternType = "dots") {
    ctx.save();

    if (patternType === "dots") {
      ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
      const spacing = 30;

      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const offset = y % (spacing * 2) === 0 ? spacing / 2 : 0;

          ctx.beginPath();
          ctx.arc(x + offset, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (patternType === "lines") {
      ctx.strokeStyle = `rgba(255, 255, 255, 0.07)`;
      ctx.lineWidth = 1;

      const spacing = 40;

      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      for (let x = 0; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawPremiumBadge(ctx, x, y, size, level, baseColor, label = "LEVEL") {
    try {
      ctx.save();

      const primaryColor =
        typeof baseColor === "string"
          ? baseColor
          : `#${baseColor.toString(16).padStart(6, "0")}`;

      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);

      const badgeGradient = ctx.createRadialGradient(
        x + size / 3,
        y + size / 3,
        0,
        x + size / 2,
        y + size / 2,
        size / 2
      );

      badgeGradient.addColorStop(0, this.adjustColor(primaryColor, 70));
      badgeGradient.addColorStop(0.7, primaryColor);
      badgeGradient.addColorStop(1, this.adjustColor(primaryColor, -50));

      ctx.fillStyle = badgeGradient;
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 - 3, 0, Math.PI * 2);
      ctx.lineWidth = 3;

      const ringGradient = ctx.createLinearGradient(x, y, x + size, y + size);

      ringGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      ringGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      ringGradient.addColorStop(1, "rgba(255, 255, 255, 0.8)");

      ctx.strokeStyle = ringGradient;
      ctx.stroke();

      ctx.font = `bold 36px 'Ghibli-Bold', 'Kelvinch-Bold', Arial`;

      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(level.toString(), x + size / 2 + 2, y + size / 2 + 2);

      ctx.fillStyle = "white";
      ctx.fillText(level.toString(), x + size / 2, y + size / 2);

      ctx.beginPath();
      ctx.arc(x + size / 3, y + size / 3, size / 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fill();

      ctx.font = `bold 20px 'Ghibli', 'Kelvinch-Roman', Arial`;
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(label, x + size / 2, y + size + 15);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.restore();
    } catch (error) {
      console.error("Error in drawPremiumBadge:", error);
    }
  }

  async drawPremiumAvatarFrame(ctx, user, x, y, size, baseColor) {
    try {
      ctx.save();

      ctx.shadowColor =
        typeof baseColor === "string"
          ? baseColor
          : `#${baseColor.toString(16).padStart(6, "0")}`;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);

      const borderGradient = ctx.createLinearGradient(x, y, x + size, y + size);

      const colorStr =
        typeof baseColor === "string"
          ? baseColor
          : `#${baseColor.toString(16).padStart(6, "0")}`;

      borderGradient.addColorStop(0, this.adjustColor(colorStr, 70));
      borderGradient.addColorStop(0.5, colorStr);
      borderGradient.addColorStop(1, this.adjustColor(colorStr, -30));

      ctx.fillStyle = borderGradient;
      ctx.fill();

      const avatar = await loadImage(
        user.displayAvatarURL({
          extension: "png",
          size: 256,
        })
      );

      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(avatar, x, y, size, size);

      ctx.restore();

      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const shineGradient = ctx.createLinearGradient(
        x,
        y,
        x + size / 3,
        y + size / 3
      );

      shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = shineGradient;
      ctx.fillRect(x, y, size / 2, size / 2);

      ctx.restore();
    } catch (error) {
      console.error("Error drawing premium avatar frame:", error);
    }
  }

  drawEnhancedProgressBar(ctx, x, y, width, height, progress, baseColor) {
    try {
      ctx.save();

      const colorStr =
        typeof baseColor === "string"
          ? baseColor
          : `#${baseColor.toString(16).padStart(6, "0")}`;

      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;

      const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
      bgGradient.addColorStop(0, "rgba(40, 40, 40, 0.8)");
      bgGradient.addColorStop(0.5, "rgba(30, 30, 30, 0.8)");
      bgGradient.addColorStop(1, "rgba(20, 20, 20, 0.8)");

      this.drawRoundedRectangle(
        ctx,
        x,
        y,
        width,
        height,
        height / 2,
        bgGradient
      );

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      this.roundedRect(
        ctx,
        x + 2,
        y + 2,
        width - 4,
        height - 4,
        height / 2 - 2
      );
      ctx.stroke();

      if (progress > 0) {
        const fillWidth = Math.max(height, progress * width);

        const fillGradient = ctx.createLinearGradient(x, y, x, y + height);
        fillGradient.addColorStop(0, this.adjustColor(colorStr, 50));
        fillGradient.addColorStop(0.5, colorStr);
        fillGradient.addColorStop(1, this.adjustColor(colorStr, -30));

        ctx.beginPath();
        if (progress >= 1) {
          this.roundedRect(ctx, x, y, width, height, height / 2);
        } else {
          const radius = height / 2;
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + fillWidth, y);

          if (fillWidth >= width - radius) {
            ctx.lineTo(x + fillWidth - radius, y);
            ctx.quadraticCurveTo(x + fillWidth, y, x + fillWidth, y + radius);
            ctx.lineTo(x + fillWidth, y + height - radius);
            ctx.quadraticCurveTo(
              x + fillWidth,
              y + height,
              x + fillWidth - radius,
              y + height
            );
          } else {
            ctx.lineTo(x + fillWidth, y + height);
          }

          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
        }

        ctx.closePath();
        ctx.fillStyle = fillGradient;
        ctx.fill();

        const shineGradient = ctx.createLinearGradient(x, y, x, y + height / 2);
        shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        if (progress >= 1) {
          this.roundedRect(ctx, x, y, width, height / 2, height / 2);
        } else {
          const radius = height / 2;
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + fillWidth, y);
          ctx.lineTo(x + fillWidth, y + height / 2);
          ctx.lineTo(x + radius, y + height / 2);
          ctx.quadraticCurveTo(x, y + height / 2, x, y + height / 2 - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
        }

        ctx.closePath();
        ctx.fillStyle = shineGradient;
        ctx.fill();

        this.drawProgressMarkers(ctx, x, y, width, height, progress);

        if (progress < 1) {
          const glowGradient = ctx.createRadialGradient(
            x + fillWidth,
            y + height / 2,
            0,
            x + fillWidth,
            y + height / 2,
            height / 2
          );

          glowGradient.addColorStop(0, this.adjustColor(colorStr, 30));
          glowGradient.addColorStop(0.5, this.adjustColor(colorStr, 0));
          glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.beginPath();
          ctx.arc(x + fillWidth, y + height / 2, height / 2, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }
      }

      ctx.restore();
    } catch (error) {
      console.error("Error in drawEnhancedProgressBar:", error);
    }
  }

  drawProgressMarkers(ctx, x, y, width, height, currentProgress) {
    const milestones = [0.25, 0.5, 0.75, 1];

    milestones.forEach((milestone) => {
      const markerX = x + width * milestone;

      if (milestone <= currentProgress) {
        ctx.beginPath();
        ctx.arc(markerX, y + height / 2, height / 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(markerX, y + height / 2, height / 4, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(
          markerX,
          y + height / 2,
          0,
          markerX,
          y + height / 2,
          height / 4
        );
        glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
        glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glowGradient;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(markerX, y + height / 2, height / 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    });

    for (let i = 1; i < 10; i++) {
      if (i % 2.5 !== 0) {
        const tickX = x + width * (i / 10);
        const tickHeight = height / 4;

        ctx.beginPath();
        ctx.moveTo(tickX, y + (height - tickHeight) / 2);
        ctx.lineTo(tickX, y + (height + tickHeight) / 2);
        ctx.lineWidth = 1;

        if (i / 10 <= currentProgress) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        }

        ctx.stroke();
      }
    }
  }

  drawPremiumDecorations(ctx, width, height, baseColor) {
    try {
      ctx.save();

      for (let i = 0; i < 15; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 3 + Math.random() * 7;

        if (
          Math.abs(x - width / 2) > width / 4 ||
          Math.abs(y - height / 2) > height / 4
        ) {
          this.drawSparkle(ctx, x, y, size, "rgba(255, 255, 255, 0.7)");
        }
      }

      for (let i = 0; i < 5; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 5 + Math.random() * 10;

        if (
          (x < width / 4 || x > (width * 3) / 4) &&
          (y < height / 4 || y > (height * 3) / 4)
        ) {
          const colorStr =
            typeof baseColor === "string"
              ? baseColor
              : `#${baseColor.toString(16).padStart(6, "0")}`;
          const starColor = this.adjustColor(colorStr, 50);
          this.drawStar(
            ctx,
            x,
            y,
            size,
            `rgba(${Number.parseInt(
              starColor.slice(1, 3),
              16
            )}, ${Number.parseInt(
              starColor.slice(3, 5),
              16
            )}, ${Number.parseInt(starColor.slice(5, 7), 16)}, 0.5)`
          );
        }
      }

      ctx.restore();
    } catch (error) {
      console.error("Error in drawPremiumDecorations:", error);
    }
  }

  async drawStreamlinedLevel(
    client,
    context,
    targetUser,
    userInfo,
    backgroundColor,
    banner
  ) {
    try {
      const width = 1280;
      const height = 720;

      // Get base color (using pinkish tone from image)
      const baseColor = backgroundColor
        ? typeof backgroundColor.primary === "string"
          ? backgroundColor.primary
          : `#${backgroundColor.primary.toString(16).padStart(6, "0")}`
        : "#FF9999"; // Soft pink similar to the image's aura

      // Draw full-size banner/wallpaper as background
      if (banner) {
        try {
          const bannerImage = await loadImage(banner);

          context.filter = "blur(5px)";
          context.drawImage(bannerImage, -50, -50, width + 100, height + 100);
          context.filter = "none";

          const overlayGradient = context.createLinearGradient(0, 0, 0, height);
          overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
          overlayGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
          overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");

          context.fillStyle = overlayGradient;
          context.fillRect(0, 0, width, height);
        } catch (error) {
          console.error("Error loading banner:", error);

          const bgGradient = context.createLinearGradient(0, 0, width, height);
          bgGradient.addColorStop(0, this.adjustColor(baseColor, -70));
          bgGradient.addColorStop(1, "black");

          context.fillStyle = bgGradient;
          context.fillRect(0, 0, width, height);
        }
      } else {
        const bgGradient = context.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, this.adjustColor(baseColor, -70));
        bgGradient.addColorStop(1, "black");

        context.fillStyle = bgGradient;
        context.fillRect(0, 0, width, height);
      }

      // Add background pattern
      this.drawBackgroundPattern(context, width, height, baseColor, "dots");

      // Calculate card dimensions
      const cardWidth = 800;
      const cardHeight = 500;
      const cardX = (width - cardWidth) / 2;
      const cardY = (height - cardHeight) / 2;

      // Draw glowing aura
      context.shadowColor = this.adjustColor(baseColor, 20); // Lighter pink for glow
      context.shadowBlur = 30;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      this.drawRoundedRectangle(
        context,
        cardX - 10,
        cardY - 10,
        cardWidth + 20,
        cardHeight + 20,
        30,
        "rgba(255, 255, 255, 0.1)"
      );
      context.shadowBlur = 0;

      // Draw main card with glass effect
      this.drawGlassEffect(
        context,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        30,
        "rgba(255, 255, 255, 0.1)",
        0.15
      );

      // Draw premium border around card
      this.drawPremiumBorder(
        context,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        30,
        4,
        baseColor
      );

      // Draw level header
      const headerHeight = 70;
      context.font = "bold 48px 'Ghibli-Bold', 'Kelvinch-Bold', Arial";
      context.fillStyle = "white";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        `LEVEL ${userInfo.profile?.level || 1}`,
        cardX + cardWidth / 2,
        cardY + headerHeight / 2
      );

      // Draw avatar
      const avatarSize = 160;
      const avatarX = cardX + (cardWidth - avatarSize) / 2;
      const avatarY = cardY + headerHeight + 30;
      await this.drawPremiumAvatarFrame(
        context,
        targetUser,
        avatarX,
        avatarY,
        avatarSize,
        baseColor
      );

      // Draw username and percentage
      context.font = "bold 30px 'Ghibli', 'Kelvinch-Roman', Arial";
      context.fillStyle = "white";
      context.textAlign = "center";
      const username =
        userInfo.profile && userInfo.profile.name
          ? client.utils.formatCapitalize(userInfo.profile.name)
          : targetUser.username;
      context.fillText(
        username,
        cardX + cardWidth / 2,
        avatarY + avatarSize + 15
      );

      const currentXP = userInfo.profile?.xp || 0;
      const maxXP = userInfo.profile?.levelXp || 1000;
      const progressPercentage = Math.min(currentXP / maxXP, 1);
      context.font = "bold 32px 'Ghibli-Bold', 'Kelvinch-Bold', Arial";
      context.fillText(
        `${Math.floor(progressPercentage * 100)}%`,
        cardX + cardWidth / 2,
        avatarY + avatarSize + 55
      );

      // Draw progress bars
      const progressBarWidth = 450;
      const progressBarHeight = 35;
      const progressBarX = cardX + (cardWidth - progressBarWidth) / 2;
      const progressBarY = avatarY + avatarSize + 100;

      const xpProgress = Math.min(currentXP / maxXP, 1);
      this.drawEnhancedProgressBar(
        context,
        progressBarX,
        progressBarY,
        progressBarWidth,
        progressBarHeight,
        xpProgress,
        baseColor
      );

      const currentVoiceXP = userInfo.profile?.voiceXP || 0;
      const maxVoiceXP = userInfo.profile?.voiceLevelXp || 100;
      const voiceProgress = Math.min(currentVoiceXP / maxVoiceXP, 1);
      this.drawEnhancedProgressBar(
        context,
        progressBarX,
        progressBarY + progressBarHeight + 30,
        progressBarWidth,
        progressBarHeight,
        voiceProgress,
        this.adjustColor(baseColor, -20)
      );

      // Draw XP and Voice XP text
      context.font = "bold 24px 'Ghibli', 'Kelvinch-Roman', Arial";
      context.fillStyle = "white";
      context.textAlign = "center";
      context.fillText(
        `${client.utils.formatNumber(currentXP)} / ${client.utils.formatNumber(
          maxXP
        )} XP`,
        cardX + cardWidth / 2,
        progressBarY + progressBarHeight + 15
      );
      context.fillText(
        `${client.utils.formatNumber(
          currentVoiceXP
        )} / ${client.utils.formatNumber(maxVoiceXP)} Voice XP`,
        cardX + cardWidth / 2,
        progressBarY + progressBarHeight + 45 + progressBarHeight
      );

      // Draw level badges
      const badgeSize = 90;
      const badgeX = cardX + cardWidth - badgeSize - 30;
      const badgeY = cardY + headerHeight + 40;
      this.drawPremiumBadge(
        context,
        badgeX,
        badgeY,
        badgeSize,
        userInfo.profile?.level || 1,
        baseColor
      );
      this.drawPremiumBadge(
        context,
        badgeX,
        badgeY + badgeSize + 30,
        badgeSize,
        userInfo.profile?.voiceLevel || 1,
        this.adjustColor(baseColor, -20),
        "VOICE LEVEL"
      );

      // Add signature
      context.font = "18px 'Ghibli', 'Kelvinch-Roman', Arial";
      context.fillStyle = "rgba(255, 255, 255, 0.5)";
      context.textAlign = "right";
      context.fillText(
        "Peachy Bot",
        cardX + cardWidth - 20,
        cardY + cardHeight - 20
      );

      return context.canvas;
    } catch (error) {
      console.error("Error in drawStreamlinedLevel:", error);
      throw error;
    }
  }
};
