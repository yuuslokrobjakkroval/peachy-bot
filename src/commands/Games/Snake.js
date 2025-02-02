const { Command } = require("../../structures");

const WIDTH = 15;
const HEIGHT = 10;

class SnakeGame {
  constructor(options = {}) {
    this.direction = 'up';
    if (!options.message) throw new TypeError('NO_MESSAGE: Please provide a message arguement')
    if (typeof options.message !== 'object') throw new TypeError('INVALID_MESSAGE: Invalid Discord Message object was provided.')

    if (!options.emojis) options.emojis = {};
    if (!options.emojis.board) options.emojis.board = '⬛';
    if (typeof options.emojis.board !== 'string')  throw new TypeError('INVALID_EMOJI: Board Emoji must be a string.')
    if (!options.emojis.food) options.emojis.food = '🍎';
    if (typeof options.emojis.food !== 'string')  throw new TypeError('INVALID_EMOJI: Food Emoji must be a string.')

    if (!options.emojis.up) options.emojis.up = '⬆️';
    if (typeof options.emojis.up !== 'string')  throw new TypeError('INVALID_EMOJI: Up Emoji must be a string.')
    if (!options.emojis.left) options.emojis.left = '⬅️';
    if (typeof options.emojis.left !== 'string')  throw new TypeError('INVALID_EMOJI: Up Emoji must be a string.')
    if (!options.emojis.down) options.emojis.down = '⬇️';
    if (typeof options.emojis.down !== 'string')  throw new TypeError('INVALID_EMOJI: Up Emoji must be a string.')
    if (!options.emojis.right) options.emojis.right = '➡️';
    if (typeof options.emojis.right !== 'string')  throw new TypeError('INVALID_EMOJI: Up Emoji must be a string.')


    if (!options.foods) options.foods = [];
    if (typeof options.foods !== 'object')  throw new TypeError('INVALID_FOODS: Foods Emojis must be a array.')

    if (!options.othersMessage) options.othersMessage = 'You are not allowed to use buttons for this message!';
    if (typeof options.othersMessage !== 'string') throw new TypeError('INVALID_OTHERS_MESSAGE: Others Message must be a string.')
    if (!options.stopButton) options.stopButton = 'Stop';
    if (typeof options.stopButton !== 'string') throw new TypeError('INVALID_STOP_BUTTON: Stop Button must be a string.')


    this.snake = [{ x: 5, y: 5 }];
    this.apple = { x: 1, y: 1 };
    this.snakeLength = 1;
    this.isInGame = false;
    this.options = options;
    this.message = options.message;
    this.gameBoard = [];
    this.score = 0;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        this.gameBoard[y * WIDTH + x] = this.options.emojis.board;
      }
    }
  }


  getGameBoard() {
    let str = '';
    let emojis = this.options.snake;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (x === this.apple.x && y === this.apple.y) {
          str += this.options.emojis.food;
          continue;
        }

        let flag = true;
        for (let s = 0; s < this.snake.length; s++) {
          if (x === this.snake[s].x && y === this.snake[s].y) {
            if (s === 0) {
              if (this.isInGame || this.score === HEIGHT * WIDTH)
                str += emojis.head[this.direction];
              else
                str += emojis.over;
            } else if (s === this.snake.length - 1) {
              str += emojis.tail;
            } else {
              str += emojis.body[this.direction];
            }
            flag = false;
          }
        }

        if (flag)
          str += this.gameBoard[y * WIDTH + x];
      }
      str += '\n';
    }
    return str;
  }

  checkSnake(pos) {
    return this.snake.find(sPos => sPos.x === pos.x && sPos.y === pos.y);
  };

  newFoodLoc() {
    let newApplePos = { x: 0, y: 0 };
    do {
      newApplePos = { x: parseInt(Math.random() * WIDTH), y: parseInt(Math.random() * HEIGHT) };
    } while (this.checkSnake(newApplePos))

    if (this.options.foods.length) {
      this.options.emojis.food = this.options.foods[Math.floor(Math.random()*this.options.foods.length)];
    }

    this.apple.x = newApplePos.x;
    this.apple.y = newApplePos.y;
  }

  async startGame(client, ctx, args, color, emoji, generalMessages) {
    if (this.options.slash_command) {
      if (!this.message.deferred) await this.message.deferReply({ephemeral: false});
      this.message.author = this.message.user;
    }
    const emojis = this.options.emojis;

    this.isInGame = true;
    this.snakeLength = 1;
    this.snake = [{ x: 5, y: 5 }];
    this.newFoodLoc();

    const embed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "𝐏𝐄𝐀𝐂𝐇'𝐒 𝐓𝐀𝐈𝐋 𝐂𝐇𝐀𝐒𝐄")
                .replace("%{mainRight}", emoji.mainRight) +
            `Score: **${this.score}** \n\n` + this.getGameBoard())
        .setFooter({
          text: generalMessages.gameStart.replace("%{user}", ctx.author.displayName),
          iconURL: ctx.author.displayAvatarURL(),
        });

    const up = client.utils.emojiButton("snake_up", emojis.up, 2);
    const left = client.utils.emojiButton("snake_left", emojis.left, 2);
    const down = client.utils.emojiButton("snake_down", emojis.down, 2);
    const right = client.utils.emojiButton("snake_right", emojis.right, 2);
    const stop = client.utils.labelButton("snake_stop", this.options.stopButton, 4);

    const dis1 = client.utils.labelButton("dis1", '\u200b', 2, true);
    const dis2 = client.utils.labelButton("dis2", '\u200b', 2, true);

    const row1 = client.utils.createButtonRow(dis1, up, dis2, stop)
    const row2 = client.utils.createButtonRow(left, down, right)

    const msg = await ctx.sendMessage({ embeds: [embed], components: [row1, row2] })

    this.ButtonInteraction(client, ctx, msg, color, emoji, generalMessages)
  }


  move(client, ctx, msg, color, emoji, generalMessages) {
    if (this.apple.x === this.snake[0].x && this.apple.y === this.snake[0].y) {
      this.score += 1;
      this.snakeLength++;
      this.newFoodLoc();
    }

    const moveEmbed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "𝐏𝐄𝐀𝐂𝐇'𝐒 𝐓𝐀𝐈𝐋 𝐂𝐇𝐀𝐒𝐄")
                .replace("%{mainRight}", emoji.mainRight) +
            `Score: **${this.score}** \n\n ` + this.getGameBoard())
        .setFooter({
          text: generalMessages.gameInProgress.replace("%{user}", ctx.author.displayName),
          iconURL: ctx.author.displayAvatarURL(),
        });


    msg.edit({ embeds: [moveEmbed], components: msg.components })
  }

  async gameOver(client, ctx, msg, color, emoji, generalMessages) {
    this.isInGame = false;
    const editEmbed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "𝐏𝐄𝐀𝐂𝐇'𝐒 𝐓𝐀𝐈𝐋 𝐂𝐇𝐀𝐒𝐄")
                .replace("%{mainRight}", emoji.mainRight) +
            `Score: **${this.score}** \n\n` + this.getGameBoard())
        .setFooter({
          text: generalMessages.gameOver.replace("%{user}", ctx.author.displayName),
          iconURL: ctx.author.displayAvatarURL(),
        });

    return await msg.edit({ embeds: [editEmbed], components: [] })
  }


  ButtonInteraction(client, ctx, msg, color, emoji, generalMessages) {
    const filter = m => m;
    const collector = msg.createMessageComponentCollector({
      filter,
      idle: 300000
    })

    collector.on('collect', async btn => {
      if (btn.user.id !== this.message.author.id) return btn.reply({ content: this.options.othersMessage.replace('{author}', this.message.author.username),  ephemeral: true })

      try {
        const snakeHead = this.snake[0];
        const nextPos = { x: snakeHead.x, y: snakeHead.y };

        if (btn.customId === 'snake_left') {
          this.direction = 'left'; // Update direction
          let nextX = snakeHead.x - 1;
          if (nextX < 0) {
            nextPos.x = 0;
            return this.gameOver(client, ctx, msg, color, emoji, generalMessages);
          }
          nextPos.x = nextX;
        } else if (btn.customId === 'snake_right') {
          this.direction = 'right'; // Update direction
          let nextX = snakeHead.x + 1;
          if (nextX >= WIDTH) {
            nextPos.x = WIDTH - 1;
            return this.gameOver(client, ctx, msg, color, emoji, generalMessages);
          }
          nextPos.x = nextX;
        } else if (btn.customId === 'snake_up') {
          this.direction = 'up'; // Update direction
          let nextY = snakeHead.y - 1;
          if (nextY < 0) {
            nextPos.y = 0;
            return this.gameOver(client, ctx, msg, color, emoji, generalMessages);
          }
          nextPos.y = nextY;
        } else if (btn.customId === 'snake_down') {
          this.direction = 'down'; // Update direction
          let nextY = snakeHead.y + 1;
          if (nextY >= HEIGHT) {
            nextPos.y = HEIGHT - 1;
            return this.gameOver(client, ctx, msg, color, emoji, generalMessages);
          }
          nextPos.y = nextY;
        } else if (btn.customId === 'snake_stop') {
          await this.gameOver(client, ctx, msg, color, emoji, generalMessages);
          return collector.stop();
        }

        if (this.checkSnake(nextPos)) {
          await this.gameOver(client, ctx, msg, color, emoji, generalMessages);
        } else {
          this.snake.unshift(nextPos);
          if (this.snake.length > this.snakeLength)
            this.snake.pop();

          this.move(client, ctx, msg, color, emoji, generalMessages);
        }
        await btn.deferUpdate();
      } catch (error) {
        console.error('Error deferring interaction:', error);
      }
    })

    collector.on('end', async() => {
      if (this.isInGame === true) return this.gameOver(client, ctx, msg, color, emoji, generalMessages);
    })
  }
}

module.exports = class Snake extends Command {
  constructor(client) {
    super(client, {
      name: "snake",
      description: {
        content: "𝑷𝒍𝒂𝒚 𝒂 𝒈𝒂𝒎𝒆 𝒐𝒇 𝒔𝒏𝒂𝒌𝒆",
        examples: ["𝒔𝒏𝒂𝒌𝒆"],
        usage: "𝒔𝒏𝒂𝒌𝒆",
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
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    await new SnakeGame({
      message: ctx,
      snake: {
        head: {
          up: '<:UPHEAD:1335613052304883794>',    // Head emoji when moving up
          down: '<:DOWNHEAD:1335613065366081648>',  // Head emoji when moving down
          left: '<:LEFTHEAD:1335613087725785139>',  // Head emoji when moving left
          right: '<:RIGHTHEAD:1335613075881201666>', // Head emoji when moving right
        },
        body: '<:BODY:1335613817563906199>',
        tail: {
          up: '<:DOWNTAIL:1335613939618283560>',    // Tail emoji when moving up
          down: '<:DOWNTAIL:1335607710825185381>',  // Tail emoji when moving down
          left: '<:LEFTTAIL:1335613914859180032>',  // Tail emoji when moving left
          right: '<:RIGHTTAIL:1335613930252402820>', // Tail emoji when moving right
        },
        over: '💀',    // Game over emoji
      },
      emojis: {
        board: '⬛',
        food: '🍔',
        up: '🔼',
        right: '▶️',
        down: '🔽',
        left: '◀️',
      },
      foods: ['🍣', '🐟', '🍎', '🍇', '🍊', "🍕", "🍔", "🥪", "🥙", "🥗", "🥐", "🍿", "🥓", "🌯", "🍗", "🥟"],
      stopButton: 'Stop',
      othersMessage: 'You are not allowed to use buttons for this message!',
    }).startGame(client, ctx, args, color, emoji, generalMessages)
  }
};
