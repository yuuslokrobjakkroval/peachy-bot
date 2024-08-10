const { Command } = require("../../structures/index.js");
const Currency = require("../../schemas/currency.js");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { SLOTS, SPIN, COIN, TITLE } = require("../../utils/Emoji");

const maxBet = 250000;

class Slots extends Command {
	constructor(client) {
		super(client, {
			name: "slots",
			description: {
				content: "Bet your money in the slot machine! Earn up to 10x your money!",
				examples: ["slots 1000", "slots all"],
				usage: "SLOTS <amount>",
			},
			category: "gamble",
			aliases: ["slots", "slot", "s"],
			cooldown: 1,
			args: true,
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [
				{
					name: 'amount',
					description: 'The amount of money to bet',
					type: 'INTEGER',
					required: true,
				}
			],
		});
	}

	async run(client, ctx, args) {
		let amount = 0;
		let all = false;

		if (args.length === 0) amount = 1;
		else if (Number.isInteger(parseInt(args[0])) && args.length === 1) amount = parseInt(args[0]);
		else if (args.length === 1 && args[0] === 'all') all = true;
		else {
			return ctx.sendMessage({ content: ", Invalid arguments!! >:c", ephemeral: true });
		}

		if (amount === 0 && !all) {
			return ctx.sendMessage({ content: ", uwu.. you can't bet 0 silly!", ephemeral: true });
		} else if (amount < 0) {
			return ctx.sendMessage({ content: ", that... that's not how it works.", ephemeral: true });
		}

		let data = await Currency.findOne({ userId: ctx.author.id });

		if (!data) {
			data = await Currency.create({
				userId: ctx.author.id,
				balance: 500,
				bank: 0,
				bankSpace: 5000,
			});
		}

		if (all) {
			amount = Math.min(data.balance, 250000);
		}

		if (data.balance <= 0 || data.balance < amount) {
			return ctx.sendMessage({ content: '**🚫 | ' + ctx.author.globalName + "**, You don't have enough coin!", ephemeral: true });
		}

		if (amount > maxBet) amount = maxBet;

		let rand = (await random(1, 1000)) / 10;
		let win = 0;
		let rslots = [];

		function getUniqueSlots() {
			const slotsCopy = [...SLOTS];

			for (let i = slotsCopy.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[slotsCopy[i], slotsCopy[j]] = [slotsCopy[j], slotsCopy[i]];
			}

			return slotsCopy.slice(0, 3);
		}

		console.log(rand)
		if (rand <= 45) {
			win = amount;
			rslots = [SLOTS[0], SLOTS[0], SLOTS[0]];
		} else if (rand <= 40) {
			win = amount * 3;
			rslots = [SLOTS[2], SLOTS[2], SLOTS[2]];
		} else if (rand <= 46) {
			win = amount * 4;
			rslots = [SLOTS[3], SLOTS[3], SLOTS[3]];
		} else if (rand <= 47.5) {
			win = amount * 10;
			rslots = [SLOTS[4], SLOTS[4], SLOTS[4]];
		} else if (rand <= 65) {
			win = amount * 2;
			rslots = [SLOTS[1], SLOTS[1], SLOTS[1]];
		} else {
			win = 0;
			rslots = getUniqueSlots();
		}

		await Currency.updateOne({ userId: ctx.author.id }, { $inc: { balance: win - amount } });

		let winmsg = win === 0 ? `and lost \`${numeral(amount).format()}\`` : `and won \`${numeral(win).format()}\``;

		const spinContent = `${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE} \n` +
			`**\`[\` ${SPIN} ${SPIN} ${SPIN} \`]\`** ** ${ctx.author.globalName} ** \n` +
			`**\`|        |\` You bet \`${numeral(amount).format()}\` ${COIN}**\n` +
			`**\`|        |\`**`;

		const spinMessage = await ctx.sendMessage({ content: spinContent });

		setTimeout(async () => {
			const resultContent = `${TITLE} 𝐒𝐋𝐎𝐓𝐒 ${TITLE} \n` +
				`**\`[\` ${rslots[0]} ${rslots[1]} ${rslots[2]} \`]\`** ** ${ctx.author.globalName} ** \n` +
				`**\`|        |\` You bet \`${numeral(amount).format()}\` ${COIN}**\n` +
				`**\`|        |\` ${winmsg} ${COIN}**`;
			await spinMessage.edit({ content: resultContent });
		}, 1000);
	}
}

module.exports = Slots;
