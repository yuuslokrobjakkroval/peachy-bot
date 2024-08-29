const { Command } = require("../../structures");
const Race = require("../../schemas/race");

const emojiTurtle = '<a:TURTLE:1278531149295128619>';
const emojiRabbit = '<a:RABBIT:1278531138805301269>';
const emojiDog = '<a:DOG:1278536045989855303>';
const emojiChicken = '<a:CHICKEN:1278531100712632423>';
const emojiBlank = '<:BLANK:1278535124979552316>';
const emojiFinish = '<:FINISH:1278535134668259368>';

const emojiWinner = ['🐶', '🐰', '🐢', '🐥'];

class RaceGame extends Command {
    constructor(client) {
        super(client, {
            name: "race",
            description: {
                content: "Start a race between the rabbit, turtle, dog, and chicken!",
                examples: ["race"],
                usage: "race",
            },
            category: "game",
            aliases: ["race"],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx) {
        try {
            const userId = ctx.author.id;
            let race = await Race.findOne({ userId });

            if (race && race.isActive) {
                return ctx.sendMessage('You already have a race in progress!');
            }

            if (!race) {
                race = new Race({
                    userId,
                    rabbit: 0,
                    turtle: 0,
                    dog: 0,
                    chicken: 0,
                    isActive: true,
                });
            } else {
                race.isActive = true;
                race.rabbit = 0;
                race.turtle = 0;
                race.dog = 0;
                race.chicken = 0;
            }

            await race.save();

            const finishLine = 50; // Adjust to fit within message length limits
            let resultMessage = 'The race has started!\n';
            let raceMessage = await ctx.sendMessage(resultMessage);

            while (race.rabbit < finishLine && race.turtle < finishLine && race.dog < finishLine && race.chicken < finishLine) {
                const rabbitMove = Math.random() < 0.8 ? Math.floor(Math.random() * 4) + 1 : 0;
                const turtleMove = Math.floor(Math.random() * 10) + 1;
                const dogMove = Math.floor(Math.random() * 6) + 1;
                const chickenMove = Math.floor(Math.random() * 8) + 1;

                race.rabbit += rabbitMove;
                race.turtle += turtleMove;
                race.dog += dogMove;
                race.chicken += chickenMove;

                await race.save();

                // Ensure non-negative values
                const getProgress = (value) => Math.max(0, value);
                const getRemaining = (value) => Math.max(0, finishLine - value);

                // Create dynamic line for each animal
                const createProgressLine = (emoji, progress, finishLine) => {
                    const filledLength = Math.min(progress, finishLine);
                    const line = emoji.repeat(filledLength) + emojiBlank.repeat(finishLine - filledLength);
                    return line + emojiFinish;
                };

                // Build progress message
                let currentMessage = '';
                currentMessage += `Rabbit: ${createProgressLine(emojiRabbit, race.rabbit, finishLine)}\n`;
                currentMessage += `Turtle: ${createProgressLine(emojiTurtle, race.turtle, finishLine)}\n`;
                currentMessage += `Dog: ${createProgressLine(emojiDog, race.dog, finishLine)}\n`;
                currentMessage += `Chicken: ${createProgressLine(emojiChicken, race.chicken, finishLine)}\n`;

                // Edit the message with chunks if necessary
                const messageChunkSize = 1900; // Safe size to avoid hitting Discord's 4000 character limit
                let chunks = [];

                while (currentMessage.length > messageChunkSize) {
                    let splitIndex = currentMessage.lastIndexOf('\n', messageChunkSize);
                    if (splitIndex === -1) splitIndex = messageChunkSize;
                    chunks.push(currentMessage.substring(0, splitIndex));
                    currentMessage = currentMessage.substring(splitIndex).trim();
                }
                if (currentMessage.length > 0) {
                    chunks.push(currentMessage);
                }

                // Edit the message with chunks
                for (let i = 0; i < chunks.length; i++) {
                    await raceMessage.edit(chunks[i]);
                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before the next update
                    }
                }
            }

            // Determine random winner from animals who have crossed the finish line
            let winners = [];
            if (race.rabbit >= finishLine) {
                winners.push("Rabbit");
            }
            if (race.turtle >= finishLine) {
                winners.push("Turtle");
            }
            if (race.dog >= finishLine) {
                winners.push("Dog");
            }
            if (race.chicken >= finishLine) {
                winners.push("Chicken");
            }

            let winner = '';
            let winnerEmoji = '';

            if (winners.length > 0) {
                const randomWinner = winners[Math.floor(Math.random() * winners.length)];
                winner = `${randomWinner} wins!`;
                switch (randomWinner) {
                    case "Rabbit":
                        winnerEmoji = emojiWinner[1]; // 🐰
                        break;
                    case "Turtle":
                        winnerEmoji = emojiWinner[2]; // 🐢
                        break;
                    case "Dog":
                        winnerEmoji = emojiWinner[0]; // 🐶
                        break;
                    case "Chicken":
                        winnerEmoji = emojiWinner[3]; // 🐥
                        break;
                }
            } else {
                winner = "No winner!";
            }

            race.isActive = false;
            await race.save();

            resultMessage = `\n🏁 ${winnerEmoji} ${winner} `;
            await raceMessage.edit(resultMessage);
        } catch (error) {
            console.error("An error occurred while running the race command:", error);
            await ctx.sendMessage('An error occurred while running the race. Please try again later.');
        }
    }
}

module.exports = RaceGame;
