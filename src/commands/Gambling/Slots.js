const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");

const maxAmount = 250000;

module.exports = class Slots extends Command {
	constructor(client) {
		super(client, {
			name: 'slots',
			description: {
				content: 'Bet your money in the slot machine! Earn up to 10x your money.',
				examples: ['slots 100'],
				usage: 'slots <baseCoins>',
			},
			category: 'gambling',
			aliases: ['slot', 's'],
			cooldown: 6,
			args: false,
			permissions: {
				dev: false,
				client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
				user: [],
			},
			slashCommand: true,
			options: [
				{
					name: 'amount',
					description: 'The baseCoins you want to bet.',
					type: 10,
					required: true,
				},
			],
		});
	}

	async run(client, ctx, args, language) {
		const slots = [client.emoji.slots.threeBug, client.emoji.slots.bob, client.emoji.slots.jack, client.emoji.slots.olivia, client.emoji.slots.oggy]
		const user = await Users.findOne({ userId: ctx.author.id }).exec();
		const { coin, bank } = user.balance;
		if (coin < 1) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'zero_balance'));

		let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
		if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
			const amountMap = { all: coin, half: Math.ceil(coin / 2) };
			if (amount in amountMap) amount = amountMap[amount];
			else {
				return await ctx.sendMessage({
					embeds: [
						client.embed().setColor(client.color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
					],
				});
			}
		}

		const baseCoins = parseInt(Math.min(amount, coin, maxAmount));
		await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': coin - baseCoins, 'balance.bank': bank } }).exec();

		// ===================================== > Decide Results < ===================================== \\
		let rslots = [];
		let rand = (await random(1, 1000)) / 10;
		let win = 0;
		if (rand <= 21) { // 21%
			win = baseCoins;
			rslots.push(slots[0]);
			rslots.push(slots[0]);
			rslots.push(slots[0]);
		} else if (rand <= 34) { // 13%
			win = baseCoins * 2;
			rslots.push(slots[1]);
			rslots.push(slots[1]);
			rslots.push(slots[1]);
		} else if (rand <= 41.5) { // 7.5%
			win = baseCoins * 3;
			rslots.push(slots[2]);
			rslots.push(slots[2]);
			rslots.push(slots[2]);
		} else if (rand <= 43.75) { // 2.75%
			win = baseCoins * 4;
			rslots.push(slots[3]);
			rslots.push(slots[3]);
			rslots.push(slots[3]);
		} else if (rand <= 45.25) { // 1.5%
			win = baseCoins * 10;
			rslots.push(slots[4]);
			rslots.push(slots[4]);
			rslots.push(slots[4]);
		} else { // 54.75%
			let slot1 = Math.floor(Math.random() * slots.length);
			let slot2 = Math.floor(Math.random() * slots.length);
			let slot3 = Math.floor(Math.random() * slots.length);
			if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (slots.length - 1))) % slots.length;
			if (slot3 === slot1 || slot3 === slot2) slot3 = (slot2 + Math.ceil(Math.random() * (slots.length - 1))) % slots.length;
			rslots = [slots[slot1], slots[slot2], slots[slot3]];
		}

		let newBalance = coin + win - baseCoins;

		const initialEmbed = client.embed()
			.setColor(client.color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(
				`### ${client.emoji.mainLeft} **𝐎𝐆𝐆𝐘 𝐒𝐋𝐎𝐓𝐒** ${client.emoji.mainRight}\n## **\`|\` ${client.emoji.slots.spin} ${client.emoji.slots.spin} ${client.emoji.slots.spin} **\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}**\n`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			})

		await ctx.sendMessage({ embeds: [initialEmbed] });

		const spinEmbed = client.embed()
			.setColor(client.color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`### ${client.emoji.mainLeft} **𝐎𝐆𝐆𝐘 𝐒𝐋𝐎𝐓𝐒** ${client.emoji.mainRight}\n## **\`|\` ${rslots[0]} ${client.emoji.slots.spin} ${client.emoji.slots.spin} **\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}** \n`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			})

		const spinSecondEmbed = client.embed()
			.setColor(client.color.main)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`### ${client.emoji.mainLeft} **𝐎𝐆𝐆𝐘 𝐒𝐋𝐎𝐓𝐒** ${client.emoji.mainRight}\n## **\`|\` ${rslots[0]} ${client.emoji.slots.spin} ${rslots[2]} **\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}**\n`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			})

		const resultEmbed = client.embed()
			.setColor(win === 0 ? client.color.danger : client.color.primary)
			.setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setDescription(`### ${client.emoji.mainLeft} **𝐎𝐆𝐆𝐘 𝐒𝐋𝐎𝐓𝐒** ${client.emoji.mainRight}\n## **\`|\` ${rslots[0]} ${rslots[1]} ${rslots[2]} **\n**\nYou bet \`${numeral(baseCoins).format()}\` ${client.emoji.coin}**\n**${win === 0 ? `and lost \`${numeral(baseCoins).format()}\`` : `and won \`${numeral(win).format()}\``} ${client.emoji.coin}**`)
			.setFooter({
				text: `Requested by ${ctx.author.displayName}`,
				iconURL: ctx.author.displayAvatarURL(),
			})

		setTimeout(async function () {
			await ctx.editMessage({ embeds: [spinEmbed] });
			setTimeout(async function () {
				await ctx.editMessage({embeds: [spinSecondEmbed]});
				setTimeout(async function () {
					await ctx.editMessage({embeds: [resultEmbed]});
				}, 1000);
			}, 700);
		}, 1000);

		await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec();
	}
}
