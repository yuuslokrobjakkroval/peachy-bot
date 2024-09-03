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
        const numberToGuess = Math.floor(Math.random() * 100) + 1;
        const embed = client.embed()
            .setTitle('Guess the Number!')
            .setColor(client.color.main)
            .setDescription('I have picked a number between 1 and 100. React with the number you guess or type your guess in the chat!');

        const message = await ctx.sendMessage({ embeds: [embed] });

        const filter = response => {
            const guess = parseInt(response.content);
            return !isNaN(guess) && guess >= 1 && guess <= 100 && response.author.id === ctx.author.id;
        };

        const collector = ctx.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async response => {
            const guess = parseInt(response.content);
            let resultEmbed;

            if (guess === numberToGuess) {
                await Users.updateOne(
                    { userId: ctx.author.id },
                    { $inc: { 'profile.xp': 30 } }
                );
                resultEmbed = client.embed()
                    .setTitle(`${client.emoji.mainLeft} 𝐂𝐎𝐑𝐑𝐄𝐂𝐓 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                    .setColor(client.color.green)
                    .setDescription(`${client.emoji.congratulation} Congratulations! You guessed the number correctly: **${numberToGuess}**.\nYou've earned 30 XP.`);
            } else {
                resultEmbed = client.embed()
                    .setTitle(`${client.emoji.mainLeft} 𝐖𝐑𝐎𝐍𝐆 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                    .setColor(client.color.red)
                    .setDescription(`❌ Sorry, the correct number was: **${numberToGuess}**.`);
            }

            await ctx.editMessage({ embeds: [resultEmbed] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = client.embed()
                    .setTitle('Time is Up!')
                    .setColor(client.color.orange)
                    .setDescription('⏳ Time is up! You didn\'t guess the number in time.');
                ctx.editMessage({ embeds: [timeoutEmbed] });
            }
        });
    }
};
