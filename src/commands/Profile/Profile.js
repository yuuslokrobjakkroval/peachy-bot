const { Command } = require("../../structures");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const moment = require("moment");
const ShopItems = require("../../assets/inventory/ShopItems");
const inventory = ShopItems.flatMap((shop) => shop.inventory);
const Decoration = inventory.filter((value) => value.type === "decoration");
const Wallpapers = inventory.filter((value) => value.type === "wallpaper");
const Colors = inventory.filter((value) => value.type === "color");

GlobalFonts.registerFromPath("./public/fonts/Ghibli.otf", "Kelvinch-Roman");
GlobalFonts.registerFromPath("./public/fonts/Ghibli-Bold.otf", "Kelvinch-Bold");

const defaultDecoration = "https://i.imgur.com/wBcmTih.jpg";
const defaultBanner = "https://i.imgur.com/8rZFeWI.jpg";
const chinaNewYearBanner = "https://i.imgur.com/RmfP9ie.png";
module.exports = class Profile extends Command {
	constructor(client) {
		super(client, {
			name: "profile",
			description: {
				content: "Show the profile information of a user.",
				examples: ["profile @user"],
				usage: "profile <user>",
			},
			category: "social",
			aliases: ["profile", "pf"],
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
			const user = this.getTargetUser(ctx, args);
			const userInfo = await client.utils.getUser(user.id);

			if (!user) {
				return await this.sendUserNotFoundEmbed(ctx, color);
			}

			try {
				loadingMessage = await this.sendLoadingMessage(
					client,
					ctx,
					color,
					emoji,
				);
			} catch (error) {
				await this.handleError(ctx, loadingMessage);
				console.error(error);
			}

			// await new Promise((resolve) => setTimeout(resolve, 4000));

			const equippedDecoration = userInfo.equip.find((equippedItem) =>
				equippedItem.id.startsWith("d"),
			);
			const equippedWallpaper = userInfo.equip.find((equippedItem) =>
				equippedItem.id.startsWith("w"),
			);
			const equippedColor = userInfo.equip.find((equippedItem) =>
				equippedItem.id.startsWith("p"),
			);

			const chinaNewYear = userInfo.equip.find(
				(equippedItem) => equippedItem.id === "w168",
			);

			let decorationImage;
			if (equippedDecoration) {
				decorationImage = Decoration.find(
					(decorationItem) => decorationItem.id === equippedDecoration.id,
				)?.image;
			} else {
				decorationImage = defaultDecoration;
			}

			let bannerImage;
			if (chinaNewYear) {
				bannerImage = chinaNewYearBanner;
			} else {
				if (equippedWallpaper) {
					bannerImage = Wallpapers.find(
						(wallpaperItem) => wallpaperItem.id === equippedWallpaper.id,
					)?.image;
				} else {
					bannerImage = defaultBanner;
				}
			}

			let backgroundColor;
			if (equippedColor) {
				const foundColor = Colors.find(
					(colorItem) => colorItem.id === equippedColor.id,
				);
				backgroundColor = foundColor?.color;
			}

			let canvas = createCanvas(1280, 720);
			let context = canvas.getContext("2d");

			if (chinaNewYear) {
				let partner;
				let partnerInfo;

				if (userInfo?.relationship?.partner?.userId) {
					partnerInfo = await client.utils.getUser(
						userInfo?.relationship?.partner?.userId,
					);
					partner = await client.users.fetch(partnerInfo?.userId);
				}
				canvas = createCanvas(1920, 1080);
				context = canvas.getContext("2d");
				await this.drawChinaNewYearProfile(
					client,
					context,
					user,
					userInfo,
					partner,
					partnerInfo,
					bannerImage,
				);
			} else {
				await this.drawProfile(
					client,
					context,
					user,
					userInfo,
					color,
					backgroundColor,
					emoji,
					bannerImage,
					decorationImage,
				);
			}

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
			.setDescription(
				`# **${emoji.mainLeft} PROFILE ${emoji.mainRight}**\n\n**Generating your profile...**`,
			)
			.setImage("https://i.imgur.com/0BrEHuc.gif");
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

	drawRoundedRectangle(ctx, x, y, width, height, radius, color) {
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
		ctx.fillStyle = color;
		ctx.fill();
	}

	// Function to split text into multiple lines
	splitText(context, text, maxWidth) {
		const words = text.split(" ");
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

	// Check if a color scheme is a gradient
	isGradientColor(colorScheme) {
		return colorScheme && colorScheme.isGradient === true;
	}

	// Enhanced function to draw rounded rectangle with gradient support
	// Enhanced function to draw rounded rectangle with LevelUpGenerator style
	drawRoundedRectangleWithGradient(
		ctx,
		x,
		y,
		width,
		height,
		radius,
		colorScheme,
		intensity = 1,
	) {
		ctx.save();

		// Add LevelUpGenerator style shadow
		ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
		ctx.shadowBlur = 10;
		ctx.shadowOffsetY = 5;

		// Create LevelUpGenerator style background gradient
		const backgroundGradient = ctx.createLinearGradient(x, y, x, y + height);
		if (this.isGradientColor(colorScheme)) {
			backgroundGradient.addColorStop(
				0,
				this.lightenColor(colorScheme.primary, 0.1),
			);
			backgroundGradient.addColorStop(0.5, colorScheme.primary);
			backgroundGradient.addColorStop(
				1,
				this.adjustColorBrightness(colorScheme.primary, -8),
			);
		} else {
			const baseColor = colorScheme ? colorScheme.primary : "#FFF8F0";
			backgroundGradient.addColorStop(0, this.lightenColor(baseColor, 0.1));
			backgroundGradient.addColorStop(0.5, baseColor);
			backgroundGradient.addColorStop(
				1,
				this.adjustColorBrightness(baseColor, -8),
			);
		}

		// Create the rounded rectangle path
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

		// Fill with LevelUpGenerator style gradient
		ctx.fillStyle = backgroundGradient;
		ctx.fill();

		// Reset shadow for border
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;

		// Add LevelUpGenerator style border gradient
		const borderGradient = ctx.createLinearGradient(
			x,
			y,
			x + width,
			y + height,
		);
		if (this.isGradientColor(colorScheme)) {
			borderGradient.addColorStop(
				0,
				this.lightenColor(colorScheme.secondary, 0.2),
			);
			borderGradient.addColorStop(0.3, colorScheme.secondary);
			borderGradient.addColorStop(
				0.7,
				this.darkenColor(colorScheme.secondary, 0.1),
			);
			borderGradient.addColorStop(
				1,
				this.lightenColor(colorScheme.secondary, 0.2),
			);
		} else {
			const borderColor = colorScheme ? colorScheme.primary : "#FF69B4";
			borderGradient.addColorStop(0, this.lightenColor(borderColor, 0.3));
			borderGradient.addColorStop(0.3, borderColor);
			borderGradient.addColorStop(0.7, this.darkenColor(borderColor, 0.1));
			borderGradient.addColorStop(1, this.lightenColor(borderColor, 0.2));
		}

		ctx.strokeStyle = borderGradient;
		ctx.lineWidth = 3;
		ctx.stroke();

		// Add inner subtle border like LevelUpGenerator
		const innerBorderColor = this.isGradientColor(colorScheme)
			? colorScheme.primary
			: colorScheme
				? colorScheme.primary
				: "#FF69B4";
		ctx.strokeStyle = `${innerBorderColor}40`;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x + radius + 3, y + 3);
		ctx.lineTo(x + width - radius - 3, y + 3);
		ctx.quadraticCurveTo(x + width - 3, y + 3, x + width - 3, y + radius + 3);
		ctx.lineTo(x + width - 3, y + height - radius - 3);
		ctx.quadraticCurveTo(
			x + width - 3,
			y + height - 3,
			x + width - radius - 3,
			y + height - 3,
		);
		ctx.lineTo(x + radius + 3, y + height - 3);
		ctx.quadraticCurveTo(x + 3, y + height - 3, x + 3, y + height - radius - 3);
		ctx.lineTo(x + 3, y + radius + 3);
		ctx.quadraticCurveTo(x + 3, y + 3, x + radius + 3, y + 3);
		ctx.closePath();
		ctx.stroke();

		ctx.restore();
	}

	// Function to fill entire canvas with gradient background
	// Enhanced function to draw gradient background with LevelUpGenerator style
	drawGradientBackground(ctx, width, height, colorScheme) {
		if (!this.isGradientColor(colorScheme)) {
			// Use LevelUpGenerator style radial gradient for solid colors
			const gradient = ctx.createRadialGradient(
				width / 2,
				height / 2,
				0,
				width / 2,
				height / 2,
				Math.max(width, height) / 1.2,
			);
			const baseColor = colorScheme ? colorScheme.primary : "#FFF8F0";
			gradient.addColorStop(0, baseColor);
			gradient.addColorStop(0.4, this.adjustColorBrightness(baseColor, -8));
			gradient.addColorStop(0.8, this.adjustColorBrightness(baseColor, -15));
			gradient.addColorStop(1, this.adjustColorBrightness(baseColor, -25));

			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, height);

			// Add decorative sparkles like LevelUpGenerator
			const sparkleColor = colorScheme ? colorScheme.primary : "#FF69B4";
			ctx.fillStyle = `${sparkleColor}12`;
			for (let i = 0; i < width; i += 35) {
				for (let j = 0; j < height; j += 35) {
					if ((i + j) % 70 === 0) {
						ctx.beginPath();
						ctx.arc(
							i + Math.random() * 10,
							j + Math.random() * 10,
							1.5,
							0,
							Math.PI * 2,
						);
						ctx.fill();
					}
				}
			}
			return;
		}

		// Enhanced gradient background with LevelUpGenerator style
		ctx.save();

		// Create main gradient with radial overlay
		const mainGradient = this.createAnimatedGradient(
			ctx,
			0,
			0,
			width,
			height,
			colorScheme,
			Date.now(),
		);
		ctx.fillStyle = mainGradient;
		ctx.fillRect(0, 0, width, height);

		// Add LevelUpGenerator style radial overlay
		const overlayGradient = ctx.createRadialGradient(
			width / 2,
			height / 2,
			0,
			width / 2,
			height / 2,
			Math.max(width, height) / 2,
		);
		overlayGradient.addColorStop(0, `${colorScheme.primary}85`);
		overlayGradient.addColorStop(0.7, `${colorScheme.primary}70`);
		overlayGradient.addColorStop(1, `${colorScheme.secondary}90`);

		ctx.fillStyle = overlayGradient;
		ctx.fillRect(0, 0, width, height);

		// Add decorative sparkles
		ctx.fillStyle = `${colorScheme.secondary}15`;
		for (let i = 0; i < width; i += 35) {
			for (let j = 0; j < height; j += 35) {
				if ((i + j) % 70 === 0) {
					ctx.beginPath();
					ctx.arc(
						i + Math.random() * 10,
						j + Math.random() * 10,
						1.5,
						0,
						Math.PI * 2,
					);
					ctx.fill();
				}
			}
		}

		ctx.restore();
	}

	// Function to get appropriate text color with LevelUpGenerator style
	getContrastTextColor(colorScheme, fallbackColor) {
		if (colorScheme && colorScheme.text) {
			return colorScheme.text;
		}
		// Use LevelUpGenerator style - darker version of the accent color
		const baseColor = colorScheme
			? colorScheme.primary
			: fallbackColor || "#424242";
		return this.darkenColor(baseColor, 0.4);
	}

	// LevelUpGenerator style enhanced text drawing
	drawEnhancedText(
		ctx,
		text,
		x,
		y,
		color,
		fontSize = 36,
		fontWeight = "bold",
		align = "left",
	) {
		// Add LevelUpGenerator style text shadow
		ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
		ctx.shadowBlur = 4;
		ctx.shadowOffsetY = 3;

		// Create text gradient like LevelUpGenerator
		const textGradient = ctx.createLinearGradient(x, y - fontSize, x, y + 4);
		textGradient.addColorStop(0, this.lightenColor(color, 0.2));
		textGradient.addColorStop(1, this.darkenColor(color, 0.2));

		ctx.fillStyle = textGradient;
		ctx.font = `${fontWeight} ${fontSize}px Kelvinch-Bold, Arial`;
		ctx.textAlign = align;
		ctx.fillText(text, x, y);

		// Reset shadow
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;
	}

	// LevelUpGenerator style enhanced info text
	drawEnhancedInfoText(ctx, text, x, y, color, fontSize = 22) {
		ctx.shadowColor = `${color}40`;
		ctx.shadowBlur = 3;

		ctx.fillStyle = this.darkenColor(color, 0.3);
		ctx.font = `600 ${fontSize}px Kelvinch-Roman, Arial`;
		ctx.textAlign = "left";
		ctx.fillText(text, x, y);

		ctx.shadowBlur = 0;
	}

	// Function to add a subtle glow effect for gradients
	addGlowEffect(ctx, x, y, width, height, colorScheme) {
		if (this.isGradientColor(colorScheme)) {
			ctx.save();
			ctx.shadowColor = colorScheme.primary;
			ctx.shadowBlur = 20;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.globalAlpha = 0.3;

			// Create a subtle glow around the element
			ctx.fillStyle = colorScheme.primary;
			ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

			ctx.restore();
		}
	}

	// Enhanced function to create animated-style gradients
	createAnimatedGradient(ctx, x, y, width, height, colorScheme, time = 0) {
		if (!this.isGradientColor(colorScheme)) {
			return colorScheme ? colorScheme.primary : "#E0E0E0";
		}

		const direction = colorScheme.gradientDirection || "135deg";
		let gradient;

		// Add slight animation effect by shifting gradient slightly
		const shift = Math.sin(time * 0.001) * 10;

		if (direction === "135deg" || direction === "to bottom right") {
			gradient = ctx.createLinearGradient(
				x + shift,
				y + shift,
				x + width,
				y + height,
			);
		} else if (direction === "90deg" || direction === "to right") {
			gradient = ctx.createLinearGradient(x + shift, y, x + width, y);
		} else if (direction === "180deg" || direction === "to bottom") {
			gradient = ctx.createLinearGradient(x, y + shift, x, y + height);
		} else if (direction === "45deg" || direction === "to top right") {
			gradient = ctx.createLinearGradient(x + shift, y + height, x + width, y);
		} else {
			gradient = ctx.createLinearGradient(
				x + shift,
				y + shift,
				x + width,
				y + height,
			);
		}

		// Add multiple color stops for richer gradients
		gradient.addColorStop(0, colorScheme.primary);
		gradient.addColorStop(
			0.5,
			this.blendColors(colorScheme.primary, colorScheme.secondary, 0.5),
		);
		gradient.addColorStop(1, colorScheme.secondary);

		return gradient;
	}

	// Function to blend two colors
	blendColors(color1, color2, ratio) {
		const hex1 = color1.replace("#", "");
		const hex2 = color2.replace("#", "");

		const r1 = parseInt(hex1.substring(0, 2), 16);
		const g1 = parseInt(hex1.substring(2, 4), 16);
		const b1 = parseInt(hex1.substring(4, 6), 16);

		const r2 = parseInt(hex2.substring(0, 2), 16);
		const g2 = parseInt(hex2.substring(2, 4), 16);
		const b2 = parseInt(hex2.substring(4, 6), 16);

		const r = Math.round(r1 + (r2 - r1) * ratio);
		const g = Math.round(g1 + (g2 - g1) * ratio);
		const b = Math.round(b1 + (b2 - b1) * ratio);

		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	}

	// LevelUpGenerator style color manipulation functions
	lightenColor(color, amount) {
		const hex = color.replace("#", "");
		const r = Math.min(
			255,
			parseInt(hex.substring(0, 2), 16) + Math.round(255 * amount),
		);
		const g = Math.min(
			255,
			parseInt(hex.substring(2, 4), 16) + Math.round(255 * amount),
		);
		const b = Math.min(
			255,
			parseInt(hex.substring(4, 6), 16) + Math.round(255 * amount),
		);

		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	}

	darkenColor(color, amount) {
		const hex = color.replace("#", "");
		const r = Math.max(
			0,
			parseInt(hex.substring(0, 2), 16) - Math.round(255 * amount),
		);
		const g = Math.max(
			0,
			parseInt(hex.substring(2, 4), 16) - Math.round(255 * amount),
		);
		const b = Math.max(
			0,
			parseInt(hex.substring(4, 6), 16) - Math.round(255 * amount),
		);

		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	}

	adjustColorBrightness(color, amount) {
		const hex = color.replace("#", "");
		const r = Math.max(
			0,
			Math.min(255, parseInt(hex.substring(0, 2), 16) + amount),
		);
		const g = Math.max(
			0,
			Math.min(255, parseInt(hex.substring(2, 4), 16) + amount),
		);
		const b = Math.max(
			0,
			Math.min(255, parseInt(hex.substring(4, 6), 16) + amount),
		);

		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	}

	async drawProfile(
		client,
		context,
		targetUser,
		userInfo,
		color,
		backgroundColor,
		emoji,
		banner,
		decorationImage,
	) {
		// Draw the background with gradient support
		if (backgroundColor) {
			this.drawGradientBackground(context, 1280, 720, backgroundColor);
		} else {
			context.fillStyle = client.utils.formatColor(color.main);
			context.fillRect(0, 0, 1280, 720);
		}

		if (banner) {
			const bannerImage = await loadImage(banner);
			const x = 15;
			const y = 100;
			const width = 850;
			const height = 460;
			const radius = 32;

			// Begin a new path for the rounded rectangle
			context.save();
			context.beginPath();
			context.moveTo(x + radius, y);
			context.lineTo(x + width - radius, y);
			context.quadraticCurveTo(x + width, y, x + width, y + radius);
			context.lineTo(x + width, y + height - radius);
			context.quadraticCurveTo(
				x + width,
				y + height,
				x + width - radius,
				y + height,
			);
			context.lineTo(x + radius, y + height);
			context.quadraticCurveTo(x, y + height, x, y + height - radius);
			context.lineTo(x, y + radius);
			context.quadraticCurveTo(x, y, x + radius, y);
			context.closePath();
			// Clip to the rounded rectangle path
			context.clip();
			// Draw the banner image within the clipped area
			context.drawImage(bannerImage, x, y, width, height);
			// Restore the context to remove the clipping path
			context.restore();
		}

		// Draw the rounded rectangle for the title box with gradient support
		const titleBoxColor = backgroundColor
			? backgroundColor
			: { primary: "#F7D8DF", secondary: "#F7D8DF" };
		this.drawRoundedRectangleWithGradient(
			context,
			15,
			25,
			1250,
			60,
			12,
			titleBoxColor,
		);

		// Add subtle overlay for gradient backgrounds to improve text readability
		if (this.isGradientColor(backgroundColor)) {
			context.save();
			context.globalAlpha = 0.15;
			this.drawRoundedRectangle(context, 15, 25, 1250, 60, 12, "#FFFFFF");
			context.restore();
		}

		// Draw "Profile" title with LevelUpGenerator style
		const profileTitleColor = this.getContrastTextColor(
			backgroundColor,
			client.utils.formatColor(color.dark),
		);
		this.drawEnhancedText(
			context,
			"Profile",
			30,
			65,
			profileTitleColor,
			36,
			"bold",
		);

		// Draw the rounded rectangle for the information box with gradient support
		const infoBoxColor = backgroundColor
			? {
					primary: backgroundColor.secondary || backgroundColor.primary,
					secondary: backgroundColor.secondary || backgroundColor.primary,
					isGradient: false,
				}
			: {
					primary: client.utils.formatColor(color.light),
					secondary: client.utils.formatColor(color.light),
				};

		this.drawRoundedRectangleWithGradient(
			context,
			880,
			100,
			385,
			570,
			32,
			infoBoxColor,
		);

		// Add subtle overlay for gradient backgrounds to improve text readability
		if (this.isGradientColor(backgroundColor)) {
			context.save();
			context.globalAlpha = 0.1;
			this.drawRoundedRectangle(context, 880, 100, 385, 570, 32, "#FFFFFF");
			context.restore();
		}

		// Draw the decoration image as a frame around the avatar (if available)
		const userAvatar = await loadImage(
			targetUser.displayAvatarURL({ format: "png", size: 256 }),
		);
		const userAvatarSize = 128;
		const wallpaperX = 15;
		const wallpaperY = 100;
		const wallpaperHeight = 538;
		const avatarPadding = 24;
		const userAvatarX = wallpaperX + avatarPadding;
		const userAvatarY =
			wallpaperY + wallpaperHeight - userAvatarSize - avatarPadding;

		// Draw avatar image clipped in a circle (drawn first, behind decoration)
		context.save();
		context.beginPath();
		context.arc(
			userAvatarX + userAvatarSize / 2,
			userAvatarY + userAvatarSize / 2,
			userAvatarSize / 2,
			0,
			Math.PI * 2,
			true,
		);
		context.closePath();
		context.clip();
		context.drawImage(
			userAvatar,
			userAvatarX,
			userAvatarY,
			userAvatarSize,
			userAvatarSize,
		);
		context.restore();

		// Draw decoration image on top of avatar, centered and slightly larger
		if (decorationImage) {
			try {
				const decoration = await loadImage(decorationImage);
				const decorationSize = 158; // 10px border around avatar
				const decorationX = userAvatarX + (userAvatarSize - decorationSize) / 2;
				const decorationY = userAvatarY + (userAvatarSize - decorationSize) / 2;
				context.save();
				context.beginPath();
				context.arc(
					userAvatarX + userAvatarSize / 2,
					userAvatarY + userAvatarSize / 2,
					decorationSize / 2,
					0,
					Math.PI * 2,
					true,
				);
				context.closePath();
				context.drawImage(
					decoration,
					decorationX,
					decorationY,
					decorationSize,
					decorationSize,
				);
				context.restore();
			} catch (e) {
				// If decoration image fails to load, ignore
			}
		}

		// Draw each setting item text and switch
		const userInfoDetail = [
			{
				label: "Name",
				description: client.utils.formatCapitalize(targetUser.username),
				x: 895,
				y: 140,
			},
			{
				label: "Gender",
				description:
					userInfo.profile && userInfo.profile.gender
						? client.utils.formatCapitalize(userInfo.profile.gender)
						: "Not Set",
				x: 895,
				y: 220,
			},
			{
				label: "Date of birth",
				description:
					userInfo.profile && userInfo.profile.birthday
						? userInfo.profile.birthday
						: "Not Set",
				x: 895,
				y: 300,
			},
			{
				label: "Bio",
				description:
					userInfo.profile && userInfo.profile.bio
						? userInfo.profile.bio
						: "Not Set",
				x: 895,
				y: 380,
			},
		];

		userInfoDetail.forEach((info) => {
			const textColor = this.getContrastTextColor(
				backgroundColor,
				client.utils.formatColor(color.dark),
			);

			// Draw label with LevelUpGenerator style
			this.drawEnhancedText(
				context,
				info.label,
				info.x,
				info.y,
				textColor,
				28,
				"bold",
			);

			// Draw description with enhanced info text style
			const maxWidth = 500;
			const lines = this.splitText(context, info.description, maxWidth);
			lines.forEach((line, index) => {
				this.drawEnhancedInfoText(
					context,
					line,
					info.x,
					info.y + 30 + index * 28,
					textColor,
					22,
				);
			});
		});

		// Draw achievements section
		if (userInfo.achievements && userInfo.achievements.length > 0) {
			// Sort achievements by date earned
			const sortedAchievements = [...userInfo.achievements].sort(
				(a, b) => new Date(b.earnedAt) - new Date(a.earnedAt),
			);

			// Take the 3 most recent achievements
			const recentAchievements = sortedAchievements.slice(0, 3);

			// Draw achievements section with LevelUpGenerator style
			const achievementColor = this.getContrastTextColor(
				backgroundColor,
				client.utils.formatColor(color.dark),
			);
			this.drawEnhancedText(
				context,
				"Recent Achievements",
				895,
				460,
				achievementColor,
				28,
				"bold",
			);

			// Draw each achievement with enhanced info text
			recentAchievements.forEach((achievement, index) => {
				this.drawEnhancedInfoText(
					context,
					`${achievement.emoji} ${achievement.name}`,
					895,
					490 + index * 32,
					achievementColor,
					22,
				);
			});
		}

		// Draw Zodiac Sign
		if (userInfo.profile.gender) {
			const genderEmoji =
				userInfo.profile.gender === "male"
					? emoji.gender.male
					: emoji.gender.female;
			const genderEmojiURL = client.utils.emojiToImage(genderEmoji);

			try {
				const genderEmojiImage = await loadImage(genderEmojiURL);
				context.drawImage(genderEmojiImage, 1170, 190, 64, 64);
			} catch (error) {
				console.error("Error loading zodiac emoji image:", error);
			}
		}

		// Draw Zodiac Sign
		if (userInfo.profile.birthday) {
			const birthday = moment(userInfo.profile.birthday, "DD-MMM");
			const day = birthday.date();
			const month = birthday.month() + 1;
			const zodiacSign = client.utils.getZodiacSign(emoji.zodiac, day, month);
			const zodiacEmojiURL = client.utils.emojiToImage(zodiacSign.emoji);

			try {
				const zodiacEmojiImage = await loadImage(zodiacEmojiURL);
				context.drawImage(zodiacEmojiImage, 1170, 280, 64, 64);
			} catch (error) {
				console.error("Error loading zodiac emoji image:", error);
			}
		}

		// Draw the logout button with gradient support
		this.drawRoundedRectangleWithGradient(
			context,
			945,
			600,
			256,
			50,
			12,
			backgroundColor
				? backgroundColor
				: { primary: "#F7D8DF", secondary: "#F7D8DF" },
		);
		// Draw the relationship status with LevelUpGenerator style
		const statusColor = this.getContrastTextColor(
			backgroundColor,
			client.utils.formatColor(color.dark),
		);
		const statusText = userInfo?.relationship?.partner?.userId
			? "Taken"
			: "Single";

		this.drawEnhancedText(
			context,
			statusText,
			1070,
			632,
			statusColor,
			32,
			"bold",
			"center",
		);
	}

	async drawChinaNewYearProfile(
		client,
		context,
		user,
		userInfo,
		partner,
		partnerInfo,
		banner,
	) {
		const wallpaperCNY = await loadImage("https://i.imgur.com/51ycl94.jpg");
		if (wallpaperCNY) {
			context.drawImage(wallpaperCNY, 0, 0, 1655, 930);
		}

		if (banner) {
			const bannerImage = await loadImage(banner);
			const x = 0;
			const y = 0;
			const width = 1920;
			const height = 1080;
			const radius = 32;

			// Begin a new path for the rounded rectangle
			context.save();
			context.beginPath();
			context.moveTo(x + radius, y);
			context.lineTo(x + width - radius, y);
			context.quadraticCurveTo(x + width, y, x + width, y + radius);
			context.lineTo(x + width, y + height - radius);
			context.quadraticCurveTo(
				x + width,
				y + height,
				x + width - radius,
				y + height,
			);
			context.lineTo(x + radius, y + height);
			context.quadraticCurveTo(x, y + height, x, y + height - radius);
			context.lineTo(x, y + radius);
			context.quadraticCurveTo(x, y, x + radius, y);
			context.closePath();
			// Clip to the rounded rectangle path
			context.clip();
			// Draw the banner image within the clipped area
			context.drawImage(bannerImage, x, y, width, height);
			// Restore the context to remove the clipping path
			context.restore();
		}

		// Draw the avatar as a circular image
		const userAvatar = await loadImage(
			user.displayAvatarURL({ format: "png", size: 256 }),
		);
		const userAvatarX = 1740;
		const userAvatarY = 850;
		const userAvatarSize = 100;

		if (userAvatar) {
			context.save();
			context.beginPath();
			context.arc(
				userAvatarX + userAvatarSize / 2,
				userAvatarY + userAvatarSize / 2,
				userAvatarSize / 2,
				0,
				Math.PI * 2,
				true,
			);
			context.closePath();
			context.clip();
			context.drawImage(
				userAvatar,
				userAvatarX,
				userAvatarY,
				userAvatarSize,
				userAvatarSize,
			);
			context.restore();
		}

		// PARTNER SECTION
		if (partner) {
			const partnerAvatar = await loadImage(
				partner.displayAvatarURL({ format: "png", size: 256 }),
			);
			const partnerAvatarX = 1525;
			const partnerAvatarY = 967;
			const partnerAvatarSize = 100;
			if (partnerAvatar) {
				context.save();
				context.beginPath();
				context.arc(
					partnerAvatarX + partnerAvatarSize / 2,
					partnerAvatarY + partnerAvatarSize / 2,
					partnerAvatarSize / 2,
					0,
					Math.PI * 2,
					true,
				);
				context.closePath();
				context.clip();
				context.drawImage(
					partnerAvatar,
					partnerAvatarX,
					partnerAvatarY,
					partnerAvatarSize,
					partnerAvatarSize,
				);
				context.restore();
			}
		}

		// Add Avatar Decoration
		context.beginPath();
		context.arc(
			userAvatarX + userAvatarSize / 2,
			userAvatarY + userAvatarSize / 2,
			userAvatarSize / 2 + 2,
			0,
			Math.PI * 2,
			true,
		); // Slightly larger circle
		context.lineWidth = 1;
		context.strokeStyle = "#000000";
		context.stroke();

		// Draw Information
		context.font = "28px Kelvinch-Bold, Arial";
		context.textAlign = "center";
		context.fillStyle = "#FFFFFF";
		context.fillText(client.utils.formatUpperCase(user.username), 1790, 617);

		context.fillText(
			client.utils.formatUpperCase(userInfo.profile.gender ?? "Not Set"),
			1790,
			687,
		);

		context.fillText(
			userInfo?.profile?.birthday
				? moment(userInfo.profile.birthday, "DD-MMM").format("DD MMM")
				: client.utils.formatUpperCase("Not Set"),
			1790,
			757,
		);

		context.fillText(
			partner
				? client.utils.formatUpperCase(partner.username)
				: client.utils.formatUpperCase("Single"),
			955,
			1025,
		);

		if (partner) {
			context.fillText(
				client.utils.formatNumber(userInfo.balance.coin),
				1790,
				827,
			);
		} else {
			context.fillText(
				client.utils.formatUpperCase(userInfo.profile.zodiacSign ?? "Not Set"),
				1790,
				827,
			);
		}

		if (partner) {
			const partnerDate = new Date(userInfo?.relationship?.partner?.date);
			const currentDate = Date.now();
			const diffInDays = Math.floor(
				(currentDate - partnerDate) / (1000 * 60 * 60 * 24),
			);
			context.fillText(`${diffInDays + 1} Days`, 1350, 1025);
		} else {
			context.fillText(
				client.utils.formatNumber(userInfo.balance.coin),
				1350,
				1025,
			);
		}
	}
};
