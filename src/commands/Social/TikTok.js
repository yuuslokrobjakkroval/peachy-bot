const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class TikTok extends Command {
	constructor(client) {
		super(client, {
			name: "tiktok",
			description: {
				content: `Manage your TikTok profile with style! 🎵`,
				examples: [
					"tiktok - Shows your current TikTok details.",
					"tiktok @mention - Shows the TikTok details of the mentioned user.",
					"tiktok name @yourusername - Sets your TikTok username.",
					"tiktok link https://tiktok.com/@yourusername - Sets your TikTok link.",
					"tiktok clear - Clears your TikTok information.",
					"tiktok help - Shows detailed command usage examples.",
				],
				usage:
					"tiktok\ntiktok @mention\ntiktok name <@yourusername>\ntiktok link <YourTikTokLink>\ntiktok clear\ntiktok help",
			},
			category: "profile",
			aliases: ["tt"],
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
					description: "Sets your TikTok username in the profile card.",
					type: 1, // Sub-command type
					options: [
						{
							name: "username",
							description: "Your TikTok username (with or without @).",
							type: 3, // String type
							required: true,
						},
					],
				},
				{
					name: "link",
					description: "Sets your TikTok link in the profile card.",
					type: 1, // Sub-command type
					options: [
						{
							name: "link",
							description: "The TikTok link to set.",
							type: 3, // String type
							required: true,
						},
					],
				},
				{
					name: "view",
					description: "View TikTok profile information.",
					type: 1, // Sub-command type
					options: [
						{
							name: "user",
							description: "The user whose TikTok profile to view.",
							type: 6, // User type
							required: false,
						},
					],
				},
				{
					name: "clear",
					description: "Clear your TikTok information.",
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
		const ttMessages = language.locales.get(language.defaultLocale)
			?.socialMessages?.ttMessages;

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
				return this.setTikTokName(client, ctx, args, color, emoji, ttMessages);
			case "link":
				return this.setTikTokLink(client, ctx, args, color, emoji, ttMessages);
			case "view":
				return this.viewTikTokProfile(
					client,
					ctx,
					mentionedUser,
					color,
					emoji,
					ttMessages,
				);
			case "clear":
				return this.clearTikTokProfile(client, ctx, color, emoji, ttMessages);
			case "help":
				return this.showHelpMessage(client, ctx, color, emoji, ttMessages);
			default:
				return this.viewTikTokProfile(
					client,
					ctx,
					mentionedUser,
					color,
					emoji,
					ttMessages,
				);
		}
	}

	async setTikTokName(client, ctx, args, color, emoji, ttMessages) {
		let username = ctx.isInteraction
			? ctx.interaction.options.getString("username")
			: args.slice(1).join(" ");

		// Clean up username - remove @ if present and validate
		username = username.replace(/^@/, "").trim();

		if (!username || username.length < 2 || username.length > 24) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.tiktok} TikTok Username Error`)
				.setDescription(
					"❌ **Invalid TikTok username!**\n\n📝 **Requirements:**\n• Length: 2-24 characters\n• Can include letters, numbers, periods, and underscores\n• Cannot start with a number or period",
				)
				.addFields([
					{
						name: "✅ Valid Examples",
						value:
							"`/tiktok name cool.creator`\n`/tiktok name @amazing_dancer`\n`/tiktok name tiktoker123`",
						inline: false,
					},
				])
				.setFooter({
					text: "💡 Tip: Use your actual TikTok username for easy discovery!",
				});

			return ctx.sendMessage({ embeds: [embed] });
		}

		// Validate TikTok username format
		const tiktokUsernamePattern = /^[a-zA-Z][a-zA-Z0-9._]*$/;
		if (!tiktokUsernamePattern.test(username)) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.tiktok} TikTok Username Error`)
				.setDescription(
					"❌ **Invalid TikTok username format!**\n\n📝 **TikTok usernames must:**\n• Start with a letter\n• Only contain letters, numbers, periods, and underscores\n• Not start with a number or period",
				)
				.addFields([
					{
						name: "✅ Try Again",
						value: "`/tiktok name yourvalidusername`",
						inline: false,
					},
				])
				.setFooter({ text: "Make sure to use your real TikTok username!" });

			return ctx.sendMessage({ embeds: [embed] });
		}

		try {
			await Users.updateOne(
				{ userId: ctx.author.id },
				{ $set: { "social.tiktok.name": `@${username}` } },
				{ upsert: true },
			);

			const embed = client
				.embed()
				.setColor(color.success)
				.setTitle(`${emoji.social.tiktok} TikTok Username Updated!`)
				.setDescription(`🎵 **Successfully set your TikTok username!**`)
				.addFields([
					{
						name: "📝 New TikTok Username",
						value: `\`@${username}\``,
						inline: false,
					},
					{
						name: "🔗 Next Step",
						value:
							"Set your TikTok link with:\n`/tiktok link https://tiktok.com/@yourusername`",
						inline: false,
					},
				])
				.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
				.setFooter({
					text: "Your TikTok profile is getting ready to go viral! 🎵🚀",
				});

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("tiktok_set_link")
					.setLabel("Set TikTok Link")
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
				"Failed to update TikTok username. Please try again later.",
			);
		}
	}

	async setTikTokLink(client, ctx, args, color, emoji, ttMessages) {
		const link = ctx.isInteraction
			? ctx.interaction.options.getString("link")
			: args.slice(1).join(" ");

		// Enhanced TikTok URL validation
		const tiktokUrlPattern =
			/^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/i;

		if (!link || !tiktokUrlPattern.test(link)) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.tiktok} TikTok Link Error`)
				.setDescription(
					"❌ **Invalid TikTok link!**\n\n🔗 **Accepted formats:**",
				)
				.addFields([
					{
						name: "✅ Valid Examples",
						value:
							"• `https://tiktok.com/@yourusername`\n• `https://www.tiktok.com/@yourusername`\n• `https://vm.tiktok.com/shortlink`",
						inline: false,
					},
					{
						name: "📝 Requirements",
						value:
							"• Must start with http:// or https://\n• Must be a TikTok domain\n• Must include a valid path",
						inline: false,
					},
				])
				.setFooter({
					text: "💡 Tip: Copy the link directly from your TikTok profile!",
				});

			return ctx.sendMessage({ embeds: [embed] });
		}

		try {
			const user = await Users.findOne({ userId: ctx.author.id });
			const currentName = user?.social?.tiktok?.name;

			await Users.updateOne(
				{ userId: ctx.author.id },
				{ $set: { "social.tiktok.link": link } },
				{ upsert: true },
			);

			const embed = client
				.embed()
				.setColor(color.success)
				.setTitle(`${emoji.social.tiktok} TikTok Link Updated!`)
				.setDescription(`🎵 **Successfully set your TikTok link!**`)
				.addFields([
					{
						name: "🔗 New TikTok Link",
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
							"Set your TikTok username with:\n`/tiktok name yourusername`",
						inline: false,
					},
				]);
			} else {
				embed.addFields([
					{
						name: "✨ Profile Complete",
						value: `Your TikTok profile is now fully configured!\nUsername: \`${currentName}\``,
						inline: false,
					},
				]);
			}

			embed.setFooter({ text: "Your TikTok presence is ready to shine! 🎵✨" });

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setURL(link)
					.setLabel("Visit TikTok Profile")
					.setEmoji(emoji.social.tiktok)
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
				"Failed to update TikTok link. Please try again later.",
			);
		}
	}

	async viewTikTokProfile(
		client,
		ctx,
		mentionedUser,
		color,
		emoji,
		ttMessages,
	) {
		const targetUser = mentionedUser || ctx.author;
		const isOwnProfile = targetUser.id === ctx.author.id;

		const user = await Users.findOne({ userId: targetUser.id });

		if (!user) {
			const embed = client
				.embed()
				.setColor(color.danger)
				.setTitle(`${emoji.social.tiktok} User Not Found`)
				.setDescription(
					`❌ ${ttMessages?.userNotFound || "User not found in our database."}`,
				)
				.setFooter({ text: "💡 User needs to interact with the bot first!" });
			return ctx.sendMessage({ embeds: [embed] });
		}

		const ttName = user.social.tiktok.name;
		const ttLink = user.social.tiktok.link;
		const isConfigured = ttName && ttLink;

		const embed = client
			.embed()
			.setColor(isConfigured ? color.main : color.warning)
			.setAuthor({
				name: `${targetUser.displayName}'s TikTok Profile`,
				iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 64 }),
			})
			.setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }));

		if (isConfigured) {
			embed
				.setDescription(
					`🎵 **TikTok Profile Active!**\n\n${emoji.social.tiktok} **Username:** \`${ttName}\`\n🔗 **Link:** [Visit Profile](${ttLink})`,
				)
				.setURL(ttLink)
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
					`${emoji.social.tiktok} **TikTok Profile**\n\n📝 **Username:** ${ttName || "Not set"}\n🔗 **Link:** ${ttLink || "Not set"}`,
				)
				.addFields([
					{
						name: isOwnProfile ? "🎵 Get Started" : "📊 Status",
						value: isOwnProfile
							? "Your TikTok profile isn't set up yet. Use the buttons below to get started!"
							: "This user hasn't configured their TikTok profile yet.",
						inline: false,
					},
				]);
		}

		embed.setFooter({
			text: isOwnProfile
				? "💡 Tip: A complete TikTok profile helps showcase your creative content!"
				: `Requested by ${ctx.author.username}`,
		});

		// Add action buttons for own profile
		let components = [];
		if (isOwnProfile) {
			const actionRow = new ActionRowBuilder();

			if (!ttName) {
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId("tiktok_set_name")
						.setLabel("Set Username")
						.setEmoji("📝")
						.setStyle(ButtonStyle.Primary),
				);
			}

			if (!ttLink) {
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId("tiktok_set_link")
						.setLabel("Set Link")
						.setEmoji("🔗")
						.setStyle(ButtonStyle.Primary),
				);
			}

			if (isConfigured) {
				actionRow.addComponents(
					new ButtonBuilder()
						.setURL(ttLink)
						.setLabel("Visit Profile")
						.setEmoji(emoji.social.tiktok)
						.setStyle(ButtonStyle.Link),
					new ButtonBuilder()
						.setCustomId("tiktok_clear")
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

	async clearTikTokProfile(client, ctx, color, emoji, ttMessages) {
		try {
			await Users.updateOne(
				{ userId: ctx.author.id },
				{
					$unset: {
						"social.tiktok.name": "",
						"social.tiktok.link": "",
					},
				},
			);

			const embed = client
				.embed()
				.setColor(color.warning)
				.setTitle(`${emoji.social.tiktok} TikTok Profile Cleared`)
				.setDescription(
					"🧹 **Your TikTok information has been cleared successfully!**",
				)
				.addFields([
					{
						name: "🔄 What's Next?",
						value:
							"You can set up your TikTok profile again anytime using:\n• `/tiktok name yourusername`\n• `/tiktok link YourTikTokURL`",
						inline: false,
					},
				])
				.setFooter({
					text: "Your data has been safely removed from our system.",
				});

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("tiktok_set_name")
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
				"Failed to clear TikTok profile. Please try again later.",
			);
		}
	}

	async showHelpMessage(client, ctx, color, emoji, ttMessages) {
		const embed = client
			.embed()
			.setColor(color.main)
			.setTitle(`${emoji.social.tiktok} TikTok Command Help`)
			.setDescription(
				"🎵 **Master your TikTok profile management!**\n\nHere's everything you can do with the TikTok command:",
			)
			.addFields([
				{
					name: "👀 View TikTok Profile",
					value:
						"• `/tiktok` - View your TikTok profile\n• `/tiktok view @user` - View someone else's profile",
					inline: false,
				},
				{
					name: "📝 Set TikTok Username",
					value:
						"• `/tiktok name yourusername` - Set your TikTok username\n• Example: `/tiktok name cool.creator`\n• Example: `/tiktok name @amazing_dancer`",
					inline: false,
				},
				{
					name: "🔗 Set TikTok Link",
					value:
						"• `/tiktok link YourURL` - Set your TikTok profile URL\n• Example: `/tiktok link https://tiktok.com/@cool.creator`",
					inline: false,
				},
				{
					name: "🧹 Clear Information",
					value: "• `/tiktok clear` - Remove all your TikTok information",
					inline: false,
				},
				{
					name: "📱 Additional Commands",
					value:
						"• `/socials` - View all your social media profiles\n• `/facebook` - Manage your Facebook profile\n• `/instagram` - Manage your Instagram profile",
					inline: false,
				},
				{
					name: "💡 Pro Tips",
					value:
						"🎵 Use your actual TikTok username\n🔗 Make sure your TikTok profile is public\n✨ Include the @ symbol or not - we'll handle it!\n🎯 Complete both username and link for full functionality\n🌟 Check `/socials` to see your complete social media hub\n🚀 Great for sharing your creative content!",
					inline: false,
				},
			])
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
			.setFooter({ text: "Ready to go viral with your amazing content? 🎵🚀" });

		const actionRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("tiktok_set_name")
				.setLabel("Set Username")
				.setEmoji("📝")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId("tiktok_set_link")
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
