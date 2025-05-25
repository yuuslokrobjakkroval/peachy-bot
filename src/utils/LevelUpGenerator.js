const { createCanvas, loadImage } = require("@napi-rs/canvas");

module.exports = class LevelUpGenerator {
  constructor() {
    this.width = 360; // Reduced from 513 (~70%)
    this.height = 153; // Reduced from 218 (~70%)
    this.borderRadius = 14; // Reduced from 20
    this.borderWidth = 3; // Reduced from 4
  }

  async generateLevelUpImage(options) {
    const {
      avatarUrl,
      username,
      previousLevel,
      currentLevel,
      borderColor = "#FF69B4",
      backgroundColor = "#FFF8F0",
      backgroundImageUrl = null,
    } = options;

    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext("2d");

    try {
      // Draw main border and background
      await this.drawBorderedBackground(
        ctx,
        backgroundColor,
        borderColor,
        backgroundImageUrl
      );

      // Draw decorative elements
      this.drawMinimalDecorations(ctx, borderColor);

      // Draw avatar with enhanced styling
      const avatarSize = 56; // Reduced from 80
      const avatarX = 25; // Reduced from 35
      const avatarY = (this.height - avatarSize) / 2;

      await this.drawEnhancedAvatar(
        ctx,
        avatarUrl,
        avatarX,
        avatarY,
        avatarSize,
        borderColor
      );

      // Main content positioning
      const contentX = avatarX + avatarSize + 20; // Reduced spacing from 30
      const contentY = 32; // Reduced from 45

      // Draw enhanced header
      this.drawEnhancedHeader(ctx, contentX, contentY, borderColor);

      // Draw username with cute styling
      this.drawEnhancedUsername(
        ctx,
        username,
        contentX,
        contentY + 25, // Reduced from 35
        borderColor
      );

      // Draw level progression boxes
      this.drawEnhancedLevelProgression(
        ctx,
        previousLevel,
        currentLevel,
        contentX,
        contentY + 45, // Reduced from 64
        borderColor
      );
      return canvas.toBuffer("image/png");
    } catch (error) {
      console.error("Error generating enhanced level up image:", error);
      throw error;
    }
  }

  async drawBorderedBackground(
    ctx,
    backgroundColor,
    borderColor,
    backgroundImageUrl
  ) {
    ctx.save();
    this.roundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
    ctx.clip();

    if (backgroundImageUrl) {
      try {
        const backgroundImage = await loadImage(backgroundImageUrl);
        const scale = Math.max(
          this.width / backgroundImage.width,
          this.height / backgroundImage.height
        );
        const scaledWidth = backgroundImage.width * scale;
        const scaledHeight = backgroundImage.height * scale;
        const offsetX = (this.width - scaledWidth) / 2;
        const offsetY = (this.height - scaledHeight) / 2;

        ctx.drawImage(
          backgroundImage,
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight
        );

        const overlayGradient = ctx.createRadialGradient(
          this.width / 2,
          this.height / 2,
          0,
          this.width / 2,
          this.height / 2,
          Math.max(this.width, this.height) / 2
        );
        overlayGradient.addColorStop(0, `${backgroundColor}85`);
        overlayGradient.addColorStop(0.7, `${backgroundColor}70`);
        overlayGradient.addColorStop(1, `${backgroundColor}90`);

        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, 0, this.width, this.height);
      } catch (bgError) {
        console.warn(
          "Failed to load background image, using gradient:",
          bgError.message
        );
        this.drawGradientBackground(ctx, backgroundColor, borderColor);
      }
    } else {
      this.drawGradientBackground(ctx, backgroundColor, borderColor);
    }

    ctx.restore();
    this.drawMainBorder(ctx, borderColor);
    this.drawInnerGlow(ctx, borderColor);
  }

  drawGradientBackground(ctx, backgroundColor, accentColor) {
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) / 1.2
    );
    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(0.4, this.adjustColorBrightness(backgroundColor, -8));
    gradient.addColorStop(
      0.8,
      this.adjustColorBrightness(backgroundColor, -15)
    );
    gradient.addColorStop(1, this.adjustColorBrightness(backgroundColor, -25));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = `${accentColor}12`;
    for (let i = 0; i < this.width; i += 25) {
      // Reduced spacing from 35
      for (let j = 0; j < this.height; j += 25) {
        if ((i + j) % 50 === 0) {
          // Adjusted for smaller size
          ctx.beginPath();
          ctx.arc(
            i + Math.random() * 7, // Reduced from 10
            j + Math.random() * 7,
            1, // Reduced from 1.5
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  }

  drawMainBorder(ctx, borderColor) {
    const borderGradient = ctx.createLinearGradient(
      0,
      0,
      this.width,
      this.height
    );
    borderGradient.addColorStop(0, this.lightenColor(borderColor, 0.3));
    borderGradient.addColorStop(0.3, borderColor);
    borderGradient.addColorStop(0.7, this.darkenColor(borderColor, 0.1));
    borderGradient.addColorStop(1, this.lightenColor(borderColor, 0.2));

    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = this.borderWidth;
    this.roundRect(
      ctx,
      this.borderWidth / 2,
      this.borderWidth / 2,
      this.width - this.borderWidth,
      this.height - this.borderWidth,
      this.borderRadius - this.borderWidth / 2
    );
    ctx.stroke();

    ctx.strokeStyle = `${borderColor}40`;
    ctx.lineWidth = 0.7; // Reduced from 1
    this.roundRect(
      ctx,
      this.borderWidth + 0.7,
      this.borderWidth + 0.7,
      this.width - (this.borderWidth + 0.7) * 2,
      this.height - (this.borderWidth + 0.7) * 2,
      this.borderRadius - this.borderWidth - 0.7
    );
    ctx.stroke();
  }

  drawInnerGlow(ctx, borderColor) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";

    const glowGradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.borderRadius,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) / 2
    );
    glowGradient.addColorStop(0, "transparent");
    glowGradient.addColorStop(0.8, "transparent");
    glowGradient.addColorStop(1, `${borderColor}15`);

    ctx.fillStyle = glowGradient;
    this.roundRect(
      ctx,
      this.borderWidth,
      this.borderWidth,
      this.width - this.borderWidth * 2,
      this.height - this.borderWidth * 2,
      this.borderRadius - this.borderWidth
    );
    ctx.fill();

    ctx.restore();
  }

  drawMinimalDecorations(ctx, color) {
    const decorations = [
      { x: 315, y: 25, type: "heart", size: 6, opacity: 0.7, rotation: 15 }, // Adjusted positions
      { x: 335, y: 50, type: "star", size: 4, opacity: 0.6, rotation: -10 },
      { x: 295, y: 126, type: "circle", size: 3, opacity: 0.5 },
      {
        x: 325,
        y: 112,
        type: "diamond",
        size: 3.5,
        opacity: 0.6,
        rotation: 25,
      },
      { x: 45, y: 32, type: "star", size: 3, opacity: 0.5, rotation: -15 },
      { x: 60, y: 126, type: "heart", size: 4, opacity: 0.6, rotation: 20 },
      { x: 30, y: 85, type: "circle", size: 2, opacity: 0.4 },
      { x: 330, y: 85, type: "diamond", size: 3, opacity: 0.5, rotation: -20 },
    ];

    decorations.forEach((deco) => {
      this.drawDecorativeShape(
        ctx,
        deco.x,
        deco.y,
        deco.type,
        deco.size,
        color,
        deco.opacity,
        deco.rotation || 0
      );
    });
  }

  async drawEnhancedAvatar(ctx, avatarUrl, x, y, size, borderColor) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 10; // Reduced from 15
    ctx.shadowOffsetY = 5; // Reduced from 8

    ctx.strokeStyle = `${borderColor}30`;
    ctx.lineWidth = 6; // Reduced from 8
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2); // Adjusted radius
    ctx.stroke();

    const borderGradient = ctx.createLinearGradient(x, y, x, y + size);
    borderGradient.addColorStop(0, this.lightenColor(borderColor, 0.4));
    borderGradient.addColorStop(0.3, borderColor);
    borderGradient.addColorStop(0.7, this.darkenColor(borderColor, 0.1));
    borderGradient.addColorStop(1, this.lightenColor(borderColor, 0.2));

    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3.5; // Reduced from 5
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    try {
      const avatar = await loadImage(avatarUrl);
      ctx.drawImage(avatar, x, y, size, size);
    } catch (avatarError) {
      console.warn(
        "Failed to load avatar, drawing enhanced placeholder:",
        avatarError.message
      );
      const placeholderGradient = ctx.createRadialGradient(
        x + size / 2,
        y + size / 2,
        0,
        x + size / 2,
        y + size / 2,
        size / 2
      );
      placeholderGradient.addColorStop(0, this.lightenColor(borderColor, 0.8));
      placeholderGradient.addColorStop(
        0.6,
        this.lightenColor(borderColor, 0.6)
      );
      placeholderGradient.addColorStop(1, this.lightenColor(borderColor, 0.4));
      ctx.fillStyle = placeholderGradient;
      ctx.fillRect(x, y, size, size);

      ctx.fillStyle = borderColor;
      ctx.font = "bold 25px Arial"; // Reduced from 36px
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 1.5; // Reduced from 2
      ctx.fillText("🌸", x + size / 2, y + size / 2 + 7);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    this.drawAvatarSparkles(
      ctx,
      x + size / 2,
      y + size / 2,
      size / 2 + 7, // Reduced from 10
      borderColor
    );
  }

  drawEnhancedHeader(ctx, x, y, color) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 3; // Reduced from 4
    ctx.shadowOffsetY = 2; // Reduced from 3

    const textGradient = ctx.createLinearGradient(x, y - 14, x, y + 4); // Adjusted for smaller size
    textGradient.addColorStop(0, this.lightenColor(color, 0.2));
    textGradient.addColorStop(1, this.darkenColor(color, 0.2));

    ctx.fillStyle = textGradient;
    ctx.font = "bold 20px Arial"; // Reduced from 28px
    ctx.textAlign = "left";
    ctx.fillText("Level Up!", x, y);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  drawEnhancedUsername(ctx, username, x, y, color) {
    ctx.shadowColor = `${color}40`;
    ctx.shadowBlur = 2; // Reduced from 3

    ctx.fillStyle = this.darkenColor(color, 0.3);
    ctx.font = "600 13px Arial"; // Reduced from 18px
    ctx.textAlign = "left";

    const maxLength = 14; // Reduced from 18 for smaller space
    const displayName =
      username.length > maxLength
        ? username.substring(0, maxLength) + "..."
        : username;

    ctx.fillText(`${displayName}`, x, y);
    ctx.shadowBlur = 0;
  }

  drawEnhancedLevelProgression(ctx, previousLevel, currentLevel, x, y, color) {
    const boxWidth = 41; // Reduced from 58
    const boxHeight = 24; // Reduced from 34
    const spacing = 20; // Reduced from 28

    this.drawEnhancedLevelBox(
      ctx,
      x,
      y,
      boxWidth,
      boxHeight,
      previousLevel,
      this.lightenColor(color, 0.6),
      "#F8F9FA",
      "Before"
    );

    const arrowX = x + boxWidth + spacing;
    this.drawEnhancedArrow(ctx, arrowX, y + boxHeight / 2, color);

    const currentX = arrowX + 27 + spacing; // Adjusted from 38
    this.drawEnhancedLevelBox(
      ctx,
      currentX,
      y,
      boxWidth,
      boxHeight,
      currentLevel,
      color,
      this.lightenColor(color, 0.85),
      "Next"
    );
  }

  drawEnhancedLevelBox(
    ctx,
    x,
    y,
    width,
    height,
    level,
    borderColor,
    fillColor,
    label
  ) {
    const radius = 12; // Reduced from 18

    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 7; // Reduced from 10
    ctx.shadowOffsetY = 3; // Reduced from 5

    const boxGradient = ctx.createLinearGradient(x, y, x, y + height);
    boxGradient.addColorStop(0, this.lightenColor(fillColor, 0.1));
    boxGradient.addColorStop(0.5, fillColor);
    boxGradient.addColorStop(1, this.adjustColorBrightness(fillColor, -8));

    ctx.fillStyle = boxGradient;
    this.roundRect(ctx, x, y, width, height, radius);
    ctx.fill();

    const borderGradient = ctx.createLinearGradient(
      x,
      y,
      x + width,
      y + height
    );
    borderGradient.addColorStop(0, this.lightenColor(borderColor, 0.2));
    borderGradient.addColorStop(1, borderColor);

    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2; // Reduced from 3
    this.roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = this.darkenColor(borderColor, 0.4);
    ctx.font = "bold 12px Arial"; // Reduced from 17px
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 0.7; // Reduced from 1
    ctx.fillText(level.toString(), x + width / 2, y + height / 2 + 4);
    ctx.shadowBlur = 0;

    ctx.fillStyle = this.darkenColor(borderColor, 0.2);
    ctx.font = "600 9px Arial"; // Reduced from 12px
    ctx.fillText(label, x + width / 2, y + height + 12); // Adjusted spacing
  }

  drawEnhancedArrow(ctx, x, y, color) {
    ctx.shadowColor = `${color}60`;
    ctx.shadowBlur = 6; // Reduced from 8

    const arrowGradient = ctx.createLinearGradient(x, y - 6, x + 20, y + 6); // Adjusted size
    arrowGradient.addColorStop(0, this.lightenColor(color, 0.3));
    arrowGradient.addColorStop(0.5, color);
    arrowGradient.addColorStop(1, this.darkenColor(color, 0.1));

    ctx.fillStyle = arrowGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - 6); // Reduced from 8
    ctx.lineTo(x + 15, y); // Reduced from 22
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 5, y); // Reduced from 7
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = this.lightenColor(color, 0.7);
    ctx.beginPath();
    ctx.arc(x + 12, y - 1.5, 1.5, 0, Math.PI * 2); // Adjusted size and position
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + 11, y + 0.7, 0.7, 0, Math.PI * 2); // Adjusted size and position
    ctx.fill();
  }

  drawEnhancedProgressBar(ctx, x, y, width, color) {
    const height = 11; // Reduced from 16
    const radius = height / 2;

    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 3; // Reduced from 4
    ctx.shadowOffsetY = 1.5; // Reduced from 2

    ctx.fillStyle = `${color}18`;
    this.roundRect(ctx, x, y, width, height, radius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = `${color}25`;
    ctx.lineWidth = 0.7; // Reduced from 1
    this.roundRect(
      ctx,
      x + 0.7,
      y + 0.7,
      width - 1.4,
      height - 1.4,
      radius - 0.7
    );
    ctx.stroke();

    const progress = 0.75;
    const progressWidth = width * progress;

    const progressGradient = ctx.createLinearGradient(
      x,
      y,
      x + progressWidth,
      y
    );
    progressGradient.addColorStop(0, this.lightenColor(color, 0.2));
    progressGradient.addColorStop(0.3, color);
    progressGradient.addColorStop(0.7, this.darkenColor(color, 0.1));
    progressGradient.addColorStop(1, this.lightenColor(color, 0.3));

    ctx.fillStyle = progressGradient;
    this.roundRect(ctx, x, y, progressWidth, height, radius);
    ctx.fill();
    ctx.shadowColor = `${color}50`;
    ctx.shadowBlur = 4; // Reduced from 6
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawDecorativeShape(ctx, x, y, type, size, color, opacity, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate((rotation * Math.PI) / 180);

    ctx.fillStyle = `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.shadowColor = `${color}40`;
    ctx.shadowBlur = 2; // Reduced from 3

    switch (type) {
      case "heart":
        this.drawHeart(ctx, 0, 0, size);
        break;
      case "star":
        this.drawStar(ctx, 0, 0, size);
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "diamond":
        this.drawDiamond(ctx, 0, 0, size);
        break;
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 3);
    ctx.bezierCurveTo(
      x - size / 2,
      y - size / 3,
      x - size,
      y + size / 3,
      x,
      y + size
    );
    ctx.bezierCurveTo(
      x + size,
      y + size / 3,
      x + size / 2,
      y - size / 3,
      x,
      y + size / 3
    );
    ctx.fill();
  }

  drawStar(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(0, -size);
      ctx.translate(0, -size);
      ctx.rotate(Math.PI / 5);
      ctx.lineTo(0, -size * 0.5);
      ctx.translate(0, -size * 0.5);
      ctx.rotate(Math.PI / 5);
    }
    ctx.fill();
  }

  drawDiamond(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
  }

  drawAvatarSparkles(ctx, centerX, centerY, radius, color) {
    const sparkles = [
      { angle: 0, distance: radius + 4, size: 1.5 }, // Reduced sizes
      { angle: 72, distance: radius + 5, size: 1 },
      { angle: 144, distance: radius + 4.5, size: 1.8 },
      { angle: 216, distance: radius + 6, size: 1.2 },
      { angle: 288, distance: radius + 4, size: 1.5 },
    ];

    sparkles.forEach((sparkle) => {
      const x =
        centerX + Math.cos((sparkle.angle * Math.PI) / 180) * sparkle.distance;
      const y =
        centerY + Math.sin((sparkle.angle * Math.PI) / 180) * sparkle.distance;

      ctx.fillStyle = `${color}70`;
      ctx.shadowColor = `${color}50`;
      ctx.shadowBlur = 3; // Reduced from 4
      ctx.beginPath();
      ctx.arc(x, y, sparkle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  roundRect(ctx, x, y, width, height, radius) {
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

  lightenColor(color, amount) {
    const num = Number.parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) * 0x100 : 255) +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  darkenColor(color, amount) {
    const num = Number.parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
        (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
        (B > 255 ? 255 : B < 0 ? 0 : B)
      )
        .toString(16)
        .slice(1)
    );
  }

  adjustColorBrightness(color, amount) {
    const num = Number.parseInt(color.replace("#", ""), 16);
    const R = Math.max(0, Math.min(255, (num >> 16) + amount));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return "#" + ((R << 16) | (G << 8) | B).toString(16).padStart(6, "0");
  }
};
