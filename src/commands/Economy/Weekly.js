const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const chance = require("chance").Chance();
const moment = require("moment-timezone");
const globalGif = require("../../utils/Gif");

module.exports = class Weekly extends Command {
	constructor(client) {
		super(client, {
			name: "weekly",
			description: {
				content: "Earn some coins weekly.",
				examples: ["weekly"],
				usage: "weekly",
			},
			category: "economy",
			aliases: ["week"],
			cooldown: 3,
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
		const weeklyMessages = language.locales.get(language.defaultLocale)
			?.economyMessages?.weeklyMessages;

		try {
			// Get user data using client.utils
			const user = await client.utils.getUser(ctx.author.id);
			if (!user) {
				return client.utils.sendErrorMessage(
					client,
					ctx,
					generalMessages.userNotFound,
					color,
				);
			}

			const baseCoins = chance.integer({ min: 70000, max: 140000 });
			const baseExp = chance.integer({ min: 200, max: 250 });

			const verify = user.verification.verify.status === "verified";

			let bonusCoins = 0;
			let bonusExp = 0;

			if (verify) {
				bonusCoins = Math.floor(baseCoins * 0.3);
				bonusExp = Math.floor(baseExp * 0.3);
			}

			const totalCoins = baseCoins + bonusCoins;
			const totalExp = baseExp + bonusExp;

			const now = moment().tz("Asia/Bangkok");
			const nextWeekly = moment(now).add(1, "week").toDate();

			const timeUntilNextWeekly = nextWeekly - now.toDate();

			// Check cooldown
			const isCooldownExpired = await client.utils.checkCooldown(
				ctx.author.id,
				this.name.toLowerCase(),
				timeUntilNextWeekly,
			);
			if (!isCooldownExpired) {
				const lastCooldownTimestamp = await client.utils.getCooldown(
					ctx.author.id,
					this.name.toLowerCase(),
				);
				const remainingTime = Math.ceil(
					(lastCooldownTimestamp + timeUntilNextWeekly - Date.now()) / 1000,
				);
				const cooldownMessage = this.getCooldownMessage(
					remainingTime,
					client,
					language,
					weeklyMessages,
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

			// Update cooldown
			await client.utils.updateCooldown(
				ctx.author.id,
				this.name.toLowerCase(),
				timeUntilNextWeekly,
			);

			let bonusMessage = "";
			if (bonusCoins > 0 || bonusExp > 0) {
				bonusMessage = `\n**+30% Bonus**\n${emoji.coin}: **+${client.utils.formatNumber(bonusCoins)}** coins\n${emoji.exp} **+${client.utils.formatNumber(bonusExp)}** xp`;
			}

			const embed = this.createSuccessEmbed(
				client,
				ctx,
				emoji,
				totalCoins,
				totalExp,
				now,
				weeklyMessages,
				generalMessages,
				bonusMessage,
			);

			return ctx.sendMessage({ embeds: [embed] });
		} catch (error) {
			console.error("Error processing weekly command:", error);
			return client.utils.sendErrorMessage(
				client,
				ctx,
				weeklyMessages.error,
				color,
			);
		}
	}

	getCooldownMessage(remainingTime, client, language, weeklyMessages) {
		const days = Math.floor(remainingTime / 86400);
		const hours = Math.floor((remainingTime % 86400) / 3600);
		const minutes = Math.floor((remainingTime % 3600) / 60);
		const seconds = remainingTime % 60;

		const daysString = days > 1 ? `${days} days` : `${days} day`;
		const hoursString = hours > 1 ? `${hours} hrs` : `${hours} hr`;
		const minutesString = minutes > 1 ? `${minutes} mins` : `${minutes} min`;
		const secondsString = seconds > 1 ? `${seconds} secs` : `${seconds} sec`;

		if (days > 1) {
			return weeklyMessages.cooldown.multipleDays
				.replace("%{days}", daysString)
				.replace("%{hours}", hoursString)
				.replace("%{minutes}", minutesString)
				.replace("%{seconds}", secondsString);
		} else if (days === 1) {
			return weeklyMessages.cooldown.singleDay
				.replace("%{days}", daysString)
				.replace("%{hours}", hoursString)
				.replace("%{minutes}", minutesString)
				.replace("%{seconds}", secondsString);
		} else {
			return weeklyMessages.cooldown.noDays
				.replace("%{hours}", hoursString)
				.replace("%{minutes}", minutesString)
				.replace("%{seconds}", secondsString);
		}
	}

	createSuccessEmbed(
		client,
		ctx,
		emoji,
		totalCoins,
		totalExp,
		now,
		weeklyMessages,
		generalMessages,
		bonusMessage,
	) {
		return client
			.embed()
			.setColor(client.config.color.main)
			.setThumbnail(
				client.utils.emojiToImage(
					`${now.hour() >= 6 && now.hour() < 18 ? emoji.time.day : emoji.time.night}`,
				),
			)
			.setDescription(
				generalMessages.title
					.replace("%{mainLeft}", emoji.mainLeft)
					.replace("%{title}", "WEEKLY")
					.replace("%{mainRight}", emoji.mainRight) +
					weeklyMessages.success
						.replace("%{coin}", client.utils.formatNumber(totalCoins))
						.replace("%{coinEmote}", emoji.coin)
						.replace("%{expEmote}", emoji.exp)
						.replace("%{exp}", client.utils.formatNumber(totalExp))
						.replace("%{bonusMessage}", bonusMessage),
			)
			.setImage(globalGif.banner.weeklyReminder)
			.setFooter({
				text:
					generalMessages.requestedBy.replace(
						"%{username}",
						ctx.author.displayName,
					) || `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			});
	}
};
