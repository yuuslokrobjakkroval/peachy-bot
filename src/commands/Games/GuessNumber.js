const { Command } = require('../../structures');
const Users = require('../../schemas/user');

module.exports = class GuessNumber extends Command {
    constructor(client) {
        super(client, {
            name: 'guessnumber',
            description: {
                content: 'Guess the number game. Try to guess the number between 1 and 100.',
                examples: ['guessnumber'],
                usage: 'guessnumber',
            },
            category: 'games',
            aliases: ['gn'],
            cooldown: 10,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx) {
        const user = await Users.findOne({ userId: ctx.author.id });

        // Check if the user has enough coins
        if (user.balance.coin < 1000) {
            return ctx.sendMessage({
                embeds: [
                    client.embed()
                        .setTitle('Insufficient Balance')
                        .setColor(client.color.red)
                        .setDescription(`You need at least 1000 coins to play the Guess the Number game. Your current balance is ${user.balance.coin} coins.`)
                ]
            });
        }

        // Deduct 1000 coins from the user's balance
        user.balance.coin -= 1000;
        await user.save();

        const numberToGuess = Math.floor(Math.random() * 100) + 1;
        let hearts = 3;
        let incorrectGuesses = 0;

        const embed = client.embed()
            .setTitle(`${client.emoji.mainLeft} 𝐆𝐔𝐄𝐒𝐒 𝐓𝐇𝐄 𝐍𝐔𝐌𝐁𝐄𝐑! ${client.emoji.mainRight}`)
            .setColor(client.color.main)
            .setDescription('I have picked a number between 1 and 100. You have 3 hearts. React with the number you guess or type your guess in the chat!');

        const message = await ctx.sendMessage({ embeds: [embed] });

        const filter = response => {
            const guess = parseInt(response.content);
            return !isNaN(guess) && guess >= 1 && guess <= 100 && response.author.id === ctx.author.id;
        };

        const collector = ctx.channel.createMessageCollector({ filter, time: 30000 }); // 30 seconds to guess

        collector.on('collect', async response => {
            const guess = parseInt(response.content);

            if (guess === numberToGuess) {
                await Users.updateOne(
                    { userId: ctx.author.id },
                    { $inc: { 'profile.xp': 30 } }
                );
                const resultEmbed = client.embed()
                    .setTitle(`${client.emoji.mainLeft} 𝐂𝐎𝐑𝐑𝐄𝐂𝐓 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                    .setColor(client.color.green)
                    .setDescription(`${client.emoji.congratulation} Congratulations! You guessed the number correctly: **${numberToGuess}**.\nYou've earned 30 XP.`);

                await ctx.editMessage({ embeds: [resultEmbed] });
                collector.stop();
            } else {
                hearts -= 1;
                incorrectGuesses += 1;
                let resultEmbed;

                if (hearts > 0) {
                    let hint = '';
                    if (incorrectGuesses === 2) {
                        const minRange = Math.max(0, numberToGuess - 10);
                        const maxRange = Math.min(100, numberToGuess + 10);
                        hint = `Here's a hint: The number is between **${minRange}** and **${maxRange}**.`;
                    }

                    resultEmbed = client.embed()
                        .setTitle(`${client.emoji.mainLeft} 𝐖𝐑𝐎𝐍𝐆 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                        .setColor(client.color.red)
                        .setDescription(`❌ Incorrect! You have **${hearts}** hearts left. ${hint}`);

                    await ctx.sendMessage({ embeds: [resultEmbed] });
                } else {
                    resultEmbed = client.embed()
                        .setTitle(`${client.emoji.mainLeft} 𝐆𝐀𝐌𝐄 𝐎𝐕𝐄𝐑! ${client.emoji.mainRight}`)
                        .setColor(client.color.red)
                        .setDescription(`💔 You've run out of hearts! The correct number was **${numberToGuess}**.`);

                    await ctx.editMessage({ embeds: [resultEmbed] });
                    collector.stop();
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = client.embed()
                    .setTitle(`${client.emoji.mainLeft} 𝐓𝐈𝐌𝐄 𝐈𝐒 𝐔𝐏! ${client.emoji.mainRight}`)
                    .setColor(client.color.orange)
                    .setDescription('⏳ Time is up! You didn\'t guess the number in time.');
                ctx.editMessage({ embeds: [timeoutEmbed] });
            }
        });
    }
};
