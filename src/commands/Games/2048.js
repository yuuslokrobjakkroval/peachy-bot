const { Command } = require("../../structures");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

const activeGames = new Map();

GlobalFonts.registerFromPath(
    "./src/data/fonts/Kelvinch-Bold.otf",
    "Kelvinch-Bold"
);

emojis = {
    up: "⬆️",
    down: "⬇️",
    left: "⬅️",
    right: "➡️",
};

const WIDTH = 4;
const HEIGHT = 4;

module.exports = class TwoZeroFourEight extends Command {
    constructor(client) {
        super(client, {
            name: "2048",
            description: {
                content: "𝑷𝒍𝒂𝒚 𝒂 𝒈𝒂𝒎𝒆 𝒐𝒇 2048",
                examples: ["2048"],
                usage: "2048",
            },
            category: "games",
            aliases: [""],
            cooldown: 10,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks", "AddReactions"],
                user: [],
            },
            slashCommand: true,
            options: [],
        });

        this.board = [];
        this.mergedPos = [];
        this.score = 0;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                this.board[y * WIDTH + x] = 0;
            }
        }
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        if (activeGames.has(ctx.author.id)) {
            return ctx.sendMessage("❌ 𝒀𝒐𝒖 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒉𝒂𝒗𝒆 𝒂𝒏 𝒐𝒏𝒈𝒐𝒊𝒏𝒈 𝒈𝒂𝒎𝒆! 𝑭𝒊𝒏𝒊𝒔𝒉 𝒊𝒕 𝒃𝒆𝒇𝒐𝒓𝒆 𝒔𝒕𝒂𝒓𝒕𝒊𝒏𝒈 𝒂 𝒏𝒆𝒘 𝒐𝒏𝒆.");
        }

        const gameInstance = new TwoZeroFourEight(client);
        activeGames.set(ctx.author.id, gameInstance);
        gameInstance.score = 0;
        gameInstance.placeNewRandomTile();
        const attachment = await gameInstance.getImage();

        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace("%{mainLeft}", emoji.mainLeft)
                    .replace("%{title}", "2048")
                    .replace("%{mainRight}", emoji.mainRight)
            )
            .setImage("attachment://board.png")
            .setFooter({
                text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        const up = client.utils.emojiButton("up", emojis.up, 2);
        const left = client.utils.emojiButton("left", emojis.left, 2);
        const down = client.utils.emojiButton("down", emojis.down, 2);
        const right = client.utils.emojiButton("right", emojis.right, 2);
        const stop = client.utils.emojiButton("stop", "⛔", 4); // Red button

        const dis1 = client.utils.labelButton("dis1", '\u200b', 2, true);
        const dis2 = client.utils.labelButton("dis2", '\u200b', 2, true);

        const row1 = client.utils.createButtonRow(dis1, up, dis2, stop)
        const row2 = client.utils.createButtonRow(left, down, right)

        const msg = await ctx.channel.send({
            embeds: [embed],
            components: [row1, row2],
            files: [attachment],
        });
        const filter = (int) => int.user.id === ctx.author.id;
        const collector = msg.createMessageComponentCollector({ filter });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== ctx.author.id) {
                return interaction.reply({
                    content: 'You are not allowed to use buttons for this message!',
                    flags: true
                });
            }

            await interaction.deferUpdate().catch(console.error); // Defer first

            if (interaction.customId === 'stop') {
                collector.stop('stopped'); // Stop game manually
                return gameInstance.gameOver(client, ctx, msg, color, emoji, generalMessages);
            }

            try {
                let moved = false;
                gameInstance.mergedPos = [];
                if (interaction.customId === 'up') {
                    moved = gameInstance.shiftUp();
                } else if (interaction.customId === 'left') {
                    moved = gameInstance.shiftLeft();
                } else if (interaction.customId === 'down') {
                    moved = gameInstance.shiftDown();
                } else if (interaction.customId === 'right') {
                    moved = gameInstance.shiftRight();
                }

                if (moved) gameInstance.placeNewRandomTile();

                if (gameInstance.isBoardFull() && gameInstance.possibleMoves() === 0) {
                    collector.stop();
                    return gameInstance.gameOver(client, ctx, msg, color, emoji, generalMessages);
                } else {
                    const attachment = await gameInstance.getImage();
                    const editEmbed = client.embed()
                        .setColor(color.main)
                        .setDescription(
                            generalMessages.title
                                .replace("%{mainLeft}", emoji.mainLeft)
                                .replace("%{title}", "2048")
                                .replace("%{mainRight}", emoji.mainRight)
                        )
                        .setImage("attachment://board.png")
                        .setFooter({
                            text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    msg.edit({ embeds: [editEmbed], components: msg.components, files: [attachment] });
                }
            } catch (error) {
                console.error('Error deferring interaction:', error);
                // Handle the error accordingly
            }
        });

        collector.on('end', async (_, r) => {
            activeGames.delete(ctx.author.id);
            if (r === 'idle') await gameInstance.gameOver(client, ctx, msg, color, emoji, generalMessages);
        });
    }

    async getImage() {
        try {
            const canvasSize = 400;
            const tilePadding = 8;
            const tileRadius = 10;
            const tileSize = (canvasSize - (WIDTH + 1) * tilePadding) / WIDTH; // Adjust for padding
            const canvas = createCanvas(canvasSize, canvasSize + 60); // Extra space for score
            const context = canvas.getContext("2d");

            // Load and draw the background image
            const background = await loadImage('https://i.imgur.com/HJgHXVW.jpg'); // Set your background image path
            context.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Draw the score background
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, canvas.width, 50);

            // Draw the score text
            context.fillStyle = "#ffffff";
            context.font = "bold 30px Kelvinch-Bold Arial";
            context.textAlign = "center";
            context.fillText(`Score: ${this.score}`, canvas.width / 2, 35);

            // Tile colors
            const tileColors = {
                0: "#cdc1b4", 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179",
                16: "#f59563", 32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72",
                256: "#edcc61", 512: "#edc850", 1024: "#edc53f", 2048: "#edc22e"
            };

            // Draw tiles with padding and rounded corners
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const value = this.board[y * WIDTH + x];
                    const xPos = x * (tileSize + tilePadding) + tilePadding;
                    const yPos = y * (tileSize + tilePadding) + tilePadding + 50; // Offset due to score

                    // Draw rounded tile
                    context.fillStyle = tileColors[value] || "#5f5e59";
                    context.beginPath();
                    context.roundRect(xPos, yPos, tileSize, tileSize, tileRadius);
                    context.fill();

                    // Draw tile number
                    if (value !== 0) {
                        context.fillStyle = "#000000";
                        context.font = "bold 30px Kelvinch-Bold Arial";
                        context.textAlign = "center";
                        context.textBaseline = "middle";
                        context.fillText(value.toString(), xPos + tileSize / 2, yPos + tileSize / 2);
                    }
                }
            }

            // Return the image
            return new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "board.png" });
        } catch (error) {
            console.error("Error generating 2048 image:", error);
            throw error;
        }
    }

    async gameOver(client, ctx, msg, color, emoji, generalMessages) {
        activeGames.delete(ctx.author.id);
        const attachment = await this.getImage(); // Generate game board image

        // Determine game over message
        const isWin = this.board.includes(2048); // Check if the player reached 2048
        const gameOverText = isWin ? `${emoji.peachCongratulation} 𝒀𝒐𝒖 𝑾𝒊𝒏! ${emoji.gomaCongratulation}` : "💀 𝑮𝒂𝒎𝒆 𝑶𝒗𝒆𝒓!";

        // Create embed message
        const editEmbed = client.embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} 2048 ${emoji.mainRight}`) // Centered title
            .setDescription(`**${gameOverText}**\n\n🔢 **𝑭𝒊𝒏𝒂𝒍 𝑺𝒄𝒐𝒓𝒆:** ${this.score}`)
            .setImage('attachment://board.png')
            .setFooter({
                text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        // Edit the message to show Game Over screen
        await msg.edit({
            embeds: [editEmbed],
            components: [], // Remove buttons since the game is over
            files: [attachment],
        });
    }

    placeNewRandomTile() {
        let newPos = {
            x: 0,
            y: 0,
        };

        do {
            newPos = {
                x: parseInt(Math.random() * WIDTH),
                y: parseInt(Math.random() * HEIGHT),
            };
        } while (this.board[newPos.y * WIDTH + newPos.x] !== 0);

        // Randomly place a 2 or 4
        this.board[newPos.y * WIDTH + newPos.x] = Math.random() < 0.9 ? 2 : 4;
    }

    shift(pos, dir) {
        let moved = false;
        const movingNum = this.board[pos.y * WIDTH + pos.x];

        if (movingNum === 0) {
            return false;
        }

        let moveTo = pos;
        let set = false;
        while (!set) {
            moveTo = this.move(moveTo, dir);
            const moveToNum = this.board[moveTo.y * WIDTH + moveTo.x];

            if (!this.isInsideBlock(moveTo, WIDTH, HEIGHT) || (moveToNum !== 0 && moveToNum !== movingNum) || !!this.mergedPos.find(p => p.x === moveTo.x && p.y === moveTo.y)) {
                const oppDir = this.oppDirection(dir);
                const moveBack = this.move(moveTo, oppDir);
                if (!this.posEqual(moveBack, pos)) {
                    this.board[pos.y * WIDTH + pos.x] = 0;
                    this.board[moveBack.y * WIDTH + moveBack.x] = movingNum;
                    moved = true;
                }
                set = true;
            } else if (moveToNum === movingNum) {
                moved = true;
                // Correctly merge tiles by doubling the value
                this.board[moveTo.y * WIDTH + moveTo.x] = movingNum * 2; // Correct tile value after merging
                this.score += this.board[moveTo.y * WIDTH + moveTo.x]; // Add merged tile value to score
                this.board[pos.y * WIDTH + pos.x] = 0;
                set = true;
                this.mergedPos.push(moveTo); // Track merged position to prevent re-merging
            }
        }
        return moved;
    }

    shiftLeft() {
        let moved = false;
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 1; x < WIDTH; x++)
                moved = this.shift({
                    x,
                    y
                }, 'left') || moved;
        return moved;
    }

    shiftRight() {
        let moved = false;
        for (let y = 0; y < HEIGHT; y++)
            for (let x = WIDTH - 2; x >= 0; x--)
                moved = this.shift({
                    x,
                    y
                }, 'right') || moved;
        return moved;
    }

    shiftUp() {
        let moved = false;
        for (let x = 0; x < WIDTH; x++)
            for (let y = 1; y < HEIGHT; y++)
                moved = this.shift({
                    x,
                    y
                }, 'up') || moved;
        return moved;
    }

    shiftDown() {
        let moved = false;
        for (let x = 0; x < WIDTH; x++)
            for (let y = HEIGHT - 2; y >= 0; y--)
                moved = this.shift({
                    x,
                    y
                }, 'down') || moved;
        return moved;
    }

    move(pos, dir) {
        switch (dir) {
            case 'up':
                return {
                    x: pos.x, y: pos.y - 1
                }
            case 'down':
                return {
                    x: pos.x, y: pos.y + 1
                }
            case 'left':
                return {
                    x: pos.x - 1, y: pos.y
                }
            case 'right':
                return {
                    x: pos.x + 1, y: pos.y
                }
        }
    }

    isInsideBlock(pos, width, height) {
        return pos.x >= 0 && pos.y >= 0 && pos.x < width && pos.y < height;
    }

    posEqual(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    oppDirection(dir) {
        switch (dir) {
            case 'up':
                return 'down'
            case 'down':
                return 'up'
            case 'left':
                return 'right'
            case 'right':
                return 'left'
        }
    }

    isBoardFull() {
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                if (this.board[y * WIDTH + x] === 0)
                    return false;
        return true;
    }

    possibleMoves() {
        let numMoves = 0;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const pos = {
                    x,
                    y
                };
                const posNum = this.board[pos.y * WIDTH + pos.x];
                ['down', 'left', 'right', 'up'].forEach(dir => {
                    const newPos = this.move(pos, dir);
                    if (this.isInsideBlock(newPos, WIDTH, HEIGHT) && (this.board[newPos.y * WIDTH + newPos.x] === 0 || this.board[newPos.y * WIDTH + newPos.x] === posNum))
                        numMoves++;
                });
            }
        }
        return numMoves;
    }
};
