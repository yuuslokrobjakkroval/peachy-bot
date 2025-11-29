const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class Instagram extends Command {
	constructor(client) {
		super(client, {
			name: "instagram",
			description: {
				content: `Manage your Instagram profile with style! 📸`,
				examples: [
					"instagram - Shows your current Instagram details.",
					"instagram @mention - Shows the Instagram details of the mentioned user.",
					"instagram name @yourusername - Sets your Instagram username.",
					"instagram link https://instagram.com/yourusername - Sets your Instagram link.",
					"instagram clear - Clears your Instagram information.",
					"instagram help - Shows detailed command usage examples.",
				],
				usage:
					"instagram\ninstagram @mention\ninstagram name <@yourusername>\ninstagram link <YourInstagramLink>\ninstagram clear\ninstagram help",
			},
			category: "profile",
			aliases: ["ig", "insta"],
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
					name: "name",
					description: "Sets your Instagram username in the profile card.",
					type: 1, // Sub-command type
					options: [
						{
							name: "username",
							description: "Your Instagram username (with or without @).",
							type: 3, // String type
							required: true,
						},
					],
				},
				{
					name: "link",
					description: "Sets your Instagram link in the profile card.",
					type: 1, // Sub-command type
					options: [
						{
							name: "link",
							description: "The Instagram link to set.",
							type: 3, // String type
							required: true,
						},
					],
				},
				{
					name: "view",
					description: "View Instagram profile information.",
					type: 1, // Sub-command type
					options: [
						{
							name: "user",
							description: "The user whose Instagram profile to view.",
							type: 6, // User type
							required: false,
						},
					],
				},
				{
					name: "clear",
					description: "Clear your Instagram information.",
					type: 1, // Sub-command type
				},
				{
					name: "help",
					description: "Shows command usage examples and information.",
					type: 1, // Sub-command type
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const igMessages = language.locales.get(language.defaultLocale)
			?.socialMessages?.igMessages;

		const subCommand = ctx.isInteraction
			? ctx.interaction.options.getSubcommand()
			: args[0];

		const mentionedUser = ctx.isInteraction
			? ctx.interaction.options.getUser("user")
			: ctx.message.mentions.users.first() ||
				ctx.guild.members.cache.get(args[0]);

		// Handle different subcommands
		switch (subCommand) {
			case "name":
				return this.setInstagramName(
					client,
					ctx,
					args,
					color,
					emoji,
					igMessages,
				);
			case "link":
				return this.setInstagramLink(
					client,
					ctx,
					args,
					color,
					emoji,
					igMessages,
				);
			case "view":
				return this.viewInstagramProfile(
					client,
					ctx,
					mentionedUser,
					color,
					emoji,
					igMessages,
				);
			case "clear":
				return this.clearInstagramProfile(
					client,
					ctx,
					color,
					emoji,
					igMessages,
				);
			case "help":
				return this.showHelpMessage(client, ctx, color, emoji, igMessages);
			default:
				return this.viewInstagramProfile(
					client,
					ctx,
					mentionedUser,
					color,
					emoji,
					igMessages,
				);
		}
	}

	async setInstagramName(client, ctx, args, color, emoji, igMessages) {
		let username = ctx.isInteraction
			? ctx.interaction.options.getString("username")
			: args.slice(1).join(" ");

		// Clean up username - remove @ if present and validate
		username = username.replace(/^@/, "").trim();

		if (!username || username.length < 1 || username.length > 30) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.instagram} Instagram Username Error`)
				.setDescription(
					"❌ **Invalid Instagram username!**\n\n📝 **Requirements:**\n• Length: 1-30 characters\n• Can include letters, numbers, periods, and underscores\n• No spaces or special characters",
				)
				.addFields([
					{
						name: "✅ Valid Examples",
						value:
							"`/instagram name john.smith`\n`/instagram name @john_smith123`\n`/instagram name johnsmith`",
						inline: false,
					},
				])
				.setFooter({
					text: "💡 Tip: Use your actual Instagram username for easy discovery!",
				});

			return ctx.sendMessage({ embeds: [embed] });
		}

		// Validate Instagram username format
		const instagramUsernamePattern = /^[a-zA-Z0-9._]+$/;
		if (!instagramUsernamePattern.test(username)) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.instagram} Instagram Username Error`)
				.setDescription(
					"❌ **Invalid Instagram username format!**\n\n📝 **Instagram usernames can only contain:**\n• Letters (a-z, A-Z)\n• Numbers (0-9)\n• Periods (.)\n• Underscores (_)",
				)
				.addFields([
					{
						name: "✅ Try Again",
						value: "`/instagram name yourvalidusername`",
						inline: false,
					},
				])
				.setFooter({ text: "Make sure to use your real Instagram username!" });

			return ctx.sendMessage({ embeds: [embed] });
		}

		try {
			await Users.updateOne(
				{ userId: ctx.author.id },
				{ $set: { "social.instagram.name": `@${username}` } },
				{ upsert: true },
			);

			const embed = client
				.embed()
				.setColor(color.success)
				.setTitle(`${emoji.social.instagram} Instagram Username Updated!`)
				.setDescription(`📸 **Successfully set your Instagram username!**`)
				.addFields([
					{
						name: "📝 New Instagram Username",
						value: `\`@${username}\``,
						inline: false,
					},
					{
						name: "🔗 Next Step",
						value:
							"Set your Instagram link with:\n`/instagram link https://instagram.com/yourusername`",
						inline: false,
					},
				])
				.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
				.setFooter({ text: "Your Instagram profile is taking shape! 📸✨" });

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("instagram_set_link")
					.setLabel("Set Instagram Link")
					.setEmoji("🔗")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("view_socials")
					.setLabel("View All Socials")
					.setEmoji("📱")
					.setStyle(ButtonStyle.Secondary),
			);

			return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
		} catch (error) {
			return this.handleError(
				client,
				ctx,
				color,
				"Failed to update Instagram username. Please try again later.",
			);
		}
	}

	async setInstagramLink(client, ctx, args, color, emoji, igMessages) {
		const link = ctx.isInteraction
			? ctx.interaction.options.getString("link")
			: args.slice(1).join(" ");

		// Enhanced Instagram URL validation
		const instagramUrlPattern =
			/^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/.+/i;

		if (!link || !instagramUrlPattern.test(link)) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.instagram} Instagram Link Error`)
				.setDescription(
					"❌ **Invalid Instagram link!**\n\n🔗 **Accepted formats:**",
				)
				.addFields([
					{
						name: "✅ Valid Examples",
						value:
							"• `https://instagram.com/yourusername`\n• `https://www.instagram.com/yourusername`\n• `https://instagr.am/yourusername`",
						inline: false,
					},
					{
						name: "📝 Requirements",
						value:
							"• Must start with http:// or https://\n• Must be an Instagram domain\n• Must include a username path",
						inline: false,
					},
				])
				.setFooter({
					text: "💡 Tip: Copy the link directly from your Instagram profile!",
				});

			return ctx.sendMessage({ embeds: [embed] });
		}

		try {
			const user = await Users.findOne({ userId: ctx.author.id });
			const currentName = user?.social?.instagram?.name;

			await Users.updateOne(
				{ userId: ctx.author.id },
				{ $set: { "social.instagram.link": link } },
				{ upsert: true },
			);

			const embed = client
				.embed()
				.setColor(color.success)
				.setTitle(`${emoji.social.instagram} Instagram Link Updated!`)
				.setDescription(`📸 **Successfully set your Instagram link!**`)
				.addFields([
					{
						name: "🔗 New Instagram Link",
						value: `[Visit Profile](${link})`,
						inline: false,
					},
				])
				.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
				.setURL(link);

			if (!currentName) {
				embed.addFields([
					{
						name: "📝 Next Step",
						value:
							"Set your Instagram username with:\n`/instagram name yourusername`",
						inline: false,
					},
				]);
			} else {
				embed.addFields([
					{
						name: "✨ Profile Complete",
						value: `Your Instagram profile is now fully configured!\nUsername: \`${currentName}\``,
						inline: false,
					},
				]);
			}

			embed.setFooter({
				text: "Your Instagram presence is looking amazing! 📸🌟",
			});

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setURL(link)
					.setLabel("Visit Instagram Profile")
					.setEmoji(emoji.social.instagram)
					.setStyle(ButtonStyle.Link),
				new ButtonBuilder()
					.setCustomId("view_socials")
					.setLabel("View All Socials")
					.setEmoji("📱")
					.setStyle(ButtonStyle.Secondary),
			);

			return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
		} catch (error) {
			return this.handleError(
				client,
				ctx,
				color,
				"Failed to update Instagram link. Please try again later.",
			);
		}
	}

	async viewInstagramProfile(
		client,
		ctx,
		mentionedUser,
		color,
		emoji,
		igMessages,
	) {
		const targetUser = mentionedUser || ctx.author;
		const isOwnProfile = targetUser.id === ctx.author.id;

		const user = await Users.findOne({ userId: targetUser.id });

		if (!user) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.instagram} User Not Found`)
				.setDescription(
					`❌ ${igMessages?.userNotFound || "User not found in our database."}`,
				)
				.setFooter({ text: "💡 User needs to interact with the bot first!" });
			return ctx.sendMessage({ embeds: [embed] });
		}

		const igName = user.social.instagram.name;
		const igLink = user.social.instagram.link;
		const isConfigured = igName && igLink;

		const embed = client
			.embed()
			.setColor(isConfigured ? color.main : color.warning)
			.setAuthor({
				name: `${targetUser.displayName}'s Instagram Profile`,
				iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 64 }),
			})
			.setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }));

		if (isConfigured) {
			embed
				.setDescription(
					`📸 **Instagram Profile Active!**\n\n${emoji.social.instagram} **Username:** \`${igName}\`\n🔗 **Link:** [Visit Profile](${igLink})`,
				)
				.setURL(igLink)
				.addFields([
					{
						name: "✅ Status",
						value: "**Fully Configured** - Profile is ready to share!",
						inline: false,
					},
				]);
		} else {
			embed
				.setDescription(
					`${emoji.social.instagram} **Instagram Profile**\n\n📝 **Username:** ${igName || "Not set"}\n🔗 **Link:** ${igLink || "Not set"}`,
				)
				.addFields([
					{
						name: isOwnProfile ? "📸 Get Started" : "📊 Status",
						value: isOwnProfile
							? "Your Instagram profile isn't set up yet. Use the buttons below to get started!"
							: "This user hasn't configured their Instagram profile yet.",
						inline: false,
					},
				]);
		}

		embed.setFooter({
			text: isOwnProfile
				? "💡 Tip: A complete Instagram profile helps showcase your visual content!"
				: `Requested by ${ctx.author.username}`,
		});

		// Add action buttons for own profile
		let components = [];
		if (isOwnProfile) {
			const actionRow = new ActionRowBuilder();

			if (!igName) {
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId("instagram_set_name")
						.setLabel("Set Username")
						.setEmoji("📝")
						.setStyle(ButtonStyle.Primary),
				);
			}

			if (!igLink) {
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId("instagram_set_link")
						.setLabel("Set Link")
						.setEmoji("🔗")
						.setStyle(ButtonStyle.Primary),
				);
			}

			if (isConfigured) {
				actionRow.addComponents(
					new ButtonBuilder()
						.setURL(igLink)
						.setLabel("Visit Profile")
						.setEmoji(emoji.social.instagram)
						.setStyle(ButtonStyle.Link),
					new ButtonBuilder()
						.setCustomId("instagram_clear")
						.setLabel("Clear")
						.setEmoji("🗑️")
						.setStyle(ButtonStyle.Danger),
				);
			}

			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId("view_socials")
					.setLabel("All Socials")
					.setEmoji("📱")
					.setStyle(ButtonStyle.Secondary),
			);

			if (actionRow.components.length > 0) {
				components = [actionRow];
			}
		}

		return ctx.sendMessage({ embeds: [embed], components });
	}

	async clearInstagramProfile(client, ctx, color, emoji, igMessages) {
		try {
			await Users.updateOne(
				{ userId: ctx.author.id },
				{
					$unset: {
						"social.instagram.name": "",
						"social.instagram.link": "",
					},
				},
			);

			const embed = client
				.embed()
				.setColor(color.warning)
				.setTitle(`${emoji.social.instagram} Instagram Profile Cleared`)
				.setDescription(
					"🧹 **Your Instagram information has been cleared successfully!**",
				)
				.addFields([
					{
						name: "🔄 What's Next?",
						value:
							"You can set up your Instagram profile again anytime using:\n• `/instagram name yourusername`\n• `/instagram link YourInstagramURL`",
						inline: false,
					},
				])
				.setFooter({
					text: "Your data has been safely removed from our system.",
				});

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("instagram_set_name")
					.setLabel("Set Username Again")
					.setEmoji("📝")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("view_socials")
					.setLabel("View All Socials")
					.setEmoji("📱")
					.setStyle(ButtonStyle.Secondary),
			);

			return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
		} catch (error) {
			return this.handleError(
				client,
				ctx,
				color,
				"Failed to clear Instagram profile. Please try again later.",
			);
		}
	}

	async showHelpMessage(client, ctx, color, emoji, igMessages) {
		const embed = client
			.embed()
			.setColor(color.main)
			.setTitle(`${emoji.social.instagram} Instagram Command Help`)
			.setDescription(
				"📸 **Master your Instagram profile management!**\n\nHere's everything you can do with the Instagram command:",
			)
			.addFields([
				{
					name: "👀 View Instagram Profile",
					value:
						"• `/instagram` - View your Instagram profile\n• `/instagram view @user` - View someone else's profile",
					inline: false,
				},
				{
					name: "📝 Set Instagram Username",
					value:
						"• `/instagram name yourusername` - Set your Instagram username\n• Example: `/instagram name john.smith`\n• Example: `/instagram name @cool_photographer`",
					inline: false,
				},
				{
					name: "🔗 Set Instagram Link",
					value:
						"• `/instagram link YourURL` - Set your Instagram profile URL\n• Example: `/instagram link https://instagram.com/john.smith`",
					inline: false,
				},
				{
					name: "🧹 Clear Information",
					value: "• `/instagram clear` - Remove all your Instagram information",
					inline: false,
				},
				{
					name: "📱 Additional Commands",
					value:
						"• `/socials` - View all your social media profiles\n• `/facebook` - Manage your Facebook profile\n• `/tiktok` - Manage your TikTok profile",
					inline: false,
				},
				{
					name: "💡 Pro Tips",
					value:
						"📸 Use your actual Instagram username\n🔗 Make sure your Instagram profile is public\n✨ Include the @ symbol or not - we'll handle it!\n🎯 Complete both username and link for full functionality\n🌟 Check `/socials` to see your complete social media hub",
					inline: false,
				},
			])
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
			.setFooter({ text: "Ready to showcase your amazing content? 📸✨" });

		const actionRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("instagram_set_name")
				.setLabel("Set Username")
				.setEmoji("📝")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId("instagram_set_link")
				.setLabel("Set Link")
				.setEmoji("🔗")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId("view_socials")
				.setLabel("View All Socials")
				.setEmoji("📱")
				.setStyle(ButtonStyle.Secondary),
		);

		return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
	}

	handleError(client, ctx, color, message) {
		const embed = client
			.embed()
			.setColor(color.danger)
			.setTitle("❌ Error")
			.setDescription(message)
			.setFooter({ text: "If this persists, please contact support." });

		return ctx.sendMessage({ embeds: [embed] });
	}
};
