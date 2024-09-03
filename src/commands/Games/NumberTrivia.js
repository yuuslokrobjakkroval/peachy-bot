const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const questions = require('../../assets/json/numberTriviaQuestions.json');

module.exports = class NumberTrivia extends Command {
    constructor(client) {
        super(client, {
            name: 'numbertrivia',
            description: {
                content: 'Play a number trivia game.',
                examples: ['numbertrivia'],
                usage: 'numbertrivia',
            },
            category: 'games',
            aliases: ['nt'],
            cooldown: 5,
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
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        const emojiOptions = [
            client.emoji.number.one,
            client.emoji.number.two,
            client.emoji.number.three,
            client.emoji.number.four
        ];
        const emojiMap = {
            '1': emojiOptions[0]?.name || emojiOptions[0],
            '2': emojiOptions[1]?.name || emojiOptions[1],
            '3': emojiOptions[2]?.name || emojiOptions[2],
            '4': emojiOptions[3]?.name || emojiOptions[3],
        };

        const embed = client.embed()
            .setTitle('Number Trivia Game')
            .setColor(client.color.main)
            .setDescription(randomQuestion.question)
            .addFields(randomQuestion.options.map((option, index) => ({
                name: `${emojiOptions[index]} Option ${index + 1}`,
                value: option,
                inline: false,
            })))
            .setFooter({ text: 'Please react with the corresponding emoji for your answer.' });

        const message = await ctx.sendMessage({ embeds: [embed] });

        for (const emoji of emojiOptions) {
            await message.react(emoji);
        }

        const filter = (reaction, user) => {
            const reactionEmoji = reaction.emoji.toString();
            const validReactions = Object.values(emojiMap);
            return validReactions.includes(reactionEmoji) && user.id === ctx.author.id;
        };

        const collector = message.createReactionCollector({ filter, time: 5000, max: 1 });

        collector.on('collect', async (reaction) => {
            const reactionEmoji = reaction.emoji.toString();
            const answerIndex = Object.keys(emojiMap).findIndex(key => emojiMap[key] === reactionEmoji);
            const selectedAnswer = randomQuestion.options[answerIndex];
            const correctAnswer = randomQuestion.answer;
            try {
                if (selectedAnswer === correctAnswer) {
                    await Users.updateOne(
                        { userId: ctx.author.id },
                        { $inc: { 'profile.xp': 30 } }
                    );
                    const correctEmbed = client.embed()
                        .setTitle(`${client.emoji.mainLeft} 𝐂𝐎𝐑𝐑𝐄𝐂𝐓 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                        .setColor(client.color.green)
                        .setDescription(`${client.emoji.congratulation} You got it right! The correct answer was: **${correctAnswer}**.\nYou've earned 30 XP.`);
                    await ctx.editMessage({ embeds: [correctEmbed] });
                } else {
                    const wrongEmbed = client.embed()
                        .setTitle(`${client.emoji.mainLeft} 𝐖𝐑𝐎𝐍𝐆 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                        .setColor(client.color.red)
                        .setDescription(`❌ Sorry, that's not correct. The correct answer was: **${correctAnswer}**.`);
                    await ctx.editMessage({ embeds: [wrongEmbed] });
                }
                await message.reactions.removeAll();
            } catch (error) {
                console.error('Failed to remove all reactions:', error);
            }
        });

        collector.on('end', async (collected) => {
            try {
                if (collected.size === 0) {
                    const timeoutEmbed = client.embed()
                        .setTitle('Time is Up!')
                        .setColor(client.color.orange)
                        .setDescription('⏳ Time is up! No answer was provided.');
                    await ctx.editMessage({ embeds: [timeoutEmbed], components: [] });
                }
                await message.reactions.removeAll();
            } catch (error) {
                console.error('Failed to remove all reactions:', error);
            }
        });
    }
};
