const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

module.exports = class Socials extends Command {
	constructor(client) {
		super(client, {
			name: "socials",
			description: {
				content: "Show and manage social media profiles with style! 🌟",
				examples: [
					"socials - Shows your current social media profiles.",
					"socials @user - Shows another user's social media profiles.",
					"socials setup - Quick setup guide for all social platforms.",
				],
				usage: "socials [user] [setup]",
			},
			category: "profile",
			aliases: ["socialmedia", "sm", "social"],
			cooldown: 3,
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
					description: "Mention a user to view their social media profiles.",
					type: 6, // USER type for mentions
					required: false,
				},
				{
					name: "action",
					description: "Additional actions you can perform.",
					type: 3, // STRING type
					required: false,
					choices: [
						{ name: "Setup Guide", value: "setup" },
						{ name: "Statistics", value: "stats" },
					],
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const smMessages = language.locales.get(language.defaultLocale)
			?.socialMessages?.smMessages;

		const mentionedUser = ctx.isInteraction
			? ctx.interaction.options.getUser("user")
			: ctx.message.mentions.users.first() ||
				ctx.guild.members.cache.get(args[0]);

		const action = ctx.isInteraction
			? ctx.interaction.options.getString("action")
			: args.find((arg) => ["setup", "stats"].includes(arg.toLowerCase()));

		const targetUser = mentionedUser || ctx.author;
		const targetUserId = targetUser.id;
		const isOwnProfile = targetUserId === ctx.author.id;

		// Handle special actions
		if (action === "setup" && isOwnProfile) {
			return this.showSetupGuide(client, ctx, color, emoji, smMessages);
		}

		if (action === "stats" && isOwnProfile) {
			return this.showSocialStats(client, ctx, color, emoji, smMessages);
		}

		const user = await Users.findOne({ userId: targetUserId });
		const targetUsername = targetUser.displayName;

		if (!user) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.mainLeft} User Not Found ${emoji.mainRight}`)
				.setDescription(
					`❌ ${smMessages?.userNotFound || "User not found in our database."}`,
				)
				.setFooter({ text: "💡 User needs to interact with the bot first!" });
			return ctx.sendMessage({ embeds: [embed] });
		}

		// Get social media data
		const socialData = {
			facebook: {
				name: user.social.facebook.name,
				link: user.social.facebook.link,
			},
			instagram: {
				name: user.social.instagram.name,
				link: user.social.instagram.link,
			},
			tiktok: {
				name: user.social.tiktok.name,
				link: user.social.tiktok.link,
			},
		};

		// Count configured platforms
		const configuredPlatforms = Object.values(socialData).filter(
			(platform) => platform.name && platform.link,
		).length;

		// Create enhanced embed
		const embed = this.createSocialEmbed(
			client,
			targetUser,
			targetUsername,
			socialData,
			configuredPlatforms,
			isOwnProfile,
			color,
			emoji,
			smMessages,
		);

		// Create action buttons (only for own profile)
		const components = isOwnProfile ? this.createActionButtons(emoji) : [];

		return ctx.sendMessage({
			embeds: [embed],
			components: components.length > 0 ? [components] : [],
		});
	}

	createSocialEmbed(
		client,
		targetUser,
		targetUsername,
		socialData,
		configuredPlatforms,
		isOwnProfile,
		color,
		emoji,
		smMessages,
	) {
		const embed = client
			.embed()
			.setColor(configuredPlatforms > 0 ? color.main : color.warning)
			.setAuthor({
				name: `${targetUsername}'s Social Media Hub`,
				iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 64 }),
			})
			.setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }));

		// Platform status indicators
		const platformStatus = {
			facebook:
				socialData.facebook.name && socialData.facebook.link ? "🟢" : "🔴",
			instagram:
				socialData.instagram.name && socialData.instagram.link ? "🟢" : "🔴",
			tiktok: socialData.tiktok.name && socialData.tiktok.link ? "🟢" : "🔴",
		};

		// Create description with better formatting
		let description = `**🌐 Connected Platforms: ${configuredPlatforms}/3**\n\n`;

		// Facebook section
		const fbDisplay =
			socialData.facebook.name && socialData.facebook.link
				? `[${socialData.facebook.name}](${socialData.facebook.link})`
				: socialData.facebook.name || "Not set";

		description += `${platformStatus.facebook} ${emoji.social.facebook} **Facebook**\n`;
		description += `└ ${fbDisplay}\n\n`;

		// Instagram section
		const igDisplay =
			socialData.instagram.name && socialData.instagram.link
				? `[${socialData.instagram.name}](${socialData.instagram.link})`
				: socialData.instagram.name || "Not set";

		description += `${platformStatus.instagram} ${emoji.social.instagram} **Instagram**\n`;
		description += `└ ${igDisplay}\n\n`;

		// TikTok section
		const ttDisplay =
			socialData.tiktok.name && socialData.tiktok.link
				? `[${socialData.tiktok.name}](${socialData.tiktok.link})`
				: socialData.tiktok.name || "Not set";

		description += `${platformStatus.tiktok} ${emoji.social.tiktok} **TikTok**\n`;
		description += `└ ${ttDisplay}`;

		embed.setDescription(description);

		// Add completion status
		if (configuredPlatforms === 3) {
			embed.addFields([
				{
					name: "🎉 Profile Status",
					value: "**Complete!** All social platforms configured.",
					inline: false,
				},
			]);
		} else if (configuredPlatforms > 0) {
			embed.addFields([
				{
					name: "⚡ Profile Status",
					value: `**${configuredPlatforms}/3** platforms configured. ${isOwnProfile ? "Use the buttons below to complete your profile!" : ""}`,
					inline: false,
				},
			]);
		} else {
			embed.addFields([
				{
					name: "🚀 Get Started",
					value: isOwnProfile
						? "No social platforms configured yet. Use the setup guide to get started!"
						: "This user hasn't configured their social media profiles yet.",
					inline: false,
				},
			]);
		}

		// Footer with helpful information
		embed.setFooter({
			text: isOwnProfile
				? "💡 Tip: Use individual commands like /facebook, /instagram, /tiktok for detailed management"
				: `Requested by ${ctx.author.username}`,
		});

		return embed;
	}

	createActionButtons(emoji) {
		return new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("social_setup")
				.setLabel("Setup Guide")
				.setEmoji("🚀")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId("social_facebook")
				.setLabel("Facebook")
				.setEmoji(emoji.social.facebook)
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("social_instagram")
				.setLabel("Instagram")
				.setEmoji(emoji.social.instagram)
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("social_tiktok")
				.setLabel("TikTok")
				.setEmoji(emoji.social.tiktok)
				.setStyle(ButtonStyle.Secondary),
		);
	}

	async showSetupGuide(client, ctx, color, emoji, smMessages) {
		const embed = client
			.embed()
			.setColor(color.main)
			.setTitle(`${emoji.mainLeft} Social Media Setup Guide ${emoji.mainRight}`)
			.setDescription(
				"🚀 **Welcome to your Social Media Hub!** Follow these steps to set up your profiles:",
			)
			.addFields([
				{
					name: `${emoji.social.facebook} Facebook Setup`,
					value:
						"```/facebook name YourName\n/facebook link https://facebook.com/yourprofile```",
					inline: false,
				},
				{
					name: `${emoji.social.instagram} Instagram Setup`,
					value:
						"```/instagram name @yourusername\n/instagram link https://instagram.com/yourusername```",
					inline: false,
				},
				{
					name: `${emoji.social.tiktok} TikTok Setup`,
					value:
						"```/tiktok name @yourusername\n/tiktok link https://tiktok.com/@yourusername```",
					inline: false,
				},
				{
					name: "💡 Pro Tips",
					value:
						"• Use real usernames for better discoverability\n• Make sure your links are public\n• You can update your info anytime\n• Use `/socials` to view your completed profile",
					inline: false,
				},
			])
			.setFooter({
				text: "Get started today and connect with your community! 🌟",
			});

		return ctx.sendMessage({ embeds: [embed] });
	}

	async showSocialStats(client, ctx, color, emoji, smMessages) {
		const user = await Users.findOne({ userId: ctx.author.id });
		if (!user) return;

		const socialData = user.social;
		const configuredPlatforms = Object.values(socialData).filter(
			(platform) => platform.name && platform.link,
		).length;

		const completionPercentage = Math.round((configuredPlatforms / 3) * 100);

		const embed = client
			.embed()
			.setColor(color.main)
			.setTitle(
				`${emoji.mainLeft} Your Social Media Statistics ${emoji.mainRight}`,
			)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
			.addFields([
				{
					name: "📊 Profile Completion",
					value: `**${completionPercentage}%** (${configuredPlatforms}/3 platforms)`,
					inline: true,
				},
				{
					name: "🎯 Profile Status",
					value:
						completionPercentage === 100
							? "**Complete!** 🎉"
							: "**In Progress** ⚡",
					inline: true,
				},
				{
					name: "📱 Platform Breakdown",
					value: `${socialData.facebook.name ? "✅" : "❌"} Facebook\n${socialData.instagram.name ? "✅" : "❌"} Instagram\n${socialData.tiktok.name ? "✅" : "❌"} TikTok`,
					inline: false,
				},
			])
			.setFooter({ text: "Keep building your social presence! 🚀" });

		return ctx.sendMessage({ embeds: [embed] });
	}
};
