const { Command } = require("../../structures");
const { PermissionsBitField } = require("discord.js");
const linkSchema = require("../../schemas/antiLink");
const globalEmoji = require("../../utils/Emoji");

module.exports = class AntiLink extends Command {
	constructor(client) {
		super(client, {
			name: "anti-link",
			description: {
				content: "Setup and manage the anti-link system for your server.",
				examples: [
					"/anti-link setup permissions:Administrator",
					"/anti-link disable",
				],
				usage: "/anti-link <setup|disable|check|edit>",
			},
			category: "developer",
			aliases: ["al"],
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel"],
				user: ["Administrator"],
			},
			slashCommand: true,
			options: [
				{
					name: "setup",
					description: "Set up the anti-link system to delete all links!",
					type: 1, // Subcommand
					options: [
						{
							name: "permissions",
							description:
								"Choose the permissions who BYPASS the anti-link system.",
							type: 3, // String type for choice selection
							required: true,
							choices: [
								{ name: "Manage Channels", value: "ManageChannels" },
								{ name: "Manage Server", value: "ManageGuild" },
								{ name: "Embed Links", value: "EmbedLinks" },
								{ name: "Attach Files", value: "AttachFiles" },
								{ name: "Manage Messages", value: "ManageMessages" },
								{ name: "Administrator", value: "Administrator" },
							],
						},
					],
				},
				{
					name: "disable",
					description: "Disable the anti-link system.",
					type: 1, // Subcommand
				},
				{
					name: "check",
					description: "Check the status of the anti-link system.",
					type: 1, // Subcommand
				},
				{
					name: "edit",
					description: "Edit your anti-link bypass permissions.",
					type: 1, // Subcommand
					options: [
						{
							name: "permissions",
							description:
								"Choose the permissions who BYPASS the anti-link system.",
							type: 3, // String type for choice selection
							required: true,
							choices: [
								{ name: "Manage Channels", value: "ManageChannels" },
								{ name: "Manage Server", value: "ManageGuild" },
								{ name: "Embed Links", value: "EmbedLinks" },
								{ name: "Attach Files", value: "AttachFiles" },
								{ name: "Manage Messages", value: "ManageMessages" },
								{ name: "Administrator", value: "Administrator" },
							],
						},
					],
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;

		if (ctx.isInteraction) {
			await ctx.interaction.reply(
				generalMessages.search.replace("%{loading}", globalEmoji.searching),
			);
		} else {
			await ctx.sendDeferMessage(
				generalMessages.search.replace("%{loading}", globalEmoji.searching),
			);
		}

		const { interaction } = ctx;
		const options = interaction.options;

		if (!options) {
			return await this.reply(ctx, "Command options not found.", {
				flags: 64,
			});
		}

		const sub = options.getSubcommand();
		const member = interaction.member;

		if (
			!interaction.guild ||
			!member ||
			!member.permissions.has(PermissionsBitField.Flags.Administrator)
		) {
			return await this.reply(
				ctx,
				"You must have ADMINISTRATOR perms to use this command in a guild.",
				{ flags: 64 },
			);
		}

		switch (sub) {
			case "setup": {
				const permissions = options.getString("permissions");
				if (!permissions) {
					return await this.reply(ctx, "Please select a permission.", {
						flags: 64,
					});
				}

				const data = await linkSchema.findOne({ guild: interaction.guild.id });

				if (data) {
					return await this.reply(
						ctx,
						"You already have the anti-link system setup.",
					);
				}

				await linkSchema.create({
					guild: interaction.guild.id,
					perms: permissions,
				});

				const embed = client
					.embed()
					.setColor(color?.main || "#00c7fe") // Fallback color
					.setDescription(
						`Successfully setup anti-link system with permissions **${permissions}**`,
					);

				return await this.reply(ctx, { embeds: [embed] });
			}

			case "disable": {
				await linkSchema.deleteMany({ guild: interaction.guild.id });

				const embed2 = client
					.embed()
					.setColor(color?.success || "#00c7fe") // Fallback color
					.setDescription(`Successfully disabled the anti-link system.`);

				return await this.reply(ctx, { embeds: [embed2] });
			}

			case "check": {
				const dataCheck = await linkSchema.findOne({
					guild: interaction.guild.id,
				});

				if (!dataCheck) {
					return await this.reply(ctx, "There is no anti-link system setup");
				}

				const perms = dataCheck.perms;
				if (!perms) {
					return await this.reply(ctx, "There is no anti-link system setup");
				}

				return await this.reply(ctx, {
					content: `Your anti-link system is currently setup with permissions **${perms}**`,
					flags: 64,
				});
			}

			case "edit": {
				const dataEdit = await linkSchema.findOne({
					guild: interaction.guild.id,
				});
				const newPermissions = options.getString("permissions");

				if (!dataEdit) {
					return await this.reply(
						ctx,
						"There is no anti-link system set up here.",
						{ flags: 64 },
					);
				}

				if (!newPermissions) {
					return await this.reply(ctx, "Please select a new permission.", {
						flags: 64,
					});
				}

				await linkSchema.deleteMany({ guild: interaction.guild.id });
				await linkSchema.create({
					guild: interaction.guild.id,
					perms: newPermissions,
				});

				const embed3 = client
					.embed()
					.setColor(color?.success || "#00c7fe") // Fallback color
					.setDescription(
						`Your anti-link BYPASS permissions has now been set to ${newPermissions}`,
					);

				return await this.reply(ctx, { embeds: [embed3] });
			}
		}
	}

	async reply(ctx, content, options = {}) {
		if (ctx.isInteraction) {
			// If content is an object (e.g., { embeds: [...] }), spread it directly
			if (typeof content === "object" && content !== null) {
				await ctx.interaction.editReply({
					...content,
					...(options.flags ? { flags: options.flags } : {}),
				});
			} else {
				await ctx.interaction.editReply({
					content,
					...(options.flags ? { flags: options.flags } : {}),
				});
			}
		} else {
			if (typeof content === "object" && content !== null) {
				await ctx.editMessage({ ...content, ...options });
			} else {
				await ctx.editMessage({ content, ...options });
			}
		}
	}
};
