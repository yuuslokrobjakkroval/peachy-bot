const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const chance = require("chance").Chance();
const moment = require("moment-timezone");
const globalGif = require("../../utils/Gif");

module.exports = class Daily extends Command {
	constructor(client) {
		super(client, {
			name: "daily",
			description: {
				content: "Earn some coins daily.",
				examples: ["daily"],
				usage: "daily",
			},
			category: "economy",
			aliases: ["daily"],
			cooldown: 5,
			args: false,
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;
		const dailyMessages = language.locales.get(language.defaultLocale)
			?.economyMessages?.dailyMessages;

		try {
			const user = await client.utils.getUser(ctx.author.id);
			if (!user) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					generalMessages.userNotFound,
					color,
				);
			}

			// Lowered daily coin reward range
			const baseCoins = chance.integer({ min: 10000, max: 20000 });
			const baseExp = chance.integer({ min: 100, max: 150 });

			let bonusCoins = 0;
			let bonusExp = 0;

			const verify = user.verification.verify.status === "verified";
			if (verify) {
				bonusCoins = Math.floor(baseCoins * 0.4);
				bonusExp = Math.floor(baseExp * 0.4);
			}

			const totalCoins = baseCoins + bonusCoins;
			const totalExp = baseExp + bonusExp;

			const now = moment().tz("Asia/Bangkok");
			const hours = now.hour();
			let nextDate = moment().tz("Asia/Bangkok");
			if (
				now.isAfter(moment().tz("Asia/Bangkok").hour(17).minute(0).second(0))
			) {
				nextDate = moment().tz("Asia/Bangkok").add(1, "days");
			}
			const next5PM = nextDate.set({
				hour: 17,
				minute: 0,
				second: 0,
				millisecond: 0,
			});
			const timeUntilNext5PM = moment.duration(next5PM.diff(now));

			const isCooldownExpired = await client.utils.checkCooldown(
				ctx.author.id,
				this.name.toLowerCase(),
				timeUntilNext5PM,
			);
			if (!isCooldownExpired) {
				const duration = moment.duration(next5PM.diff(now));
				const cooldownMessage = dailyMessages.cooldown.replace(
					"%{time}",
					`${Math.floor(duration.asHours())}hrs, ${
						Math.floor(duration.asMinutes()) % 60
					}mins, and ${Math.floor(duration.asSeconds()) % 60}secs`,
				);
				const cooldownEmbed = client
					.embed()
					.setColor(color.danger)
					.setDescription(cooldownMessage);
				return ctx.sendMessage({ embeds: [cooldownEmbed] });
			}

			// Safe incremental update - prevents overflow issues
			await Users.updateOne(
				{ userId: user.userId },
				{
					$inc: {
						"balance.coin": totalCoins,
						"profile.xp": totalExp,
					},
				},
			);

			await client.utils.updateCooldown(
				ctx.author.id,
				this.name.toLowerCase(),
				timeUntilNext5PM,
			);

			let bonusMessage = "";
			if (bonusCoins > 0 || bonusExp > 0) {
				bonusMessage = `\n**+40% Bonus**\n${
					emoji.coin
				}: **+${client.utils.formatNumber(bonusCoins)}** coins\n${
					emoji.exp
				} **+${client.utils.formatNumber(bonusExp)}** xp`;
			}

			const embed = client
				.embed()
				.setColor(color.main)
				.setThumbnail(
					client.utils.emojiToImage(
						hours >= 6 && hours < 18 ? emoji.time.day : emoji.time.night,
					),
				)
				.setDescription(
					generalMessages.title
						.replace("%{mainLeft}", emoji.mainLeft)
						.replace("%{title}", "DAILY")
						.replace("%{mainRight}", emoji.mainRight) +
						dailyMessages.success
							.replace("%{mainLeft}", emoji.mainLeft)
							.replace("%{mainRight}", emoji.mainRight)
							.replace("%{coinEmote}", emoji.coin)
							.replace("%{coin}", client.utils.formatNumber(baseCoins))
							.replace("%{expEmote}", emoji.exp)
							.replace("%{exp}", client.utils.formatNumber(baseExp))
							.replace("%{bonusMessage}", bonusMessage),
				)
				.setImage(globalGif.banner.dailyReminder)
				.setFooter({
					text:
						generalMessages.requestedBy.replace(
							"%{username}",
							ctx.author.displayName,
						) || `Requested by ${ctx.author.displayName}`,
					iconURL: ctx.author.displayAvatarURL(),
				});

			await ctx.sendMessage({ embeds: [embed] });

			// Check achievements
			if (client.achievementManager) {
				if (user.peachy && user.peachy.streak >= 7) {
					await client.achievementManager.awardAchievement(
						ctx.author.id,
						"daily_devotion",
						ctx,
					);
				}

				// Also run a general achievement check
				await client.achievementManager.checkAchievements(ctx.author.id, ctx);
			}
		} catch (error) {
			console.error("Error processing daily command:", error);
			return client.utils.sendErrorMessage(
				client,
				ctx,
				generalMessages.userFetchError,
				color,
			);
		}
	}
};
