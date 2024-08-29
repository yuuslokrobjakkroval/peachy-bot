const { Collection, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { Context, Event } = require('../../structures/index.js');
const BotLog = require('../../utils/BotLog.js');
const Users = require("../../schemas/User.js");
const canvafy = require('canvafy');
const { randomBytes } = require('crypto');
const gif = require('../../utils/Gif.js');
const emoji = require('../../utils/Emoji.js');
const { formatCapitalize } = require('../../utils/Utils.js');
const transferLimits = require('../../utils/transferReceiveLimitUtil.js');

const activeGames = new Map();

function getLimitsForLevel(level) {
  const limit = transferLimits.find(limit => limit.level === level);
  return limit || { send: 0, receive: 0 };
}

const Level_Background = [
  gif.one_level_background,
  gif.two_level_background,
  gif.three_level_background,
  gif.four_level_background,
  gif.five_level_background,
  gif.six_level_background
];

function getRandomXp(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateNextLevelXpBonus(level) {
  const base = 1000;
  const scalingFactor = 1.5;
  return Math.floor(base * Math.pow(scalingFactor, level - 1));
}

module.exports = class MessageCreate extends Event {
  constructor(client, file) {
    super(client, file, {
      name: 'messageCreate',
    });
  }

  async run(message) {
    if (message.author.bot || !message.guild) return;

    let user = await Users.findOne({ userId: message.author.id });
    const prefix = this.client.config.prefix;

    if (user?.verification?.status) {
      await message.reply("You are restricted from using commands. Please contact an admin for verification.");
      return;
    }

    if (user) {
      const now = Date.now();
      const xpCooldown = 45000;
      if (!user.profile.lastXpGain || now - user.profile.lastXpGain >= xpCooldown) {
        let xpGained = 0;
        if (message.content.startsWith(prefix) || message.content.startsWith(prefix.toLowerCase())) {
          xpGained = getRandomXp(8, 10);
        } else {
          xpGained = getRandomXp(3, 5);
        }

        user.profile.exp += xpGained;
        user.profile.lastXpGain = now;

        const nextLevelXp = calculateNextLevelXpBonus(user.profile.level);
        if (user.profile.exp >= nextLevelXp) {
          user.profile.exp -= nextLevelXp;
          user.profile.level += 1;
          user.profile.levelExp = calculateNextLevelXpBonus(user.profile.level);

          const celebrationCoin = user.profile.level * 1000;
          user.balance.coin += celebrationCoin;

          const newLimits = getLimitsForLevel(user.profile.level);
          user.dailyLimits.transferLimit = newLimits.send;
          user.dailyLimits.receiveLimit = newLimits.receive;

          const levelIndex = Math.min(user.profile.level - 1, Level_Background.length - 1);
          const backgroundImage = Level_Background[levelIndex];

          const levelUp = await new canvafy.LevelUp()
              .setAvatar(message.author.displayAvatarURL({ format: 'png', size: 512 }))
              .setBackground("image", backgroundImage)
              .setUsername(`${message.author.username}`)
              .setBorder("#000000")
              .setLevels(user.profile.level - 1, user.profile.level)
              .build();

          const levelImage = {
            attachment: levelUp,
            name: 'level-up.png',
          };

          const embed = this.client.embed()
              .setColor(this.client.color.main)
              .setTitle(`𝐋𝐄𝐕𝐄𝐋 𝐔𝐏 !`)
              .setDescription(`Congratulations ${message.author.displayName}!\n
                    You leveled up to level ${user.profile.level}!\n
                    You have been awarded ${this.client.utils.formatNumber(celebrationCoin)} ${this.client.emote.coin}.`)
              .setThumbnail(message.author.displayAvatarURL({ format: 'png', size: 512 }))
              .setImage('attachment://level-up.png');

          await message.channel.send({
            embeds: [embed],
            files: [levelImage],
          });
        }
        await user.save();
      }
    }

    const mention = new RegExp(`^<@!?${this.client.user.id}>( |)$`);
    if (mention.test(message.content)) {
      await message.reply({
        embeds: [
          this.client.embed()
              .setColor(this.client.color.main)
              .setTitle(`Hello ${message.author.username}`)
              .setDescription(
                  `Prefix for this server is **\`${prefix}\`**.\n\n` +
                  `Need help? Use **\`${prefix}help\`** !\n` +
                  `[Invite Me](${this.client.config.links.invite}) **\`|\`** [Support Server](${this.client.config.links.support})`
              )
              .setFooter({
                text: `© ${this.client.user.username}`,
                iconURL: this.client.user.displayAvatarURL(),
              }),
        ],
      });
      return;
    }

    if (message.content.startsWith(prefix) || message.content.startsWith(prefix.toLowerCase())) {
      const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixRegex = new RegExp(`^(<@!?${this.client.user.id}>|${escapeRegex(prefix)})\\s*`, 'i');
      const match = prefixRegex.exec(message.content);
      const [, matchedPrefix] = match;
      const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      const command = this.client.commands.get(cmd) || this.client.commands.get(this.client.aliases.get(cmd));
      const ctx = new Context(message, args);
      ctx.setArgs(args);
      const permissionCommand = ['help', 'links', 'info', 'ping', 'rules', 'privacypolicy', 'stats']
      if (match) {
        if (!user && !permissionCommand.includes(command?.name)) {
          if (activeGames.has(ctx.author.id)) {
            return await ctx.sendMessage({
              embeds: [
                this.client.embed().setColor(this.client.color.orange).setDescription(`Your registration is not yet complete. Please confirm your registration to start using the bot.`),
              ],
            });
          }
          activeGames.set(ctx.author.id, true);

          const embed = this.client
              .embed()
              .setColor(this.client.color.main)
              .setTitle(`${emoji.ddMasterLeft} 𝐃𝐃 𝐌𝐀𝐒𝐓𝐄𝐑 ${emoji.ddMasterRight}`)
              .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
              .setDescription(
                  `It seems like you haven’t registered yet.\nPlease Click **Register** !!!\nFor read **Rules and Privacy Policy**\nTo start using the bot and earning rewards!`)
              .setImage(gif.peachy);

          const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                  .setCustomId('register')
                  .setLabel('Register')
                  .setStyle(3),
              new ButtonBuilder()
                  .setCustomId('cancel')
                  .setLabel('Cancel')
                  .setStyle(4)
          );

          const msg = await ctx.sendMessage({ embeds: [embed], components: [row], fetchReply: true });
          const filter = interaction => interaction.user.id === ctx.author.id;
          const collector = msg.createMessageComponentCollector({ filter, time: 150000 });

          collector.on('collect', async int => {
            await int.deferUpdate();

            if (int.customId === 'register') {
              try {
                const embed = this.client.embed()
                    .setColor(this.client.color.main)
                    .setTitle(`${emoji.ddMasterLeft} Welcome, ${ctx.author.displayName} ${emoji.ddMasterRight}`)
                    .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setDescription(
                        `Here are the guidelines we expect you to follow:\n\n`+
                        `**Rules and Guidelines**\n\n` +
                        `1. **Respect Others**: Respect others and their belongings. Any attempt to scam or deceive others using trade commands will result in a complete reset of your balance and inventory.\n\n` +
                        `2. **No Automation**: Usage of scripts or any form of automation to exploit the bot functionalities is strictly prohibited. Engaging in such activities will lead to a permanent blacklist.\n\n` +
                        `3. **Avoid Spamming**: Avoid spamming commands. Repeatedly using commands excessively or inappropriately will result in a complete balance reset. Continued violations will result in a blacklist.\n\n` +
                        `4. **Appropriate Behavior**: Use appropriate language and behavior. Any form of hate speech, harassment, or inappropriate behavior is not tolerated.\n\n` +
                        `5. **No Personal Information**: Do not share personal information or attempt to collect others' personal information.\n\n` +
                        `6. **Follow Discord's Terms**: Abide by the Discord Terms of Service and Community Guidelines at all times.\n\n` +
                        `7. **Respect Staff**: Respect the staff and their decisions. Any argument or disrespect towards staff will result in appropriate action.\n\n` +
                        `8. **No Advertising**: Do not advertise or promote external servers, products, or services without permission.\n\n` +
                        `9. **No Multiple Accounts**: Refrain from creating multiple accounts to exploit the bot's features.\n\n` +
                        `If you have any questions or concerns, feel free to join our [Support Server](https://discord.gg/ddgang) and ask for assistance.`
                    );

                await int.editReply({
                  content: '',
                  embeds: [embed],
                  components: [new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                          .setCustomId('confirm')
                          .setLabel('Accept for Register')
                          .setStyle(3),
                      new ButtonBuilder()
                          .setCustomId('privacy')
                          .setLabel('Privacy Policy')
                          .setStyle(2),
                      new ButtonBuilder()
                          .setCustomId('cancel')
                          .setLabel('Cancel')
                          .setStyle(4)
                  )]
                });
              } catch (error) {
                console.error('Error in Register Command:', error);
              }
            } else if (int.customId === 'privacy') {
              try {
                const embed = this.client.embed()
                    .setColor(this.client.color.main)
                    .setTitle(`${emoji.ddMasterLeft} Privacy Policy ${emoji.ddMasterRight}`)
                    .setDescription(
                        `**Introduction**\n` +
                        `DD Master is committed to protecting and respecting your privacy. This Privacy Policy explains what information we collect, how we use it, and how we protect it.\n\n` +
                        `**Information Collection**\n` +
                        `We collect the following types of information:\n` +
                        `• **User IDs**: To identify and interact with users.\n` +
                        `• **Messages**: For processing commands and providing responses.\n` +
                        `• **Server Information**: To customize the bot's functionality based on server settings.\n\n` +
                        `**Data Usage**\n` +
                        `We use the collected data to:\n` +
                        `• Process commands and interactions.\n` +
                        `• Improve and customize bot features.\n` +
                        `• Ensure the security and integrity of the bot.\n\n` +
                        `**Data Sharing**\n` +
                        `We do not share your data with third parties, except as required by law.\n\n` +
                        `**Data Security**\n` +
                        `We implement appropriate technical and organizational measures to protect your data from unauthorized access, use, or disclosure.\n\n` +
                        `**User Rights**\n` +
                        `You have the right to:\n` +
                        `• Request access to the data we hold about you.\n` +
                        `• Request the correction or deletion of your data.\n\n` +
                        `**Policy Changes**\n` +
                        `We may update this Privacy Policy from time to time. If there are any significant changes, we will announce them in our Discord server. Additionally, the new Privacy Policy will be posted on our bot's profile and help command.\n\n` +
                        `**Contact Information**\n` +
                        `If you have any questions or concerns about this Privacy Policy, please contact us by joining our support server.`
                    );

                await int.editReply({
                  content: '',
                  embeds: [embed],
                  components: [new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                          .setCustomId('confirm')
                          .setLabel('Accept for Register')
                          .setStyle(3),
                      new ButtonBuilder()
                          .setCustomId('register')
                          .setLabel('Rules and Guidelines')
                          .setStyle(2),
                      new ButtonBuilder()
                          .setCustomId('cancel')
                          .setLabel('Cancel')
                          .setStyle(4)
                  )]
                });
              } catch (error) {
                console.error('Error in Privacy Command:', error);
              }
            } else if (int.customId === 'register') {
              await int.update({
                content: '',
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm')
                        .setLabel('Accept for Register')
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId('privacy')
                        .setLabel('Privacy Policy')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('Cancel')
                        .setStyle(4)
                )]
              });
            } else if (int.customId === 'confirm') {
              const gift = 100000
              await Users.updateOne(
                  { userId: int.user.id },
                  {
                    $set: {
                      balance: {
                        coin: gift,
                        bank: 0
                      }
                    }
                  },
                  { upsert: true }
              );

              const embed = this.client.embed()
                  .setColor(this.client.color.main)
                  .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                  .setTitle(`${emoji.ddMasterLeft} 𝐃𝐃 𝐌𝐀𝐒𝐓𝐄𝐑 ${emoji.ddMasterRight}`)
                  .setDescription(`**${emoji.congratulation} Congratulations!!! u got ${this.client.utils.formatNumber(gift)} ${this.client.emote.coin}**\nYou have successfully registered! You can now use the bot.`);
              await int.editReply({
                content: '',
                embeds: [embed],
                components: [],
              });
              activeGames.delete(ctx.author.id);
            } else if (int.customId === 'cancel') {
              const commandList = `
**Commands You Can Use:**
- \`${this.client.config.prefix}register\` - Register for a feature or service.
- \`${this.client.config.prefix}info\` - Get information about the bot.
- \`${this.client.config.prefix}help\` - List all available commands.
- \`${this.client.config.prefix}stats\` - View server or user statistics.
`;
              await int.editReply({
                embeds: [
                  this.client.embed()
                      .setColor(this.client.color.main)
                      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                      .setTitle(`${emoji.ddMasterLeft} Thank You ${ctx.author.displayName} ${emoji.ddMasterRight}`)
                      .setDescription(`Registration has been canceled.\n\nYou can register again by using the command \`${this.client.config.prefix}register\`.\n\nHere are some other commands you might find useful:\n${commandList}`)
                ],
                components: [],
              });
              activeGames.delete(ctx.author.id);
            }
          })
          collector.on('end', async () => {
            await msg.edit({ components: [new ActionRowBuilder().addComponents(row.components.map(c => c.setDisabled(true)))] });
          });
        } else {

          if (!command) return;

          if (command.permissions) {
            if (command.permissions.client && !message.guild.members.me.permissions.has(command.permissions.client)) {
              return await message.reply({
                content: "I don't have enough permissions to execute this command.",
              });
            }
            if (command.permissions.user && !message.member.permissions.has(command.permissions.user)) {
              return await message.reply({
                content: "You don't have enough permissions to use this command.",
              });
            }
            if (command.permissions.dev && !this.client.config.owners.includes(message.author.id)) {
              return;
            }
          }

          if (command.args && !args.length) {
            const embed = this.client
                .embed()
                .setColor(this.client.color.red)
                .setTitle('Missing Arguments')
                .setDescription(`Please provide the required arguments for the \`${command.name}\` command.`)
                .addFields([
                  {
                    name: `Usage`,
                    value: `\`\`\`arm\n${command.description.usage}\n\`\`\``,
                    inline: false,
                  },
                  {
                    name: `Examples`,
                    value: `\`\`\`arm\n${command.description.examples ? command.description.examples.join('\n') : 'None'}\n\`\`\``,
                    inline: false,
                  },
                ])
                .setFooter({ text: 'Syntax: [] = optional, <> = required' });
            return await message.reply({ embeds: [embed] });
          }

          if (!this.client.cooldown.has(cmd)) {
            this.client.cooldown.set(cmd, new Collection());
          }
          const now = Date.now();
          const timestamps = this.client.cooldown.get(cmd);
          const cooldownAmount = Math.floor(command.cooldown || 5) * 1000;
          if (!timestamps.has(message.author.id)) {
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
          } else {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            const timeLeft = (expirationTime - now) / 1000;
            if (now < expirationTime && timeLeft > 0.9) {
              return await message.reply({
                content: `Please wait \`${timeLeft.toFixed(1)}\` more second(s) before reusing the **${cmd}** command.`,
              });
            }
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
          }

          if (args.includes('@everyone') || args.includes('@here')) {
            return await message.reply({
              content: "You can't use this command with everyone or here.",
            });
          }

          const balanceCommands = ['balance', 'deposit', 'transfer', 'buy', 'sell'];
          const gameCommands = ['slots', 'coinflip', 'klaklouk', 'blackjack', 'pav'];

          try {
            let logChannelId;
            if (balanceCommands.includes(command.name)) {
              logChannelId = this.client.config.logChannelId[2];
            } else if (gameCommands.includes(command.name)) {
              logChannelId = this.client.config.logChannelId[1];
            } else {
              logChannelId = this.client.config.logChannelId[0];
            }

            const channel = this.client.channels.cache.get(logChannelId);
            if (channel && channel.isTextBased()) {
              const embed = this.client
                  .embed()
                  .setColor(this.client.config.color.green)
                  .setTitle(`Command - ${formatCapitalize(command.name)}`)
                  .setThumbnail(message.guild.iconURL({ extension: 'jpeg' }))
                  .addFields([
                    {
                      name: 'Author',
                      value: `**Name:** ${message.author.username}\n**Id:** ${message.author.id}\n**Channel:** ${message.channel.name}`,
                      inline: true,
                    },
                    {
                      name: 'Extra Guild Info',
                      value: `\`\`\`arm
[+] Name: ${message.guild.name}
[+] Id: ${message.guild.id}
[+] Members: ${message.guild.memberCount.toString()}
\`\`\``,
                    },
                  ])
                  .setFooter({
                    text: message.author.username,
                    iconURL: message.author.displayAvatarURL({ extension: 'jpeg' })
                  })
                  .setTimestamp();
              await channel.send({ embeds: [embed] }).catch(() => console.error('Error sending log message'));
            }

            return command.run(this.client, ctx, ctx.args);
          } catch (error) {
            console.error('Error executing command:', error);
            await BotLog.send(this.client, `An error occurred: \`${error.message}\``, 'error');
            await message.reply({ content: `An error occurred: \`${error.message}\`` });
          }
        }
      }
    }
  }
};