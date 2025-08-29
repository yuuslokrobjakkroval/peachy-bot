const {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  CommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const ms = require("ms");
const Users = require("../schemas/user");
const GiveawaySchema = require("../schemas/giveaway");
const GiveawayShopItemSchema = require("../schemas/giveawayShopItem");
const GiveawayScheduleSchema = require("../schemas/giveawaySchedule");
const importantItems = require("../assets/inventory/ImportantItems");
const shopItems = require("../assets/inventory/ShopItems");
const inventory = shopItems.flatMap((shop) => shop.inventory);
const canvafy = require("canvafy");
const globalConfig = require("./Config");
const gif = require("./Gif");
const globalEmoji = require("./Emoji");
const { getLevelingMessage } = require("./Abilities");
const { default: axios } = require("axios");

module.exports = class Utils {
  // Standardized updateUserWithRetry function
  static async updateUserWithRetry(userId, updateFn, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const user = await Users.findOne({ userId }).exec();
        if (!user) {
          console.log(`User with ID ${userId} not found.`);
          return false;
        }
        await updateFn(user);
        await user.save();
        return true;
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        if (error.name === "VersionError") {
          retries++;
          if (retries === maxRetries) {
            console.log(`Max retries reached for user ${userId}.`);
            return false;
          }
        } else {
          return false;
        }
      }
    }
  }

  // Caching system
  static cache = {
    users: new Map(),
    items: null,
    lastCacheClean: Date.now(),
  };

  // Cache user data with TTL
  static async getCachedUser(userId, ttlMs = 60000) {
    const now = Date.now();

    // Clean expired cache entries every 5 minutes
    if (now - this.cache.lastCacheClean > 300000) {
      this.cleanCache();
      this.cache.lastCacheClean = now;
    }

    const cachedUser = this.cache.users.get(userId);
    if (cachedUser && now - cachedUser.timestamp < ttlMs) {
      return cachedUser.data;
    }

    const user = await Users.findOne({ userId }).exec();
    if (user) {
      this.cache.users.set(userId, { data: user, timestamp: now });
    }
    return user;
  }

  // Clean expired cache entries
  static cleanCache() {
    const now = Date.now();
    for (const [userId, entry] of this.cache.users.entries()) {
      if (now - entry.timestamp > 300000) {
        // 5 minutes TTL
        this.cache.users.delete(userId);
      }
    }
  }

  // Cache all items on startup
  static cacheItems() {
    if (!this.cache.items) {
      const allItems = [
        ...require("../assets/inventory/ImportantItems"),
        ...require("../assets/inventory/ShopItems").flatMap(
          (shop) => shop.inventory
        ),
        ...require("../assets/inventory/SlimeCatalog"),
        ...require("../assets/inventory/Woods"),
        ...require("../assets/inventory/Minerals"),
      ];
      this.cache.items = allItems;
    }
    return this.cache.items;
  }

  // Standardized error handling
  static errorMessages = {
    INSUFFICIENT_FUNDS:
      "You don't have enough coins for this action. Try earning more with daily rewards or by selling items.",
    ITEM_NOT_FOUND:
      "The requested item was not found. Check the item ID and try again.",
    COOLDOWN_ACTIVE:
      "This command is on cooldown. Please wait before trying again.",
    PERMISSION_DENIED: "You don't have permission to use this command.",
    INVALID_ARGUMENTS:
      "Invalid command arguments. Please check the command usage.",
    USER_NOT_FOUND: "User not found. Make sure you're mentioning a valid user.",
    INVENTORY_FULL: "Your inventory is full. Try selling some items first.",
    TOOL_BROKEN: "Your tool has broken! You'll need to buy a new one.",
    GENERIC_ERROR:
      "An error occurred while processing your request. Please try again later.",
  };

  static getErrorMessage(errorCode, ...args) {
    const message =
      this.errorMessages[errorCode] || this.errorMessages.GENERIC_ERROR;

    // Replace placeholders with args if any
    if (args.length > 0) {
      return message.replace(/\{(\d+)\}/g, (match, index) => {
        const argIndex = Number.parseInt(index, 10);
        return argIndex < args.length ? args[argIndex] : match;
      });
    }

    return message;
  }

  // Comprehensive input validation
  static validateInput(input, type, options = {}) {
    switch (type) {
      case "number":
        const num = Number(input);
        if (isNaN(num)) return false;
        if (options.min !== undefined && num < options.min) return false;
        if (options.max !== undefined && num > options.max) return false;
        return true;

      case "string":
        if (typeof input !== "string") return false;
        if (options.minLength !== undefined && input.length < options.minLength)
          return false;
        if (options.maxLength !== undefined && input.length > options.maxLength)
          return false;
        if (options.regex && !options.regex.test(input)) return false;
        return true;

      case "userId":
        return /^\d{17,19}$/.test(input);

      case "itemId":
        // Validate item ID format and check if it exists
        if (!this.cache.items) this.cacheItems();
        return this.cache.items.some((item) => item.id === input);

      default:
        return false;
    }
  }

  // Rate limiting system
  static rateLimits = new Map();

  static checkRateLimit(userId, commandName, limit = 5, window = 60000) {
    const now = Date.now();
    const key = `${userId}:${commandName}`;

    // Get or initialize the user's command usage history
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }

    const userHistory = this.rateLimits.get(key);

    // Remove timestamps outside the current window
    const validHistory = userHistory.filter(
      (timestamp) => now - timestamp < window
    );
    this.rateLimits.set(key, validHistory);

    // Check if the user has exceeded the rate limit
    if (validHistory.length >= limit) {
      return {
        limited: true,
        resetTime: validHistory[0] + window,
        remaining: 0,
      };
    }

    // Add the current timestamp to the history
    validHistory.push(now);
    this.rateLimits.set(key, validHistory);

    return {
      limited: false,
      resetTime: now + window,
      remaining: limit - validHistory.length,
    };
  }

  // Unified cooldown system
  static async checkAndSetCooldown(client, ctx, command, cooldownTime) {
    const userId = ctx.author.id;

    // Get user from database
    const user = await this.getCachedUser(userId);
    if (!user) return false;

    // Check if user is on cooldown
    const cooldown = user.cooldowns.find(
      (c) => c.name === command.name.toLowerCase()
    );
    const isOnCooldown = cooldown
      ? Date.now() - cooldown.timestamp < cooldownTime
      : false;

    if (!isOnCooldown) {
      // Set cooldown
      await this.updateUserWithRetry(userId, async (user) => {
        const existingCooldown = user.cooldowns.find(
          (c) => c.name === command.name.toLowerCase()
        );
        if (existingCooldown) {
          existingCooldown.timestamp = Date.now();
        } else {
          user.cooldowns.push({
            name: command.name.toLowerCase(),
            timestamp: Date.now(),
            duration: cooldownTime,
          });
        }
      });
      return false; // Not on cooldown
    } else {
      // Calculate remaining time
      const remainingTime = Math.ceil(
        (cooldown.timestamp + cooldownTime - Date.now()) / 1000
      );

      // Send cooldown message
      await this.sendErrorMessage(
        client,
        ctx,
        `Please wait <t:${
          Math.round(Date.now() / 1000) + remainingTime
        }:R> before using this command again.`,
        client.color.danger,
        remainingTime * 1000
      );

      return true; // On cooldown
    }
  }

  static getUser(userId) {
    return Users.findOne({ userId })
      .then((user) => {
        return user;
      })
      .catch((error) => {
        console.log(`Error fetching user data: ${error}`);
        return null;
      });
  }

  static async updateUser(userId, data) {
    await Users.findByIdAndUpdate(userId, data, { new: true });
  }

  static calculateNextLevelXpBonus(level) {
    const base = 100;
    const scalingFactor = 1.5;
    return Math.floor(base * Math.pow(scalingFactor, level - 1));
  }

  static getCheckingUser(client, message, user, color, emoji, prefix) {
    if (user) {
      const now = Date.now();
      const xpCooldown = 10000;

      if (
        !user.profile.lastXpGain ||
        now - user.profile.lastXpGain >= xpCooldown
      ) {
        const creditGained =
          message.content.startsWith(prefix) ||
          message.content.startsWith(prefix.toLowerCase())
            ? 1
            : 0;

        user.balance.credit += creditGained;

        const xpGained =
          message.content.startsWith(prefix) ||
          message.content.startsWith(prefix.toLowerCase())
            ? client.utils.getRandomNumber(8, 10)
            : client.utils.getRandomNumber(7, 8);

        user.profile.xp += xpGained;
        user.profile.lastXpGain = now;

        const nextLevelXp = client.utils.calculateNextLevelXpBonus(
          user.profile.level
        );

        if (user.profile.xp >= nextLevelXp) {
          user.profile.xp -= nextLevelXp;
          user.profile.level += 1;
          user.profile.levelXp = client.utils.calculateNextLevelXpBonus(
            user.profile.level
          );
          getLevelingMessage(client, message, user.profile.level);
          const celebrationCoin = user.profile.level * 25000;

          user.balance.coin += celebrationCoin;

          const levelUp = new canvafy.LevelUp()
            .setAvatar(
              message.author.displayAvatarURL({ format: "png", size: 512 })
            )
            .setUsername(`${message.author.username}`, "#000000")
            .setBorder("#8BD3DD")
            .setBackground("image", gif.backgroundLevel)
            .setLevels(user.profile.level - 1, user.profile.level)
            .build();

          levelUp
            .then((levelUpImage) => {
              const levelImage = {
                attachment: levelUpImage,
                name: "level-up.png",
              };

              const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(`${message.author.displayName} - LEVEL UP !`)
                .setDescription(
                  `Congratulations ${
                    globalEmoji.congratulation
                  } !!!\nYou leveled up to level ${
                    user.profile.level
                  }!\nYou have been awarded ${client.utils.formatNumber(
                    celebrationCoin
                  )} ${emoji.coin}.`
                )
                .setThumbnail(
                  message.author.displayAvatarURL({ format: "png", size: 512 })
                )
                .setImage("attachment://level-up.png");

              message.channel
                .send({
                  embeds: [embed],
                  files: [levelImage],
                })
                .catch((error) => {
                  console.error("Error sending level up message:", error);
                });
            })
            .catch((error) => {
              console.error("Error creating level up image:", error);
              message.channel.send(
                "You leveled up, but there was an error creating the level-up image!"
              );
            });
        }

        user.save().catch((err) => {
          console.error("Error saving user data:", err);
        });
      }
    }
  }

  static async getVoiceCheckingUser(client, member, user, color, emoji) {
    if (!user) return;

    const now = Date.now();

    const guildId = member.guild.id;

    const isMainGuild = guildId === globalConfig.guildId;
    const xpGained = isMainGuild
      ? client.utils.getRandomNumber(8, 10)
      : client.utils.getRandomNumber(7, 8);

    user.profile.voiceXP += xpGained;
    user.profile.lastVoiceXpGain = now;
    user.profile.lastVoiceActivity = new Date();

    const nextLevelXp = client.utils.calculateNextLevelXpBonus(
      user.profile.voiceLevel
    );

    if (user.profile.voiceXP >= nextLevelXp) {
      user.profile.voiceXP -= nextLevelXp;
      user.profile.voiceLevel += 1;
      user.profile.voiceLevelXp = client.utils.calculateNextLevelXpBonus(
        user.profile.voiceLevel
      );
      const celebrationCoin = user.profile.voiceLevel * 15000;
      user.balance.coin += celebrationCoin;

      // Generate level up image
      const levelUp = new canvafy.LevelUp()
        .setAvatar(member.user.displayAvatarURL({ format: "png", size: 512 }))
        .setUsername(`${member.user.username}`, "#000000")
        .setBorder("#8BD3DD")
        .setBackground("image", gif.backgroundLevel)
        .setLevels(user.profile.voiceLevel - 1, user.profile.voiceLevel)
        .build();

      levelUp
        .then((levelUpImage) => {
          const levelImage = {
            attachment: levelUpImage,
            name: "voice-level-up.png",
          };

          const embed = client
            .embed()
            .setColor(color.main)
            .setTitle(`${member.displayName} - VOICE LEVEL UP !`)
            .setDescription(
              `You’ve leveled up to voice level **${user.profile.voiceLevel}**!\n` +
                `You received ${client.utils.formatNumber(celebrationCoin)} ${
                  emoji.coin
                } 🎙️`
            )
            .setThumbnail(
              member.user.displayAvatarURL({ format: "png", size: 512 })
            )
            .setImage("attachment://voice-level-up.png");

          const sendChannel = member.guild.channels.cache.get(
            member.voice.channelId
          );
          if (sendChannel) {
            sendChannel
              .send({ embeds: [embed], files: [levelImage] })
              .catch(console.error);
          } else {
            console.warn(
              `[Voice XP] No valid text channel to send level-up message in guild ${member.guild.name}`
            );
          }
        })
        .catch((error) => {
          console.error("Error creating voice level-up image:", error);
        });
    }

    await user.save().catch((err) => {
      console.error("Error saving user data (voice xp):", err);
    });
  }

  static async getValidationUser(client, message, user, color, emoji, command) {
    let updateField;
    switch (command.name) {
      case "klaklouk":
        updateField = { "validation.isKlaKlouk": true };
        break;
      case "multitransfer":
        updateField = { "validation.isMultiTransfer": true };
        break;
      default:
        return;
    }
    if (updateField) {
      await Users.updateOne({ userId: user.userId }, { $set: updateField });
    }
  }

  static getGiveaway(interaction) {
    return GiveawaySchema.findOne({
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      messageId: interaction.message.id,
    })
      .then((giveaway) => {
        return giveaway;
      })
      .catch((error) => {
        console.log(`Error fetching giveaway data: ${error}`);
        return null;
      });
  }

  static getGiveawayShopItem(interaction) {
    return GiveawayShopItemSchema.findOne({
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      messageId: interaction.message.id,
    })
      .then((giveaway) => {
        return giveaway;
      })
      .catch((error) => {
        console.log(`Error fetching giveaway data: ${error}`);
        return null;
      });
  }

  static getCheckPermission(ctx, userId, permission) {
    try {
      ctx.guild.members.fetch(userId).then((member) => {
        return member.permissions.has(PermissionsBitField.Flags[permission]);
      });
    } catch (error) {
      console.error("Error fetching member:", error);
      return false; // Return false or handle error appropriately
    }
  }

  static getSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static cooldown(id, timeout, cdId, cooldowntime, message, cooldowns, prem) {
    if (id === this.client.config.ownerId) {
      return false;
    }

    if (timeout.includes(id)) {
      if (cdId.includes(id)) {
        return true;
      }

      cdId.push(id);

      if (prem.includes(id)) {
        const CD = Number.parseInt(cooldowntime / 2);

        const currentTime = new Date();
        const cooldownEnd = new Date(currentTime.getTime() + CD);
        if (currentTime < cooldownEnd) {
          const timeLeft = Math.ceil((cooldownEnd - currentTime) / 1000) - 1;
          message.channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor("Blue")
                  .setDescription(
                    `<@${id}> cooldown **<t:${Math.floor(
                      cooldownEnd.getTime() / 1000
                    )}:R>**`
                  ),
              ],
            })
            .then((cooldownMessage) => {
              setTimeout(() => {
                cooldownMessage.delete().catch(console.error);
                cdId.shift();
              }, timeLeft * 1000);
            })
            .catch(console.error);
          return true;
        }
        return true;
      }

      const cooldownEnd = cooldowns.get(message.guild.id);
      const currentTime = new Date();
      if (currentTime < cooldownEnd) {
        const timeLeft = Math.ceil((cooldownEnd - currentTime) / 1000) - 1;
        message.channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor("Blue")
                .setDescription(
                  `<@${id}> cooldown **<t:${Math.floor(
                    cooldownEnd.getTime() / 1000
                  )}:R>**`
                ),
            ],
          })
          .then((cooldownMessage) => {
            setTimeout(() => {
              cooldownMessage.delete().catch(console.error);
              cdId.shift();
            }, timeLeft * 1000);
          })
          .catch(console.error);
        return true;
      }
      return true;
    } else {
      if (prem.includes(id)) {
        const CD = Number.parseInt(cooldowntime / 2);

        const currentTime = new Date();
        const cooldownEnd = new Date(currentTime.getTime() + CD);
        cooldowns.set(message.guild.id, cooldownEnd);
        timeout.push(id);
        setTimeout(() => {
          timeout.shift();
          cdId.shift();
        }, CD - 1000);
        return false;
      } else {
        const currentTime = new Date();
        const cooldownEnd = new Date(currentTime.getTime() + cooldowntime);
        cooldowns.set(message.guild.id, cooldownEnd);
        timeout.push(id);
        setTimeout(() => {
          timeout.shift();
          cdId.shift();
        }, cooldowntime - 1000);
        return false;
      }
    }
  }

  static getCollectionButton(mgs, timeout) {
    return mgs.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: timeout,
    });
  }

  static getCooldown(userId, command) {
    return Users.findOne({ userId: userId })
      .exec()
      .then((user) => {
        if (user) {
          const cooldown = user.cooldowns.find((c) => c.name === command);
          return cooldown ? cooldown.timestamp : 0;
        }
      })
      .catch((error) => {
        console.error("Error fetching cooldown:", error);
      });
  }

  static checkCooldown(userId, command, duration) {
    const now = Date.now();

    return Users.findOne({ userId: userId })
      .exec()
      .then((user) => {
        if (user) {
          const cooldown = user.cooldowns.find((c) => c.name === command);
          if (cooldown) {
            // Check if the current time minus the timestamp is greater than or equal to the provided duration
            return now - cooldown.timestamp >= duration;
          }
        }
        return true;
      })
      .catch((error) => {
        console.error("Error checking cooldown:", error);
        return false;
      });
  }

  static updateCooldown(userId, command, duration) {
    const now = Date.now();

    Users.findOne({ userId: userId })
      .exec()
      .then((user) => {
        if (user) {
          const cooldownIndex = user.cooldowns.findIndex(
            (c) => c.name === command
          );
          if (cooldownIndex > -1) {
            user.cooldowns[cooldownIndex].timestamp = now;
            user.cooldowns[cooldownIndex].duration = duration;
          } else {
            user.cooldowns.push({
              name: command,
              timestamp: now,
              duration: duration,
            });
          }
          return user.save();
        }
      })
      .catch((error) => {
        console.error("Error updating cooldown:", error);
      });
  }

  static toSmall(count) {
    const numbers = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
    let digits = Math.trunc(Math.log10(count) + 1);
    let result = "";
    if (!digits) digits = count.toString().length;
    for (let i = 0; i < digits; i++) {
      const digit = count % 10;
      count = Math.trunc(count / 10);
      result = numbers[digit] + result;
    }
    return result;
  }

  static formatUsername(name) {
    if (typeof name !== "string") {
      return "";
    }

    const formattedName = name.replace(/[^a-zA-Z0-9]+/g, " ");
    return formattedName.toUpperCase();
  }

  static splitToSpace(text) {
    return text.replace(/[^a-zA-Z0-9]+/g, " ");
  }

  static formatCapitalize(val) {
    const words = val.split("_");
    const CapitalizeWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    );
    return CapitalizeWords.join(" ");
  }

  static formatUpperCase(val) {
    const words = val.split("_");
    const UpperWords = words.map((word) => word.toUpperCase());
    return UpperWords.join(" ");
  }

  static formatTime(string) {
    const hours = Math.floor(string / 3600);
    const minutes = Math.floor((string % 3600) / 60);
    const remainingSeconds = string % 60;
    const parts = [];

    if (hours > 0) {
      parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    }
    if (minutes > 0 || (hours > 0 && remainingSeconds > 0)) {
      parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    }
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
      parts.push(
        `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`
      );
    }

    return parts.join(" ");
  }

  static formatBalance(client, ctx, color, coin, amount, invalidAmount) {
    if (!amount || typeof amount !== "string") {
      return ctx.sendMessage({
        embeds: [
          client.embed().setColor(color.danger).setDescription(invalidAmount),
        ],
      });
    }

    // Remove commas for safe parsing
    amount = amount.replace(/,/g, "");

    const amountMap = {
      all: coin,
      half: Math.ceil(coin / 2),
    };
    const multiplier = {
      k: 1000,
      m: 1000000,
      b: 1000000000,
    };

    // Check predefined amounts (all/half)
    if (amount in amountMap) {
      return amountMap[amount];
    }

    // Check for multiplier-based formats (e.g., 10k, 5m)
    if (/^\d+[kmb]$/i.test(amount)) {
      const unit = amount.slice(-1).toLowerCase(); // Get the last character (k, m, b)
      const number = Number.parseInt(amount.slice(0, -1)); // Remove the unit and parse the number

      if (isNaN(number)) {
        return ctx.sendMessage({
          embeds: [
            client.embed().setColor(color.danger).setDescription(invalidAmount),
          ],
        });
      }

      return number * (multiplier[unit] || 1);
    }

    // Validate numeric input
    if (/^\d+$/.test(amount)) {
      return Number.parseInt(amount);
    }

    // If all validations fail
    return ctx.sendMessage({
      embeds: [
        client.embed().setColor(color.danger).setDescription(invalidAmount),
      ],
    });
  }

  static formatNumber(num) {
    if (
      isNaN(num) ||
      num <= 0 ||
      num.toString().includes(".") ||
      num.toString().includes(",")
    ) {
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    } else {
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    }
  }

  static formatColor(hex) {
    if (typeof hex !== "number") {
      throw new Error("Input must be a number");
    }
    const hexString = hex.toString(16).toUpperCase();
    const paddedHexString = hexString.padStart(6, "0");
    return `#${paddedHexString}`;
  }

  static getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getLoopElement(item, repeatCount) {
    let result = "";

    for (let i = 0; i < repeatCount; i++) {
      result += item;
    }

    return result;
  }

  static chunk(array, size) {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
      chunked_arr.push(array.slice(index, size + index));
      index += size;
    }
    return chunked_arr;
  }

  static generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static formatString(number, decimals = 2) {
    if (number === 0) return "0";
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["", "K", "M", "B", "T", "Q"];
    const i = Math.floor(Math.log(number) / Math.log(k));
    const formattedNumber = Number.parseFloat(
      (number / Math.pow(k, i)).toFixed(dm)
    );
    return dm === 0 ? formattedNumber.toFixed(0) : formattedNumber + sizes[i];
  }

  static linkButton(label, link) {
    return new ButtonBuilder()
      .setLabel(`${label}`)
      .setStyle(5)
      .setURL(`${link}`);
  }

  static labelButton(id, label, style, disabled = false) {
    return new ButtonBuilder()
      .setCustomId(`${id}`)
      .setLabel(`${label}`)
      .setStyle(style)
      .setDisabled(disabled);
  }

  static emojiButton(id, emoji, style, disabled = false) {
    return new ButtonBuilder()
      .setCustomId(`${id}`)
      .setEmoji(`${emoji}`)
      .setStyle(style)
      .setDisabled(disabled);
  }

  static fullOptionButton(id, emoji, label, style, disabled = false) {
    const button = new ButtonBuilder()
      .setCustomId(id)
      .setStyle(style)
      .setDisabled(disabled);

    if (label) {
      button.setLabel(label);
    }

    if (emoji) {
      button.setEmoji(emoji);
    }

    return button;
  }

  static createButtonRow(...buttons) {
    const actionRow = new ActionRowBuilder();
    actionRow.addComponents(buttons);
    return actionRow;
  }

  static oops(client, ctx, args, color, time) {
    const embed = client.embed().setColor(color.danger).setDescription(args);
    return ctx
      .sendMessage({ embeds: [embed] })
      .then((msg) => {
        setTimeout(
          () => {
            msg.delete().catch(() => {});
          },
          time ? time : 10000
        );
      })
      .catch((error) => {
        console.error("Error sending oops message:", error);
      });
  }

  static sendErrorMessage(client, ctx, args, color, time) {
    const embed = client.embed().setColor(color.danger).setDescription(args);

    return ctx
      .sendMessage({ embeds: [embed] })
      .then((msg) => {
        setTimeout(
          () => {
            msg.delete().catch(() => {});
          },
          time ? time : 10000
        );
      })
      .catch((error) => {
        console.error("Error sending error message:", error);
      });
  }

  static sendSuccessMessage(client, ctx, args, color, time) {
    const embed = client.embed().setColor(color.main).setDescription(args);

    return ctx
      .sendMessage({ embeds: [embed] })
      .then((msg) => {
        setTimeout(
          () => {
            msg.delete().catch(() => {});
          },
          time ? time : 10000
        );
      })
      .catch((error) => {
        console.error("Error sending success message:", error);
      });
  }

  static getZodiacSign(zodiacSign, day, month) {
    const zodiacSigns = [
      { sign: "capricorn", start: [12, 22], end: [1, 19] },
      { sign: "aquarius", start: [1, 20], end: [2, 18] },
      { sign: "pisces", start: [2, 19], end: [3, 20] },
      { sign: "aries", start: [3, 21], end: [4, 19] },
      { sign: "taurus", start: [4, 20], end: [5, 20] },
      { sign: "gemini", start: [5, 21], end: [6, 20] },
      { sign: "cancer", start: [6, 21], end: [7, 22] },
      { sign: "leo", start: [7, 23], end: [8, 22] },
      { sign: "virgo", start: [8, 23], end: [9, 22] },
      { sign: "libra", start: [9, 23], end: [10, 22] },
      { sign: "scorpio", start: [10, 23], end: [11, 21] },
      { sign: "sagittarius", start: [11, 22], end: [12, 21] },
    ];

    for (const zodiac of zodiacSigns) {
      const [startMonth, startDay] = zodiac.start;
      const [endMonth, endDay] = zodiac.end;

      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (startMonth > endMonth && (month === startMonth || month === endMonth))
      ) {
        return { sign: zodiac.sign, emoji: zodiacSign[zodiac.sign] };
      }
    }
    return null;
  }

  static async userRanking(client, ctx, color, type) {
    switch (type) {
      case "sponsor":
        return await Users.aggregate([
          { $match: { "balance.sponsor": { $gt: 0 } } },
          { $project: { total: "$balance.sponsor", username: "$username" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
      case "slots":
      case "slot":
        return await Users.aggregate([
          { $match: { "balance.slots": { $gt: 0 } } },
          { $project: { total: "$balance.slots", username: "$username" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
      case "blackjack":
      case "bj":
        return await Users.aggregate([
          { $match: { "balance.blackjack": { $gt: 0 } } },
          { $project: { total: "$balance.blackjack", username: "$username" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
      case "coinflip":
      case "cf":
        return await Users.aggregate([
          { $match: { "balance.coinflip": { $gt: 0 } } },
          { $project: { total: "$balance.coinflip", username: "$username" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
      case "klaklouk":
      case "kk":
        return await Users.aggregate([
          { $match: { "balance.klaklouk": { $gt: 0 } } },
          { $project: { total: "$balance.klaklouk", username: "$username" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
      case "peach":
      case "p":
        return await Users.aggregate([
          { $match: { "peachy.streak": { $gt: 0 } } },
          { $project: { username: "$username", total: "$peachy.streak" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
      case "goma":
      case "g":
        return await Users.aggregate([
          { $match: { "goma.streak": { $gt: 0 } } },
          { $project: { username: "$username", total: "$goma.streak" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
      default:
        return await Users.aggregate([
          { $match: { "balance.coin": { $gt: 0 } } },
          { $project: { total: "$balance.coin", username: "$username" } },
          { $sort: { total: -1 } },
          { $limit: 100 },
        ]).exec();
    }
  }

  static titleRanking(type, rankingMessages) {
    switch (type) {
      case "balance":
      case "bal":
        return rankingMessages.balance;
      case "peach":
      case "p":
        return rankingMessages.peach;
      case "goma":
      case "g":
        return rankingMessages.goma;
      case "slots":
      case "slot":
        return rankingMessages.slots;
      case "blackjack":
      case "bj":
        return rankingMessages.blackjack;
      case "coinflip":
      case "cf":
        return rankingMessages.coinflip;
      case "klaklouk":
      case "kk":
        return rankingMessages.klaklouk;
      case "sponsor":
        return rankingMessages.sponsor;
      default:
        return rankingMessages.top;
    }
  }

  static typeRanking(type, emoji) {
    if (["peach", "goma", "p", "g"].includes(type)) {
      return "streak";
    } else {
      return emoji.coin;
    }
  }

  static emojiRank(emoji, position) {
    switch (position) {
      case 1:
        return emoji.rank.one;
      case 2:
        return emoji.rank.two;
      case 3:
        return emoji.rank.three;
      case 4:
        return emoji.rank.four;
      case 5:
        return emoji.rank.five;
      case 6:
        return emoji.rank.six;
      case 7:
        return emoji.rank.seven;
      default:
        return emoji.rank.eight;
    }
  }

  static emojiPosition(position) {
    switch (position) {
      case "police":
        return globalEmoji.position.police;
      case "it":
        return globalEmoji.position.it;
      case "doctor":
        return globalEmoji.position.doctor;
      case "engineer":
        return globalEmoji.position.engineer;
      case "teacher":
        return globalEmoji.position.teacher;
      default:
        return globalEmoji.position.student;
    }
  }

  static async reactionPaginate(ctx, embed) {
    const author = ctx instanceof CommandInteraction ? ctx.user : ctx.author;
    const isInteraction = ctx.isInteraction;

    if (embed.length < 2) {
      const msgOptions = { embeds: embed };
      await (isInteraction
        ? ctx.deferred
          ? ctx.interaction.followUp(msgOptions)
          : ctx.interaction.reply(msgOptions)
        : ctx.channel.send(msgOptions));
      return;
    }

    let page = 0;

    const getPageContent = (page) => {
      return { embeds: [embed[page]] };
    };

    const msgOptions = getPageContent(0);
    const msg = await (isInteraction
      ? ctx.deferred
        ? ctx.interaction.followUp({ ...msgOptions, fetchReply: true })
        : ctx.interaction.reply({ ...msgOptions, fetchReply: true })
      : ctx.channel.send({ ...msgOptions, fetchReply: true }));

    const reactions = ["⏪", "◀️", "▶️", "⏩"];
    for (const emoji of reactions) {
      await msg.react(emoji);
    }

    const filter = (reaction, user) =>
      reactions.includes(reaction.emoji.name) && user.id === author.id;

    const collector = msg.createReactionCollector({ filter, time: 300000 });

    collector.on("collect", (reaction, user) => {
      if (user.id !== author.id) return;

      reaction.users.remove(user);

      switch (reaction.emoji.name) {
        case "⏪":
          page = 0;
          break;
        case "◀️":
          if (page > 0) page--;
          break;
        case "▶️":
          if (page < embed.length - 1) page++;
          break;
        case "⏩":
          page = embed.length - 1;
          break;
        default:
          break;
      }

      msg.edit(getPageContent(page));
    });

    collector.on("end", async () => {
      const botPermissions = msg?.channel?.permissionsFor(msg.guild.me);

      if (!botPermissions || !botPermissions.has("ManageMessages")) {
        return;
      }

      try {
        await msg.reactions.removeAll();
      } catch (error) {
        console.error("Failed to remove reactions:", error);
      }
    });
  }

  static async paginate(ctx, embed) {
    const author = ctx instanceof CommandInteraction ? ctx.user : ctx.author;
    const isInteraction = ctx.isInteraction;

    if (embed.length < 2) {
      const msgOptions = { embeds: embed };
      await (isInteraction
        ? ctx.deferred
          ? ctx.interaction.followUp(msgOptions)
          : ctx.interaction.reply(msgOptions)
        : ctx.channel.send(msgOptions));
      return;
    }

    let page = 0;
    const getButton = (page) => {
      const firstEmbed = page === 0;
      const lastEmbed = page === embed.length - 1;
      const pageEmbed = embed[page];
      const buttons = [
        { id: "fast", label: "<<", emoji: "⏪", disabled: firstEmbed },
        { id: "back", label: "<", emoji: "◀️", disabled: firstEmbed },
        { id: "next", label: ">", emoji: "▶️", disabled: lastEmbed },
        { id: "last", label: ">>", emoji: "⏩", disabled: lastEmbed },
      ];
      const components = new ActionRowBuilder();
      buttons.forEach((button) =>
        components.addComponents(
          new ButtonBuilder()
            .setCustomId(button.id)
            .setLabel(button.label)
            .setStyle(2)
            .setDisabled(button.disabled)
        )
      );
      return { embeds: [pageEmbed], components: [components] };
    };

    const msgOptions = getButton(0);
    const msg = await (isInteraction
      ? ctx.deferred
        ? ctx.interaction.followUp({ ...msgOptions, fetchReply: true })
        : ctx.interaction.reply({ ...msgOptions, fetchReply: true })
      : ctx.channel.send({ ...msgOptions, fetchReply: true }));

    const filter = (int) => int.user.id === author.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      time: 300000,
    });

    collector.on(
      "end",
      async () => await msg.edit({ embeds: [embed[page]], components: [] })
    );
    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== author.id)
        return await interaction.reply({
          content: "You can't use this button",
          flags: 64,
        });

      await interaction.deferUpdate();

      const customId = interaction.customId;
      if (customId === "fast" || customId === "last")
        page = customId === "fast" ? 0 : embed.length - 1;
      else page += customId === "back" ? -1 : 1;

      return await interaction.editReply(getButton(page));
    });
  }

  static emojiToImage(emoji) {
    const emojiRegex = /<(a)?:[a-zA-Z0-9_]+:(\d+)>/;
    const match = emoji.match(emojiRegex);
    if (match) {
      const emojiId = match[2];
      const isAnimated = match[1] === "a";
      return `https://cdn.discordapp.com/emojis/${emojiId}.${
        isAnimated ? "gif" : "png"
      }`;
    } else {
      return null;
    }
  }

  static stickerToImage(sticker) {
    const stickerRegex = /<:[a-zA-Z0-9_]+:(\d+)>|<a:[a-zA-Z0-9_]+:(\d+)>/;
    const match = sticker.match(stickerRegex);
    if (match) {
      const stickerId = match[1] || match[2];
      return `https://cdn.discordapp.com/stickers/${stickerId}.png`;
    } else {
      // Fallback to null if no valid sticker ID is found
      return null;
    }
  }

  static getDelayUntil7PM() {
    const now = new Date();
    const sevenPM = new Date();
    sevenPM.setHours(19, 0, 0, 0); // 7:00 PM today
    if (now > sevenPM) {
      sevenPM.setDate(sevenPM.getDate() + 1);
    }

    return sevenPM - now;
  }

  static async checkBirthdays(client) {
    console.log("Check Birthday Start");
    try {
      // Get today's date in the format DD MMM
      const today = new Date();
      const todayDate = `${today
        .getDate()
        .toString()
        .padStart(2, "0")} ${today.toLocaleString("en-US", {
        month: "short",
      })}`;

      // Find users whose birthdays match today's date and are not yet acknowledged
      const usersWithBirthdayToday = await Users.find({
        "profile.birthday": todayDate,
        "profile.birthdayAcknowledged": false,
      });

      console.log("Users with birthdays today:", usersWithBirthdayToday);

      // Fetch the birthday channel
      const birthdayChannel = await client.channels
        .fetch(client.config.channel.reward)
        .catch((err) => {
          console.error(
            "[Birthday] Error fetching birthday channel:",
            err.message
          );
        });

      if (!birthdayChannel) {
        console.error(`[Birthday] Birthday channel not found or inaccessible.`);
        return;
      }

      // Process each user with a birthday today
      for (const user of usersWithBirthdayToday) {
        try {
          // Calculate random gift balance and XP
          const giftBalance =
            Math.floor(Math.random() * (1000000 - 500000 + 1)) + 500000;
          const [day, month, year] = user.profile.birthday.split("-");
          const xp =
            Number.parseInt(day) +
            (new Date(Date.parse(`${month} 1, 2020`)).getMonth() + 1) +
            Number.parseInt(year.slice(-2));

          // Create the birthday embed
          const birthdayEmbed = client
            .embed()
            .setColor(client.color.main)
            .setTitle(
              `🎉 Happy Birthday, ${user.profile.username || user.username}! 🎂`
            )
            .setDescription(
              `On this special day, we celebrate you and all the joy you bring into our lives!`
            )
            .addFields([
              {
                name: "🎁 Your Birthday Gift:",
                value: `${giftBalance} coins`,
                inline: true,
              },
              { name: "✨ Your Birthday XP:", value: `${xp} XP`, inline: true },
            ])
            .setFooter({
              text: "Have an amazing birthday filled with love and happiness!",
            })
            .setTimestamp();

          console.log("Constructed Birthday Embed:", birthdayEmbed);

          // Update user profile: mark birthday acknowledged and add rewards
          user.profile.birthdayAcknowledged = true;
          user.balance.coin += giftBalance;
          user.profile.xp += xp;

          await user.save();
          console.log(
            `User ${
              user.profile.username || user.username
            } updated successfully.`
          );

          // Send the birthday message to the channel
          await birthdayChannel.send({ embeds: [birthdayEmbed] });
          console.log("Birthday message sent successfully.");
        } catch (userError) {
          console.error(
            `[Birthday] Error processing user ${user._id}: ${userError.message}`
          );
        }
      }

      console.log("Check Birthday Ended");
    } catch (err) {
      console.error(`[Birthday] Error fetching birthdays: ${err.message}`);
    }
  }

  static async addCoinsToUser(userId, amount) {
    try {
      let user = await Users.findOne({ userId });
      if (!user) {
        user = new Users({
          userId,
          balance: {
            coin: amount,
            bank: 0,
          },
        });
        await user.save();
      } else {
        await Users.updateOne({ userId }, { $inc: { "balance.coin": amount } });
      }
    } catch (error) {
      console.error(`Failed to update balance for user ${userId}:`, error);
    }
  }

  static async endGiveaway(client, color, emoji, message, autopay) {
    if (!message.guild) return;
    if (!client.guilds.cache.get(message.guild.id)) return;

    const data = await GiveawaySchema.findOne({
      guildId: message.guildId,
      messageId: message.id,
    });

    if (!data) return;
    if (data.ended) return;
    if (data.paused) return;

    function getMultipleRandom(arr, number) {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, number);
    }

    let winnerIdArray = [];
    if (data.entered.length >= data.winners) {
      winnerIdArray = getMultipleRandom(data.entered, data.winners);
    } else {
      winnerIdArray = data.entered;
    }

    const disableButton = ActionRowBuilder.from(
      message.components[0]
    ).setComponents(
      ButtonBuilder.from(message.components[0].components[0])
        .setLabel(`${data.entered.length}`)
        .setDisabled(true),
      ButtonBuilder.from(message.components[0].components[1]).setDisabled(true)
    );

    const endGiveawayEmbed = EmbedBuilder.from(message.embeds[0])
      .setColor(color.main)
      .setDescription(
        `Winners: ${data.winners}\nHosted by: <@${data.hostedBy}>`
      );

    await message
      .edit({ embeds: [endGiveawayEmbed], components: [disableButton] })
      .then(async (msg) => {
        await GiveawaySchema.findOneAndUpdate(
          {
            guildId: data.guildId,
            channelId: data.channelId,
            messageId: msg.id,
          },
          { ended: true, winnerId: winnerIdArray }
        );
      });

    // Announce the winners
    await message.reply({
      embeds: [
        client
          .embed()
          .setColor(color.main)
          .setDescription(
            winnerIdArray.length
              ? `Congratulations ${globalEmoji.congratulation}\n${winnerIdArray
                  .map((user) => `<@${user}>`)
                  .join(", ")} ! You have won **${client.utils.formatNumber(
                  data.prize
                )}** ${emoji.coin} ${
                  autopay
                    ? ``
                    : `\n\nto reroll the giveaway, please use\n\`${globalConfig.prefix.toLowerCase()}reroll ${
                        message.id
                      }\``
                }`
              : `No one entered the giveaway for **\`${client.utils.formatNumber(
                  data.prize
                )}\`**!`
          )
          .setFooter({
            text: "Better luck next time!",
            iconURL: client.user.displayAvatarURL(),
          }),
      ],
    });
    if (autopay) {
      for (const winner of winnerIdArray) {
        try {
          await Utils.addCoinsToUser(winner, data.prize);
          // Send a content message mentioning the winner
          await message.reply({
            content: `<@${winner}> You have won **${client.utils.formatNumber(data.prize)}** ${emoji.coin}!`,
          });
        } catch (err) {
          console.error(`Error awarding prize to user <@${winner}>:`, err);

          data.retryAutopay = true;
          await data.save();
        }
      }
    }
  }

  static async endGiveawayShopItem(client, color, emoji, message, autoAdd) {
    if (!message.guild) return;
    if (!client.guilds.cache.get(message.guild.id)) return;

    const data = await GiveawayShopItemSchema.findOne({
      guildId: message.guildId,
      messageId: message.id,
    });

    if (!data) return;
    if (data.ended) return;
    if (data.paused) return;

    // Find the item in the inventory based on the itemId
    const category = inventory
      .concat(importantItems)
      .filter((c) => c.type === data.type); // Adjusted to use data.type
    if (!category) {
      console.error(`Invalid item type specified for winner <@${winner}>.`);
      return;
    }

    const itemInfo = category.find(
      (i) => i.id.toLowerCase() === data.itemId.toLowerCase()
    );
    if (!itemInfo) {
      console.error(
        `No item found with ID ${data.itemId} in category ${data.type} for winner <@${winner}>.`
      );
      return;
    }

    function getMultipleRandom(arr, number) {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, number);
    }

    let winnerIdArray = [];
    if (data.entered.length >= data.winners) {
      winnerIdArray = getMultipleRandom(data.entered, data.winners);
    } else {
      winnerIdArray = data.entered;
    }

    const disableButton = ActionRowBuilder.from(
      message.components[0]
    ).setComponents(
      ButtonBuilder.from(message.components[0].components[0])
        .setLabel(`${data.entered.length}`)
        .setDisabled(true),
      ButtonBuilder.from(message.components[0].components[1]).setDisabled(true)
    );

    const endGiveawayEmbed = EmbedBuilder.from(message.embeds[0])
      .setColor(color.main)
      .setThumbnail(client.utils.emojiToImage(itemInfo.emoji))
      .setDescription(
        `Winners: ${data.winners}\nHosted by: <@${data.hostedBy}>`
      );

    await message
      .edit({ embeds: [endGiveawayEmbed], components: [disableButton] })
      .then(async (msg) => {
        await GiveawayShopItemSchema.findOneAndUpdate(
          {
            guildId: data.guildId,
            channelId: data.channelId,
            messageId: msg.id,
          },
          { ended: true, winnerId: winnerIdArray }
        );
      });

    await message.reply({
      embeds: [
        client
          .embed()
          .setColor(color.main)
          .setThumbnail(client.utils.emojiToImage(itemInfo.emoji))
          .setDescription(
            winnerIdArray.length
              ? `Congratulations ${globalEmoji.congratulation}` +
                  `${winnerIdArray
                    .map((user) => `<@${user}>`)
                    .join(", ")} ! You have won **${
                    itemInfo.name
                  } \`${client.utils.formatNumber(data.amount)}\`**` +
                  (autoAdd
                    ? ``
                    : `\n\nto reroll the giveaway, please use\n\`${globalConfig.prefix.toLowerCase()}reroll item ${
                        message.id
                      }\``)
              : `No one entered the giveaway for ${
                  itemInfo.name
                } **\`${client.utils.formatNumber(data.amount)}\`** ${
                  itemInfo.emoji
                }!`
          )
          .setFooter({
            text: "Better luck next time!",
            iconURL: client.user.displayAvatarURL(),
          }),
      ],
    });

    if (autoAdd) {
      for (const winner of winnerIdArray) {
        try {
          const user = await Users.findOne({ userId: winner });
          if (user) {
            const itemIndex = user.inventory.findIndex(
              (item) => item.id === itemInfo.id
            );
            if (itemIndex > -1) {
              user.inventory[itemIndex].quantity += data.amount;
            } else {
              user.inventory.push({
                id: itemInfo.id,
                name: itemInfo.name,
                quantity: data.amount,
              });
            }
            await user.save();
            // Send a content message mentioning the winner
            await message.reply({
              content: `**${client.user.displayName}** has added **${itemInfo.name} ${itemInfo.emoji} \`${data.amount}\`** to <@${winner}>'s inventory.`,
            });
          }
        } catch (err) {
          console.error(`Error adding item to user <@${winner}>:`, err);
          data.retryAutopay = true;
          await data.save();
        }
      }
    }
  }

  static async getResetThief() {
    try {
      const users = await Users.find();
      for (const user of users) {
        if (user.work && user.work.rob) {
          user.work.rob = false;
          await user.save();
        }
      }
    } catch (error) {
      console.error("Error during user reset:", error);
    }
  }

  static async checkResources(user, cost) {
    if (!user.inventory) return false;
    for (const resource in cost) {
      if (
        !user.inventory[resource] ||
        user.inventory[resource] < cost[resource]
      ) {
        return false;
      }
    }
    return true;
  }

  static formatResults(current, total, size) {
    const empty = {
      begin: "<:PB1E:1277709213753409587>",
      middle: "<:PB2E:1277709239942381701>",
      end: "<:PB3E:1277709259039178835>",
    };
    const full = {
      begin: "<:PB1CB:1277709205377122415>",
      middle: "<:PB2CB:1277709231704903730>",
      end: "<:PB3FB:1277709268203737121>",
    };
    const change = {
      begin: "<:PB1FB:1277709222913769562>",
      middle: "<:PB2FB:1277709250423951480>",
    };

    const filledBar = Math.ceil((current / total) * size) || 0;
    let emptyBar = size - filledBar || 0;

    if (filledBar === 0) emptyBar = size;

    const firstBar = filledBar
      ? filledBar === 1
        ? change.begin
        : full.begin
      : empty.begin;
    const middleBar = filledBar
      ? filledBar === size
        ? full.middle.repeat(filledBar - 1)
        : full.middle.repeat(filledBar - 1) +
          empty.middle.repeat(size - filledBar)
      : empty.middle.repeat(size - 1);
    const endBar = filledBar === size ? full.end : empty.end;

    return firstBar + middleBar + endBar;
  }

  static async processScheduledGiveaways(client, color, emoji) {
    try {
      const now = Date.now();

      // Find scheduled giveaways that should start now
      const scheduledGiveaways = await GiveawaySchema.find({
        scheduled: true,
        startTime: { $lte: now },
        messageId: "scheduled",
      });

      for (const giveaway of scheduledGiveaways) {
        try {
          // Fetch the channel
          const channel = await client.channels
            .fetch(giveaway.channelId)
            .catch(() => null);
          if (!channel) {
            console.error(
              `Channel ${giveaway.channelId} not found for scheduled giveaway ${giveaway._id}`
            );
            continue;
          }

          // Create giveaway embed
          const giveawayEmbed = client
            .embed()
            .setColor(color.main)
            .setTitle(
              `**${client.utils.formatNumber(giveaway.prize)}** ${emoji.coin}`
            )
            .setDescription(
              `Click ${emoji.main} button to enter!\n` +
                `Winners: ${giveaway.winners}\n` +
                `Hosted by: <@${giveaway.hostedBy}>\n` +
                `Ends: <t:${Math.floor(giveaway.endTime / 1000)}:R>`
            );

          if (giveaway.image) giveawayEmbed.setImage(giveaway.image);
          if (giveaway.thumbnail)
            giveawayEmbed.setThumbnail(giveaway.thumbnail);

          // Create buttons
          const joinButton = client.utils.fullOptionButton(
            "giveaway-join",
            emoji.main,
            "0",
            1,
            false
          );
          const participantsButton = client.utils.fullOptionButton(
            "giveaway-participants",
            "",
            "Participants",
            2,
            false
          );
          const buttonRow = client.utils.createButtonRow(
            joinButton,
            participantsButton
          );

          // Send the giveaway message
          const giveawayMessage = await channel.send({
            embeds: [giveawayEmbed],
            components: [buttonRow],
          });

          // Update the giveaway in the database
          giveaway.messageId = giveawayMessage.id;
          giveaway.scheduled = false;
          await giveaway.save();

          // Log the scheduled giveaway start
          console.log(
            `Started scheduled giveaway ${giveaway._id} in channel ${channel.name}`
          );
        } catch (error) {
          console.error(
            `Error starting scheduled giveaway ${giveaway._id}:`,
            error
          );
        }
      }

      // Same for item giveaways
      const scheduledItemGiveaways = await GiveawayShopItemSchema.find({
        scheduled: true,
        startTime: { $lte: now },
        messageId: "scheduled",
      });

      for (const giveaway of scheduledItemGiveaways) {
        try {
          // Similar implementation for item giveaways
          // ...
        } catch (error) {
          console.error(
            `Error starting scheduled item giveaway ${giveaway._id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error processing scheduled giveaways:", error);
    }
  }

  static async checkGiveawayRequirements(client, user, giveaway, interaction) {
    // Check if giveaway has requirements
    if (!giveaway.requirements) return true;

    // Check minimum level requirement
    if (giveaway.requirements.minLevel > 0) {
      const userData = await client.utils.getCachedUser(user.id);
      if (
        !userData ||
        userData.profile.level < giveaway.requirements.minLevel
      ) {
        await interaction.reply({
          content: `You don't meet the level requirement (Level ${giveaway.requirements.minLevel}) for this giveaway.`,
          flags: 64,
        });
        return false;
      }
    }

    // Check required role
    if (giveaway.requirements.requiredRole) {
      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);
      if (
        !member ||
        !member.roles.cache.has(giveaway.requirements.requiredRole)
      ) {
        await interaction.reply({
          content: `You don't have the required role <@&${giveaway.requirements.requiredRole}> to enter this giveaway.`,
          flags: 64,
        });
        return false;
      }
    }

    return true;
  }

  static async validateCommonParams(ctx, client, color, durationStr, winners) {
    if (!durationStr || typeof durationStr !== "string") {
      await this.sendErrorMessage(
        client,
        ctx,
        "Duration is missing or invalid. Please provide a valid duration like 1h, 1d, 1w, etc.",
        color
      );
      return { success: false };
    }

    // Validate duration
    const duration = ms(durationStr);
    if (!duration) {
      await this.sendErrorMessage(
        client,
        ctx,
        "Invalid duration format. Please use a valid format like 1h, 1d, 1w, etc.",

        color
      );
      return { success: false };
    }

    // Validate winners
    if (isNaN(winners) || winners <= 0) {
      await this.sendErrorMessage(
        client,
        ctx,
        "Number of winners must be bigger than 0",
        color
      );
      return { success: false };
    }

    // Calculate end time
    const endTime = Date.now() + duration;
    const formattedDuration = Math.floor(endTime / 1000);

    return {
      success: true,
      data: {
        duration,
        endTime,
        formattedDuration,
      },
    };
  }

  static async hasSpecialPermission(userId) {
    return globalConfig.owners.includes(userId);
  }

  static async createGiveawayMessage(ctx, options) {
    const { embed, buttonRow } = options;

    try {
      const giveawayMessage = ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: "",
            embeds: [embed],
            components: [buttonRow],
            fetchReply: true,
          })
        : await ctx.editMessage({
            content: "",
            embeds: [embed],
            components: [buttonRow],
            fetchReply: true,
          });

      return { success: true, message: giveawayMessage };
    } catch (err) {
      console.error("Error sending giveaway message:", err);
      const response = "There was an error sending the giveaway message.";

      if (ctx.isInteraction) {
        await ctx.interaction.editReply({ content: response });
      } else {
        await ctx.editMessage({ content: response });
      }

      return { success: false };
    }
  }

  static async checkBooster(client) {
    console.log("Check Booster Start");
    try {
      const guildId = "1369956599720054847";
      const roleIds = ["1370318327372714034", "1370299562312335441"];
      const rewardChannelId = "1374630700464210010";
      const rewardAmount = 500000;

      const guild = await client.guilds.fetch(guildId).catch((err) => {
        console.error(
          `[Booster] Error fetching guild ${guildId}: ${err.message}`
        );
        return null;
      });

      if (!guild) {
        console.error(`[Booster] Guild ${guildId} not found or inaccessible.`);
        return;
      }

      const members = await guild.members.fetch().catch((err) => {
        console.error(`[Booster] Error fetching guild members: ${err.message}`);
        return null;
      });

      if (!members) {
        console.error(`[Booster] Unable to fetch guild members.`);
        return;
      }

      // Fetch the reward channel
      const rewardChannel = await client.channels
        .fetch(rewardChannelId)
        .catch((err) => {
          console.error(
            `[Booster] Error fetching reward channel ${rewardChannelId}: ${err.message}`
          );
          return null;
        });

      if (!rewardChannel) {
        console.error(
          `[Booster] Reward channel ${rewardChannelId} not found or inaccessible.`
        );
        return;
      }

      const boosterMembers = members.filter((member) =>
        roleIds.some((roleId) => member.roles.cache.has(roleId))
      );

      console.log(`Members with booster/sponsor roles:`, boosterMembers.size);

      for (const member of boosterMembers.values()) {
        try {
          const user = await Users.findOne({ userId: member.id });

          if (!user) {
            console.log(`[Booster] User ${member.id} not found in database.`);
            continue;
          }

          if (user.profile.boosterAcknowledged) {
            console.log(
              `[Booster] User ${
                user.profile.username || user.username
              } already rewarded.`
            );
            continue;
          }
          const boosterEmbed = client
            .embed()
            .setColor(client.color.main)
            .setThumbnail(member.user.displayAvatarURL())
            .setTitle(
              `🎉 Thank You for Boosting/Sponsoring, ${
                user.profile.username || user.username
              }!`
            )
            .setDescription(
              `We appreciate your support for keeping our server thriving!`
            )
            .addFields([
              {
                name: "Your Reward 🎁",
                value: `**${rewardAmount.toLocaleString()}** coins`,
                inline: true,
              },
            ])
            .setFooter({
              text: "Thank you for your amazing support!",
              iconURL: member.user.displayAvatarURL(),
            })
            .setTimestamp();

          user.profile.boosterAcknowledged = true;
          user.balance.coin += rewardAmount;

          await user.save();

          await rewardChannel.send({ embeds: [boosterEmbed] });
          console.log(`Booster reward message sent for ${member.id}.`);
        } catch (userError) {
          console.error(
            `[Booster] Error processing user ${member.id}: ${userError.message}`
          );
        }
      }

      console.log("Check Booster Ended");
    } catch (err) {
      console.error(`[Booster] Error in checkBooster: ${err.message}`);
    }
  }

  static generateRandomCaptcha() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let captcha = "";
    for (let i = 0; i < 6; i++) {
      captcha += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return captcha;
  }

  static async generateAIResponse(messageContent, conversationHistory = []) {
    const apiKey = globalConfig.geminiApiKey || process.env.GEMINI_API_KEY; // Fallback to .env if globalConfig is undefined
    if (!apiKey) {
      return "សួស្តី! ខ្ញុំជា Peachy ជាបុត Discord ដែលមានប្រយោជន៍។ ខ្ញុំផ្តល់ជូននូវមុខងារដូចជា Economy (រក coins និងទិញ roles ឬ items), Rank (បង្ហាញកម្រិតនៃការសកម្មភាព), Games (ហ្គេមអន្តរកម្ម), និងការគ្រប់គ្រងសហគមន៍។ តើខ្ញុំអាចជួយអ្នកអ្វីខ្លះ?"; // Fallback
    }

    try {
      // System prompt as a user message
      const systemPrompt = {
        role: "user",
        content:
          "អ្នកគឺជា Peachy ជាបុត Discord ដែលមានប្រយោជន៍ ឆ្លើយតបជាភាសាខ្មែរតែប៉ុណ្ណោះ។ អ្នកមានមុខងារដូចជា Economy (អនុញ្ញាតឱ្យអ្នកប្រើរក coins និងទិញ roles ឬ items), Rank (បង្ហាញកម្រិតនៃការសកម្មភាព), Games (ហ្គេមអន្តរកម្ម), និងការគ្រប់គ្រងសហគមន៍។ ឆ្លើយតបដោយផ្អែកលើបរិបទនៃការសន្ទនា។",
      };

      // Combine system prompt, conversation history, and current message
      const messages = [
        systemPrompt,
        ...conversationHistory,
        { role: "user", content: messageContent },
      ];

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: messages.map((msg) => ({
            role: msg.role, // 'user' or 'model'
            parts: [{ text: msg.content }],
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return (
        response.data.candidates[0].content.parts[0].text ||
        "សូមអភ័យទោស មិនអាចបង្កើតការឆ្លើយតបបានទេ។"
      );
    } catch (error) {
      console.error("Gemini API error:", error.response?.data || error.message);
      throw error;
    }
  }

  static async createGiveaway(client) {
    console.log("🔄 [CreateGiveaway] Start");

    try {
      const scheduledGiveaways = await GiveawayScheduleSchema.find({
        isActive: true,
      });
      console.log(
        `📦 Found ${scheduledGiveaways.length} active scheduled giveaways`
      );

      if (scheduledGiveaways.length === 0) return;

      for (const giveaway of scheduledGiveaways) {
        console.log(`🎁 Checking guild: ${giveaway.guildId}`);

        for (const schedule of giveaway.schedules) {
          if (!schedule.isActive) {
            console.log(`⏩ Skipping inactive schedule`);
            continue;
          }
          let guild;
          try {
            guild = await client.guilds.fetch(giveaway.guildId);
            console.log(`✅ Fetched guild ${guild.name}`);
          } catch (e) {
            console.error(`❌ Failed to fetch guild ${giveaway.guildId}`, e);
            continue;
          }

          let channel;
          try {
            channel = await client.channels.fetch(schedule.channel); // Use schedule.channel
            if (!channel || channel.guild.id !== giveaway.guildId) {
              throw new Error(
                "Channel not found or doesn't belong to this guild."
              );
            }
            console.log(`✅ Fetched channel: ${channel.name} (${channel.id})`);
          } catch (e) {
            console.error(`❌ Failed to fetch channel ${schedule.channel}`, e);
            continue;
          }

          const durationMs =
            schedule.scheduleType === "DAILY"
              ? 24 * 60 * 60 * 1000
              : schedule.scheduleType === "WEEKLY"
                ? 7 * 24 * 60 * 60 * 1000
                : 30 * 24 * 60 * 60 * 1000;
          const endTime = Date.now() + durationMs;
          const formattedDuration = Math.floor(endTime / 1000);

          const embed = client
            .embed()
            .setColor(client.color.main)
            .setTitle(
              schedule.content ||
                `**${client.utils.formatNumber(schedule.prize)}** ${client.emoji.coin}`
            )
            .setDescription(
              `Click ${client.emoji.main} to enter!\n` +
                `Winners: ${schedule.winners}\n` +
                `Prize: **${client.utils.formatNumber(schedule.prize)}** ${client.emoji.coin}\n` +
                `Hosted by: ${schedule.createdBy ? `<@${schedule.createdBy}>` : client.user.displayName}\n` +
                `Ends: <t:${formattedDuration}:R>`
            )
            .setImage(
              schedule?.image
                ? schedule.image
                : "https://i.imgur.com/khmmAUe.gifv"
            );

          const joinButton = client.utils.fullOptionButton(
            "giveaway-join",
            client.emoji.main,
            "0",
            1,
            false
          );
          const participantsButton = client.utils.fullOptionButton(
            "giveaway-participants",
            "",
            "Participants",
            2,
            false
          );
          const buttonRow = client.utils.createButtonRow(
            joinButton,
            participantsButton
          );

          let message;
          try {
            console.log(`📤 Sending giveaway message...`);
            message = await channel.send({
              content: "",
              embeds: [embed],
              components: [buttonRow],
              fetchReply: true,
            });
            console.log(`✅ Giveaway message sent: ${channel.name}`);
            setTimeout(async () => {
              try {
                const content = `<@everyone> ${schedule.content}`;
                await channel.send(content);
                console.log(
                  `✅ Sent @everyone ping to channel: ${channel.name}`
                );
              } catch (err) {
                console.error(
                  `❌ Failed to send @everyone ping in channel ${channel.id}`,
                  err
                );
              }
            }, 2000);
          } catch (sendErr) {
            console.error(
              `❌ Failed to send message in channel ${channel.id}`,
              sendErr
            );
            continue;
          }

          try {
            const newGiveaway = await GiveawaySchema.create({
              guildId: giveaway.guildId,
              channelId: schedule.channel, // Use schedule.channel
              messageId: message.id,
              hostedBy: client.user.id,
              winners: schedule.winners,
              prize: schedule.prize,
              endTime: endTime,
              paused: false,
              ended: false,
              entered: [],
              autopay: schedule.autopay,
              retryAutopay: false,
              winnerId: [],
              rerollOptions: [],
              rerollCount: 0,
              rerolledWinners: [],
              description: schedule.content || "",
            });
            console.log(
              `💾 Giveaway saved to DB: ${JSON.stringify(newGiveaway)}`
            );
          } catch (dbErr) {
            console.error(`❌ Failed to save giveaway to DB:`, dbErr);
          }
        }
      }

      console.log("✅ [CreateGiveaway] Finished");
    } catch (err) {
      console.error("💥 Error in createGiveaway:", err);
    }
  }

  /**
   * Safely loads an image with fallback options
   * @param {string} primaryUrl - Primary image URL to load
   * @param {string|null} fallbackUrl - Fallback image URL if primary fails
   * @param {string|null} fallbackColor - Fallback color if all images fail
   * @returns {Promise<{image: any|null, usedFallback: boolean, error: string|null}>}
   */
  static async safeLoadImage(
    primaryUrl,
    fallbackUrl = null,
    fallbackColor = "#DFF2EB"
  ) {
    const { loadImage } = require("@napi-rs/canvas");

    // Helper function to attempt image loading
    const attemptLoad = async (url) => {
      if (!url) return null;
      try {
        const image = await loadImage(url);
        return image;
      } catch (error) {
        console.error(`Failed to load image ${url}:`, error.message);
        return null;
      }
    };

    // Try primary URL
    let image = await attemptLoad(primaryUrl);
    if (image) {
      return { image, usedFallback: false, error: null };
    }

    // Try fallback URL if provided
    if (fallbackUrl) {
      image = await attemptLoad(fallbackUrl);
      if (image) {
        return {
          image,
          usedFallback: true,
          error: `Primary URL failed: ${primaryUrl}`,
        };
      }
    }

    // Both URLs failed
    const errorMsg = fallbackUrl
      ? `Both primary (${primaryUrl}) and fallback (${fallbackUrl}) URLs failed`
      : `Primary URL failed: ${primaryUrl}`;

    return { image: null, usedFallback: true, error: errorMsg };
  }
};
