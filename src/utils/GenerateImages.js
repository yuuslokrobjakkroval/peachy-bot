const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

GlobalFonts.registerFromPath("./pulice/fonts/Ghibli.otf", "Ghibli");
GlobalFonts.registerFromPath("./pulice/fonts/Ghibli-Bold.otf", "Ghibli-Bold");

async function generateTreeCanvas({ height }) {
  const canvasWidth = 512;
  const canvasHeight = 768;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  const background = await loadImage("https://i.imgur.com/myURtVX.png");
  ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
  return await canvas.encode("png");
}

async function generatePartnerCanvas(client, user, targetUser) {
  const userInfo = await client.users.fetch(targetUser.id);
  if (user?.relationship?.partner?.userId) {
    const partner = await client.utils.getUser(
      user?.relationship?.partner?.userId
    );
    const partnerInfo = await client.users.fetch(partner?.userId);
    if (!user) {
      return await this.sendUserNotFoundEmbed(ctx, color);
    }
    let banner;
    if (user?.profile?.gender === "male") {
      banner = "https://i.imgur.com/fMtSCsL.png";
    } else if (user?.profile?.gender === "female") {
      banner = "https://i.imgur.com/W0cNDDP.png";
    } else {
      banner = "https://i.imgur.com/4DqQYT7.png";
    }

    const canvas = createCanvas(1280, 800);
    const context = canvas.getContext("2d");
    // Draw the background color
    context.fillStyle = "#f582ae";
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
    context.font = "28px Ghibli, Arial";
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
    context.font = "28px Ghibli, Arial";
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
      context.font = "28px Ghibli, Arial";
      context.fillText(`${diffInDays + 1} Days`, 380, 656);
    }
    return await canvas.encode("png");
  }
}

module.exports = { generateTreeCanvas, generatePartnerCanvas };
