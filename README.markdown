# 🎀 Peachy-Bot: The Cutest Discord Buddy! 🎀

Welcome to **Peachy-Bot**, the most adorable and super-fun Discord bot that’ll sprinkle some magic ✨ into your server! Built with love using Node.js and Discord.js, this little peach 🍑 is packed with awesome features like economy games, leveling adventures, giveaways, and tons of cute commands! Whether you're a server owner or a developer, Peachy-Bot is here to make your community the peachy-est place ever! 🌸 Get ready to dive into a world of fun and customization! 🎉

## 🌟 Super Cool Features 🌟

- **Economy Fun 💰**: Manage virtual coins with cute banking, jobs, and resource commands!
- **Leveling Adventure 🌱**: Reward active members with adorable ranks and levels to boost engagement!
- **Giveaway Party 🎉**: Host the cutest giveaways with easy-to-use commands and messages!
- **Games & Giggles 🎮**: Enjoy a variety of games and silly commands to keep everyone smiling!
- **Mod Magic 🛡️**: Keep your server safe and organized with cool moderation tools like kicks and bans!
- **Multi-Language Love 🌐**: Supports English (`en.json`) and Khmer (`kh.json`)—add more languages with ease!
- **Totally Customizable 🎨**: Modular structure lets you mix and match features or add your own!
- **Utility Cuteness 🛠️**: Check user info, server stats, and more with a peach-y twist!

## 📂 Peachy Directory Peek 📂

- `public/`: Home to static assets like fonts and images for that extra flair! 🎨
- `src/`: The heart of Peachy-Bot!
  - `commands/`: Adorable command categories like `ADMIN/`, `BANK/`, `FUN/`, and more! 🐾
  - `languages/`: Language files for multi-lingual charm (`en.json`, `kh.json`). 🌍
  - `managers/`: Handy managers like `EconomyManager.js` and `ResourceManager.js` to handle logic. 💼
  - `plugins/`: Extra goodies like `boosterMessages.js`, `welcomeMessages.js`, and more! 🎁
  - `structures/`: The cute building blocks for commands, events, and the bot client! 🏗️
- `utils/`: Little helper tools (`client.js`, `config.js`, `emojis.js`) to keep everything peachy! 🍑

## 🛠️ Prerequisites 🛠️

Before you start, make sure you have the following ready:

- **Node.js** (v16.x or higher) - Download from [nodejs.org](https://nodejs.org/) 💻
- **npm** (Node package manager) - Comes with Node.js! 📦
- **A Discord Bot Token** - Create one via the [Discord Developer Portal](https://discord.com/developers/applications) 🔑
- **A MongoDB Database** (optional) - For economy and leveling features, sign up at [mongodb.com](https://www.mongodb.com/) 🗄️
- **Text Editor** - Use VS Code, Sublime Text, or any editor you love! ✍️

## 🚀 Setup Time! Let’s Get Peachy! 🚀

Follow these simple steps to bring Peachy-Bot to life on your server! 🌸

### 1. Clone the Fun! 🏠
- Download or clone the project files to your computer.
- Use Git Bash, Terminal, or your favorite tool:
  ```
  git clone https://github.com/yourusername/Peachy-Bot.git
  ```
- If you don’t use Git, just download the ZIP from the repository and unzip it!

### 2. Install the Goodies! 📦
- Open your terminal and navigate to the project folder:
  ```
  cd Peachy-Bot
  ```
- Install all the necessary dependencies by running:
  ```
  npm install
  ```
- This will download everything Peachy needs to run smoothly! 🎀

### 3. Configure Your Peach! 🛠️
Peachy-Bot uses a `.env` file to store configuration settings, which you’ll need to create. Follow these steps to set it up:

- **Create a `.env` File**:
  - In the root folder of the project (where `config.js` is), create a new file named `.env`.
  - You can do this in your text editor by right-clicking the folder > New File > name it `.env`.

- **Add Environment Variables**:
  - Open the `.env` file and add the following variables. Replace the placeholder values with your own:
    ```
    NODE_ENV=PRODUCTION
    TOKEN=YOUR_BOT_TOKEN_HERE
    PREFIX=!
    GUILD_ID=YOUR_SERVER_ID_HERE
    CLIENT_ID=YOUR_CLIENT_ID_HERE
    CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
    OWNER_IDS=YOUR_DISCORD_ID1,YOUR_DISCORD_ID2
    BANKACCOUNT_ID=1260261937292247070
    DATABASE_URL=YOUR_MONGODB_URI_HERE
    PRODUCTION=true
    KEEP_ALIVE=false
    ```
  - **Explanation of Each Variable**:
    - `NODE_ENV`: Set to `"PRODUCTION"` for live use or `"DEVELOPMENT"` for testing (default is `"PRODUCTION"`).
    - `TOKEN`: Your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications). Keep this secret! 🤫
    - `PREFIX`: The command prefix (e.g., `!` or `peach!`). Default is `!`.
    - `GUILD_ID`: Your Discord server ID (enable Developer Mode in Discord, right-click server > Copy ID).
    - `CLIENT_ID`: Your bot’s Client ID from the Discord Developer Portal.
    - `CLIENT_SECRET`: Your bot’s Client Secret from the Discord Developer Portal (used for OAuth).
    - `OWNER_IDS`: Comma-separated list of Discord User IDs for bot owners (e.g., `123456789,987654321`).
    - `BANKACCOUNT_ID`: Default bank account ID for the economy system (default is `"1260261937292247070"`—change if needed).
    - `DATABASE_URL`: MongoDB connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for economy and leveling features. Leave blank (`""`) if not using.
    - `PRODUCTION`: Set to `true` for production mode, `false` for development (default is `true`).
    - `KEEP_ALIVE`: Set to `true` to keep the bot running on free hosting (e.g., Replit), `false` otherwise (default is `false`).

- **Optional Channels**:
  - The `channel` object in `config.js` lists specific channel IDs for features like welcome messages, logs, and giveaways. You can update these in the `.env` file or directly in `config.js` if needed. Example:
    ```
    WELCOME_CHANNEL=1299416615275987025
    ANNOUNCEMENT_CHANNEL=1272595713125126176
    LOG_CHANNEL=1289803142606622771
    ```
  - These IDs are specific to the bot’s original server. Replace them with your own channel IDs (right-click channel > Copy ID with Developer Mode enabled) to customize where messages are sent.

- **Save the File**:
  - Save the `.env` file after filling in your details. Ensure it’s in the root folder! 💾
  - Note: Add `.env` to your `.gitignore` file to keep it secret if you push to GitHub!

### 4. Launch the Adventure! 🚀
- In your terminal, still in the project folder, run:
  ```
  node src/index.js
  ```
- If everything’s set up right, Peachy will start, and you’ll see a welcome message in the console! 🎉
- If you get errors, check the "Troubleshooting" section below.

### 5. Invite Your Buddy! 🚪
- Go to the [Discord Developer Portal](https://discord.com/developers/applications).
- Select your bot, go to the "OAuth2" tab, and use the URL Generator.
- Check permissions like "Send Messages" and "Manage Roles."
- Copy the generated link, open it in your browser, and invite Peachy to your server!
- Make sure Peachy has the right roles to work its magic! 🌟

## 🎮 How to Play with Peachy! 🎮

- Start by typing your prefix followed by a command (e.g., `!help` to see all the cute options)! 🐱
- Explore the `commands/` folder to see all the fun categories like `FUN/`, `GAMES/`, and `ECONOMY/`.

### ✨ Create Your Own Commands! ✨
Want to add a new command to Peachy? It’s super easy! Let’s make a fun `hug` command as an example, where users can hug someone in the server with a cute embed message. Follow these steps:

#### Step 1: Pick a Category
- Go to the `src/commands/` folder. You’ll see folders like `FUN/`, `ACTIONS/`, and `ADMIN/`.
- Since a `hug` command is playful, let’s put it in the `ACTIONS/` folder (same place as the `bite` command!).

#### Step 2: Create a New File
- Inside `src/commands/ACTIONS/`, create a new file called `hug.js`.
- You can do this in your text editor (like VS Code) by right-clicking the `ACTIONS/` folder > New File > name it `hug.js`.

#### Step 3: Add the Command Code
- Open `hug.js` and paste the following code. This creates a simple `hug` command that sends a cute embed message!
  ```javascript
  const { Command } = require("../../structures/index.js");
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

  module.exports = class Hug extends Command {
    constructor(client) {
      super(client, {
        name: "hug",
        description: {
          content: "Give a big hug to the mentioned user!",
          examples: ["hug @User"],
          usage: "hug @User",
        },
        category: "actions",
        aliases: ["cuddle"],
        cooldown: 3,
        args: true,
        permissions: {
          dev: false,
          client: ["SendMessages", "ViewChannel", "EmbedLinks"],
          user: [],
        },
        slashCommand: true,
        options: [
          {
            name: "user",
            description: "Mention the user you want to hug!",
            type: 6, // USER type
            required: true,
          },
        ],
      });
    }

    async run(client, ctx, args, color, emoji, language) {
      try {
        // Get the target user
        const target = ctx.isInteraction
          ? ctx.interaction.options.getUser("user")
          : ctx.message.mentions.users.first() ||
            (await client.users.fetch(args[0]).catch(() => null));

        // Error handling
        if (!target) {
          return await client.utils.sendErrorMessage(
            client,
            ctx,
            "You need to mention a user to hug! 🥺",
            color
          );
        }

        if (target.id === ctx.author.id) {
          return await client.utils.sendErrorMessage(
            client,
            ctx,
            "You can’t hug yourself! But here’s a hug from Peachy! 🤗",
            color
          );
        }

        // Create the embed message for hugging
        const embed = client
          .embed()
          .setColor(color.main)
          .setImage(client.utils.emojiToImage("🤗")) // A cute hug emoji
          .setDescription(
            `${emoji.mainLeft || "🧡"} **HUG** ${emoji.mainRight || "🧡"}\n\n` +
            `**${ctx.author.displayName}** gives **${target.displayName}** a big, warm hug! 🤗`
          )
          .setFooter({
            text: `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          });

        // Create a "Hug back" button
        const hugBackButton = new ButtonBuilder()
          .setCustomId(`hug_back_${ctx.author.id}_${target.id}`)
          .setLabel("Hug back")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🤗");

        const row = new ActionRowBuilder().addComponents(hugBackButton);

        // Send the message with the button
        const message = await ctx.sendMessage({
          embeds: [embed],
          components: [row],
        });

        // Create a collector for the button
        const collector = message.createMessageComponentCollector({
          filter: (i) => {
            if (i.user.id !== target.id) {
              i.reply({
                content: "Only the person who was hugged can use this button!",
                flags: 64, // Ephemeral message
              });
              return false;
            }
            return true;
          },
          time: 60000, // 1 minute timeout
        });

        collector.on("collect", async (interaction) => {
          const responseEmbed = client
            .embed()
            .setColor(color.main)
            .setDescription(
              `**${target.displayName}** hugs **${ctx.author.displayName}** back! Aww, so sweet! 🤗`
            )
            .setImage(client.utils.emojiToImage("🤗"));

          // Disable the button after use
          const disabledRow = new ActionRowBuilder().addComponents(
            ButtonBuilder.from(hugBackButton).setDisabled(true)
          );

          await interaction.update({
            embeds: [responseEmbed],
            components: [disabledRow],
          });

          collector.stop();
        });

        collector.on("end", async (collected, reason) => {
          if (reason === "time" && message.editable) {
            const disabledRow = new ActionRowBuilder().addComponents(
              ButtonBuilder.from(hugBackButton).setDisabled(true)
            );
            await message.edit({ components: [disabledRow] });
          }
        });
      } catch (error) {
        console.error("Failed to send hug message:", error);
        await client.utils.sendErrorMessage(
          client,
          ctx,
          "Oh no! Something went wrong while hugging. Try again later! 😢",
          color
        );
      }
    }
  };
  ```
- Let’s break down what this code does:
  - **Command Setup**: We define the `hug` command with a name, description, category, and permissions, just like the `bite` command.
  - **Target User**: It checks for a mentioned user (via slash command or mention) and handles errors if no user is mentioned or if someone tries to hug themselves.
  - **Embed Message**: Sends a cute embed with a hug emoji, showing who hugged whom.
  - **Interactive Button**: Adds a "Hug back" button that only the target can use, with a 1-minute timeout.
  - **Error Handling**: Catches any errors and sends a friendly message if something goes wrong.

#### Step 4: Save and Test!
- Save the `hug.js` file.
- Restart the bot by running:
  ```
  node src/index.js
  ```
- In your Discord server, try the command! For example, if your prefix is `!`, type:
  ```
  !hug @Friend
  ```
- You should see a cute embed message with a "Hug back" button! 🎉

#### Step 5: Customize It!
- Want to add more? You can tweak the embed message, add more buttons (like in the `bite` command), or change the emoji! For example, add more buttons like this:
  ```javascript
  const tickleButton = new ButtonBuilder()
    .setCustomId(`tickle_${ctx.author.id}_${target.id}`)
    .setLabel("Tickle them")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("😂");

  const row = new ActionRowBuilder().addComponents(hugBackButton, tickleButton);
  ```
- Just make sure to update the `collector.on("collect", ...)` part to handle the new button, like the `bite` command does!

## ❓ Troubleshooting Tips ❓

- **Error: "Token invalid"**  
  Double-check your `token` in `.env`. Regenerate it in the Discord Developer Portal if needed.
- **Bot won’t start**  
  Ensure Node.js and npm are installed. Run `node -v` and `npm -v` in terminal to confirm.
- **Commands not working**  
  Verify the `PREFIX` in `.env` matches what you’re typing. Also, check bot permissions in Discord!
- **Economy/Leveling not saving**  
  Make sure `DATABASE_URL` is correct and your MongoDB is running.

## 🤝 Join the Peachy Crew! 🤝

Wanna make Peachy even cuter? Fork this project on GitHub and send pull requests with new ideas, bug fixes, or extra sparkle! All contributions are super welcome! 🌟

## 📜 License Love 📜

Peachy-Bot comes with an MIT License—check the `LICENSE` file for the deets! ❤️

## 📩 Say Hi to Peachy! 📩

Got questions or wanna chat? Drop a message on Discord or email (add your contact here)! Let’s make your server the peachy-est place ever! 🍑

---

**Get Peachy-Bot today and turn your server into a cute paradise! 🌸✨**