const { Command } = require("../../structures/index.js");
const { AttachmentBuilder } = require("discord.js");
const { generatePartnerCanvas } = require("../../utils/GenerateImages.js");

function chunkArray(arr, size) {
	const result = [];
	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
}

module.exports = class ViewRelationship extends Command {
	constructor(client) {
		super(client, {
			name: "viewrelationship",
			description: {
				content: "View your relationships or someone else's.",
				examples: ["viewrelationship", "viewrelationship bestie @user"],
				usage: "viewrelationship [type] [@user]",
			},
			category: "relationship",
			aliases: ["vr", "relationshipinfo"],
			cooldown: 5,
			args: false,
			slashCommand: true,
			options: [
				{
					name: "type",
					description: "Type of relationship to show",
					type: 3,
					required: false,
					choices: [
						{ name: "All", value: "all" },
						{ name: "Partner", value: "partner" },
						{ name: "Bestie", value: "bestie" },
						{ name: "Brother", value: "brother" },
						{ name: "Sister", value: "sister" },
					],
				},
				{
					name: "user",
					description: "User to view (optional)",
					type: 6,
					required: false,
				},
			],
		});
	}

	async run(client, ctx, args, color) {
		const type = ctx.isInteraction
			? ctx.interaction.options.getString("type") || "all"
			: args[0]?.toLowerCase() || "all";

		const target = ctx.isInteraction
			? ctx.interaction.options.getUser("user") || ctx.author
			: ctx.message.mentions.users.first() || ctx.author;

		const user = await client.utils.getUser(target.id);
		if (!user) {
			return client.utils.sendErrorMessage(
				client,
				ctx,
				`${target.username} is not registered.`,
				color.main,
			);
		}

		const rel = user.relationship || {};

		// === PARTNER VIEW ===
		if (type === "partner") {
			if (!rel.partner?.userId) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					`${target.username} does not have a partner yet.`,
					color.main,
				);
			}

			// Show loading embed like Level.js
			const loadingEmbed = client
				.embed()
				.setColor(color.main)
				.setDescription(
					`# 💕 RELATIONSHIP CARD 💕
    
Creating a stunning premium relationship card just for you! ✨
Please wait a moment while we craft your personalized love story display...`,
				)
				.setImage("https://i.imgur.com/UCsKa6Z.gif");

			let loadingMessage;
			if (ctx.isInteraction) {
				await ctx.interaction.deferReply();
				loadingMessage = await ctx.interaction.followUp({
					embeds: [loadingEmbed],
				});
			} else {
				loadingMessage = await ctx.sendMessage({
					embeds: [loadingEmbed],
				});
			}

			const canvas = await generatePartnerCanvas(client, user, target);
			if (!canvas) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					`Could not generate partner image.`,
					color.main,
				);
			}

			const fileName = `${target.username}_partner.png`;
			const attachment = new AttachmentBuilder(canvas, {
				name: fileName,
			});

			const embed = client
				.embed()
				.setColor(color.main)
				.setAuthor({
					name: `${target.username}'s Partner`,
					iconURL: target.displayAvatarURL(),
				})
				.setDescription(
					`💍 Partner of <@${target.id}>:\n<@${
						rel.partner.userId
					}> (Since <t:${Math.floor(
						new Date(rel.partner.date).getTime() / 1000,
					)}:d>)`,
				)
				.setImage(`attachment://${fileName}`)
				.setFooter({ text: "Use /relationship to manage them." });

			// Update the loading message with the final result
			if (ctx.isInteraction) {
				return await ctx.interaction.editReply({
					content: "",
					embeds: [embed],
					files: [attachment],
				});
			} else {
				return await loadingMessage.edit({
					content: "",
					embeds: [embed],
					files: [attachment],
				});
			}
		}

		// === BESTIE/BROTHER/SISTER PAGINATED ===
		if (["bestie", "brother", "sister"].includes(type)) {
			const list = rel[`${type}s`] || [];

			if (!list.length) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					`${target.username} does not have any ${type}s.`,
					color.main,
				);
			}

			const chunks = chunkArray(list, 10);
			const embeds = chunks.map((chunk, i) =>
				client
					.embed()
					.setColor(color.main)
					.setAuthor({
						name: `${target.username}'s ${type.charAt(0).toUpperCase() + type.slice(1)}s`,
						iconURL: target.displayAvatarURL(),
					})
					.setFooter({ text: `Page ${i + 1}/${chunks.length}` })
					.setDescription(
						chunk
							.map(
								(r, idx) =>
									`**${idx + 1}.** <@${r.userId}> — Since: <t:${Math.floor(
										new Date(r.date).getTime() / 1000,
									)}:d>`,
							)
							.join("\n\n"),
					),
			);

			return client.util.paginate(ctx, embeds);
		}

		// === "ALL" RELATIONSHIPS ===
		const formatOne = (r) =>
			`• <@${r.userId}> \n  — Since: <t:${Math.floor(new Date(r.date).getTime() / 1000)}:d>`;

		const formatList = (list) =>
			list?.length ? list.map((r) => formatOne(r)).join("\n\n") : "None";

		const embed = client
			.embed()
			.setColor(color.main)
			.setAuthor({
				name: `${target.username}'s Relationships`,
				iconURL: target.displayAvatarURL(),
			})
			.addFields(
				{
					name: "💍 Partner",
					value: rel.partner?.userId ? formatOne(rel.partner) : "None",
				},
				{
					name: "💖 Besties",
					value: formatList(rel.besties || []),
				},
				{
					name: "👬 Brothers",
					value: formatList(rel.brothers || []),
				},
				{
					name: "👭 Sisters",
					value: formatList(rel.sisters || []),
				},
			)
			.setFooter({ text: "Use /relationship to manage them." });

		return ctx.sendMessage({ embeds: [embed] });
	}
};
