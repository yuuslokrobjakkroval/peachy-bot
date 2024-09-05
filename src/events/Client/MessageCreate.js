const { Collection, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { Context, Event } = require('../../structures/index.js');
const BotLog = require('../../utils/BotLog.js');
const Users = require("../../schemas/user.js");
const canvafy = require('canvafy');
const gif = require('../../utils/Gif.js');
const { formatCapitalize } = require('../../utils/Utils.js');
const transferLimits = require('../../utils/transferReceiveLimitUtil.js');

const activeGames = new Map();

function getLimitsForLevel(level) {
  const limit = transferLimits.find(limit => limit.level === level);
  return limit || { send: 0, receive: 0 };
}

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

    if (user) {
      const now = Date.now();
      const xpCooldown = 45000;
      if (!user.profile.lastXpGain || now - user.profile.lastXpGain >= xpCooldown) {
        let xpGained = 0;
        if (message.content.startsWith(prefix) || message.content.startsWith(prefix.toLowerCase())) {
          xpGained = getRandomXp(300, 500);
        } else {
          xpGained = getRandomXp(10, 15);
        }

        user.profile.xp += xpGained;
        user.profile.lastXpGain = now;

        const nextLevelXp = calculateNextLevelXpBonus(user.profile.level);
        if (user.profile.xp >= nextLevelXp) {
          user.profile.xp -= nextLevelXp;
          user.profile.level += 1;
          user.profile.levelExp = calculateNextLevelXpBonus(user.profile.level);

          const celebrationCoin = user.profile.level * 1000;
          user.balance.coin += celebrationCoin;

          const newLimits = getLimitsForLevel(user.profile.level);
          user.dailyLimits.transferLimit = newLimits.send;
          user.dailyLimits.receiveLimit = newLimits.receive;



          const levelUp = await new canvafy.LevelUp()
              .setAvatar(message.author.displayAvatarURL({ format: 'png', size: 512 }))
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
              .setThumbnail(message.author.displayAvatarURL({ format: 'png', size: 512 }))
              .setDescription(`Congratulations ${message.author.displayName}!\n
                    You leveled up to level ${user.profile.level}!\n
                    You have been awarded ${this.client.utils.formatNumber(celebrationCoin)} ${this.client.emote.coin}.`)
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
              .setTitle(`Hello ${message.author.displayName}`)
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
              .setTitle(`${this.client.emoji.mainLeft}  𝐏𝐄𝐀𝐂𝐇𝐘  ${this.client.emoji.mainRight}`)
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
                    .setTitle(`${this.client.emoji.mainLeft} 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ${this.client.emoji.mainRight}`)
                    .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setDescription(
                        `Welcome to the PEACHY community! Please take a moment to read and follow these guidelines to ensure a fun and respectful environment for everyone:\n\n` +
                        `**Rules and Guidelines**\n\n` +
                        `1. **Respect Everyone**: Treat everyone with kindness and respect. Scamming or deceiving others, especially through trade commands, will result in the complete reset of your balance and inventory.\n\n` +
                        `2. **No Automation or Cheating**: The use of scripts, bots, or any form of automation to exploit PEACHY's features is strictly prohibited. Violations will lead to a permanent blacklist.\n\n` +
                        `3. **Avoid Spamming**: Please avoid spamming commands. Excessive or inappropriate use will result in a balance reset. Continued spamming may lead to a permanent blacklist.\n\n` +
                        `4. **Be Courteous**: Use appropriate language and behavior. Hate speech, harassment, or any form of inappropriate behavior will not be tolerated.\n\n` +
                        `5. **Protect Privacy**: Never share personal information or attempt to collect others' personal information. Your privacy and safety are important to us.\n\n` +
                        `6. **Follow Discord’s Rules**: Always adhere to Discord’s Terms of Service and Community Guidelines. These are non-negotiable.\n\n` +
                        `7. **Respect the Staff**: Our staff is here to help maintain a positive environment. Please respect their decisions and cooperate with them.\n\n` +
                        `8. **No Advertising**: Do not promote external servers, products, or services without prior permission. Let's keep the focus on having fun!\n\n` +
                        `9. **One Account per User**: Creating multiple accounts to exploit PEACHY’s features is not allowed. Enjoy the bot responsibly.\n\n` +
                        `If you have any questions or need assistance, feel free to join our [Support Server](https://discord.gg/cCNZHVEbcu). We're here to help!`
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
                    .setTitle(`${this.client.emoji.mainLeft} 𝐏𝐑𝐈𝐕𝐀𝐂𝐘 𝐏𝐎𝐋𝐈𝐂𝐘 ${this.client.emoji.mainRight}`)
                    .setDescription(
                        `**Introduction**\n` +
                        `PEACHY is dedicated to ensuring your privacy and security while you enjoy our interactive features. This Privacy Policy details the types of information we collect, how we use it, and the steps we take to protect it.\n\n` +
                        `**Information Collection**\n` +
                        `We gather the following information to enhance your experience:\n` +
                        `• **User IDs**: Essential for identifying users and saving preferences across games, interactions, and relationship statuses.\n` +
                        `• **Messages**: Used to process your commands, manage game states, and provide customized responses.\n` +
                        `• **Server Information**: Collected to personalize bot features like custom emojis, game settings, and interaction styles.\n\n` +
                        `**Data Usage**\n` +
                        `We utilize your data to:\n` +
                        `• Execute commands, interactions, and maintain game progression.\n` +
                        `• Personalize features, from relationship tracking to game difficulty, based on your preferences.\n` +
                        `• Enhance the security and smooth operation of PEACHY, ensuring a seamless user experience.\n\n` +
                        `**Data Sharing**\n` +
                        `Your data is safe with us. We do not share your information with third parties, unless legally required.\n\n` +
                        `**Data Security**\n` +
                        `We implement stringent technical and organizational measures to safeguard your data from unauthorized access, alteration, or misuse.\n\n` +
                        `**User Rights**\n` +
                        `You have the right to:\n` +
                        `• Access the data we hold about you.\n` +
                        `• Request the correction or deletion of your data if it's inaccurate or no longer needed.\n\n` +
                        `**Policy Updates**\n` +
                        `We may update this Privacy Policy to reflect changes in our practices. Major updates will be announced in our Discord server, and the latest version will always be accessible via the bot’s profile and help command.\n\n` +
                        `**Contact Information**\n` +
                        `If you have any questions, concerns, or suggestions regarding this Privacy Policy, please reach out to us by joining our support server. We're here to help!`
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
              if (!user) {
                user = new Users({
                  userId: int.user.id
                });
                await user.save();
              }
              const embed = this.client.embed()
                  .setColor(this.client.color.main)
                  .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                  .setTitle(`${this.client.emoji.mainLeft} 𝐏𝐄𝐀𝐂𝐇𝐘 ${this.client.emoji.mainRight}`)
                  .setDescription(`${this.client.emoji.warming} Warming Gift for you,\nDear ${ctx.author.displayName}!!\nYou got ${this.client.utils.formatNumber(500000)} ${this.client.emote.coin} from 𝐏𝐄𝐀𝐂𝐇𝐘\n\nYou have successfully registered!\nYou can now use the bot.`)
                  .setImage(gif.thankYou)
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
                      .setTitle(`${this.client.emoji.mainLeft} 𝐓𝐇𝐀𝐍𝐊 𝐘𝐎𝐔 ${ctx.author.displayName} ${this.client.emoji.mainRight}`)
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

          const gameCommands = ['quiz', 'numbertrivia', 'guessnumber'];
          const gamblingCommands = ['slots', 'coinflip', 'klaklouk', 'blackjack', 'pav'];
          const balanceCommands = ['balance', 'deposit', 'transfer', 'buy', 'sell'];

          try {
            let logChannelId;
            if (balanceCommands.includes(command.name)) {
              logChannelId = this.client.config.logChannelId[3];
            } else if (gamblingCommands.includes(command.name)) {
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