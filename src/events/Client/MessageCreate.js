const { Collection } = require('discord.js');
const { Context, Event } = require('../../structures/index.js');
const BotLog = require('../../utils/BotLog.js');
const Users = require("../../schemas/user.js");
const gif = require('../../utils/Gif.js');

module.exports = class MessageCreate extends Event {
  constructor(client, file) {
    super(client, file, {
      name: 'messageCreate',
    });
  }

  async run(message) {
    if (message.author.bot || !message.guild) return;

    this.client.setColorBasedOnTheme(message.author.id).then(({user, color, emoji, language}) => {
      const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
      const prefix = this.client.config.prefix;
      this.client.utils.getCheckingUser(this.client, message, user, color, emoji, prefix);
      const mention = new RegExp(`^<@!?${this.client.user.id}>( |)$`);
      if (mention.test(message.content)) {

        const embed = this.client.embed()
            .setColor(color.main)
            .setTitle(`Heyoo! ${message.author.displayName}`)
            .setDescription(
                `My Name is ${this.client.user.displayName}.\n` +
                `My prefix for this server is **\`${prefix}\`**.\n\n` +
                `Do you need help? please use **\`${prefix}help\`**!!!`
            )
            .setFooter({
              text: generalMessages.copyRight,
              iconURL: this.client.user.displayAvatarURL(),
            })

        const clickSuppButton = this.client.utils.linkButton('Click for support', this.client.config.links.support)

        const row = this.client.utils.createButtonRow(clickSuppButton);
        return message.reply({ embeds: [embed], components: [row] });
      }

      if (message.content.startsWith(prefix) || message.content.startsWith(prefix.toLowerCase())) {
        const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const prefixRegex = new RegExp(`^(<@!?${this.client.user.id}>|${escapeRegex(prefix)})\\s*`, 'i');
        const match = prefixRegex.exec(message.content);
        const [, matchedPrefix] = match;
        const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();
        const command = this.client.commands.get(cmd) || this.client.commands.get(this.client.aliases.get(cmd));
        if (!command) {
          return;
        }
        const ctx = new Context(message, args);
        ctx.setArgs(args);
        const permissionCommand = ['help', 'links', 'info', 'ping', 'rules', 'privacypolicy', 'stats']
        if (match) {
          if (!user && !permissionCommand.includes(command.name)) {
            const embed = this.client
                .embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft}  𝐏𝐄𝐀𝐂𝐇𝐘  ${emoji.mainRight}`)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(
                    `It seems like you haven’t registered yet.\nPlease Click **Register** !!!\nFor read **Rules and Privacy Policy**\nTo start using the bot and earning rewards!`)
                .setImage(gif.peachy);

            const registerButton = this.client.utils.labelButton('register', 'Register', 3);
            const cancelButton = this.client.utils.labelButton('cancel', 'Cancel', 4);
            const row = this.client.utils.createButtonRow(registerButton, cancelButton)

            ctx.sendMessage({ embeds: [embed], components: [row], fetchReply: true }).then(msg => {
            const filter = interaction => interaction.user.id === ctx.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async int => {
              await int.deferUpdate();

              if (int.customId === 'register') {
                try {
                  const embed = this.client.embed()
                      .setColor(color.main)
                      .setTitle(`${emoji.mainLeft} 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ${emoji.mainRight}`)
                      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                      .setDescription(
                          `Welcome to the PEACHY community! Please take a moment to read and follow these guidelines to ensure a fun and respectful environment for everyone:\n\n` +
                          `**Rules and Guidelines**\n\n` +
                          `1. **Respect Everyone**: Treat everyone with kindness and respect. Scamming or deceiving others, especially through trade commands, will result in the complete reset of your balance and inventory.\n\n` +
                          `2. **No Automation or Cheating**: The use of scripts, bots, or any form of automation to exploit PEACHY's features is strictly prohibited. Violations will lead to a permanent blacklist.\n\n` +
                          `3. **Avoid Spamming**: Please avoid spamming commands. Excessive or inappropriate use will result in a balance reset. Continued spamming may lead to a permanent blacklist.\n\n` +
                          `4. **Be Courteous**: Use appropriate language and behavior. Hate speech, harassment, or any form of inappropriate behavior will not be tolerated.\n\n` +
                          `5. **Follow Discord’s Rules**: Always adhere to Discord’s Terms of Service and Community Guidelines. These are non-negotiable.\n\n` +
                          `If you have any questions or need assistance, feel free to join our [Support Server](https://discord.gg/wnhyvUD5Ze). We're here to help!`
                      );

                  const confirmButton = this.client.utils.labelButton('confirm', 'Accept for Register', 3);
                  const privacyButton = this.client.utils.labelButton('privacy', 'Privacy Policy', 2);
                  const cancelButton = this.client.utils.labelButton('cancel', 'Cancel', 4);

                  const row = this.client.utils.createButtonRow(confirmButton, privacyButton, cancelButton)
                  await int.editReply({ content: '', embeds: [embed], components: [row]});
                } catch (error) {
                  console.error('Error in Register Command:', error);
                }
              } else if (int.customId === 'privacy') {
                try {
                  const embed = this.client.embed()
                      .setColor(color.main)
                      .setTitle(`${emoji.mainLeft} 𝐏𝐑𝐈𝐕𝐀𝐂𝐘 𝐏𝐎𝐋𝐈𝐂𝐘 ${emoji.mainRight}`)
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

                  const confirmButton = this.client.utils.labelButton('confirm', 'Accept for Register', 3);
                  const registerButton = this.client.utils.labelButton('register', 'Rules and Guidelines', 2);
                  const cancelButton = this.client.utils.labelButton('cancel', 'Cancel', 4);

                  const row = this.client.utils.createButtonRow(confirmButton, registerButton, cancelButton)

                  await int.editReply({ content: '', embeds: [embed], components: [row] });
                } catch (error) {
                  console.error('Error in Privacy Command:', error);
                }
              } else if (int.customId === 'register') {

                const confirmButton = this.client.utils.labelButton('confirm', 'Accept for Register', 3);
                const privacyButton = this.client.utils.labelButton('privacy', 'Privacy Policy', 2);
                const cancelButton = this.client.utils.labelButton('cancel', 'Cancel', 4);

                const row = this.client.utils.createButtonRow(confirmButton, privacyButton, cancelButton)

                await int.update({ content: '', embeds: [embed], components: [row] });
              } else if (int.customId === 'confirm') {
                const gift = 500000;
                const userId = int.user ? int.user.id : message.author.id;
                const userInfo = await this.client.users.fetch(userId).catch(() => null);
                await Users.updateOne(
                    { userId },
                    {
                      $set: {
                        username: userInfo ? userInfo.displayName : 'Unknown',
                        'profile.username': userInfo ? userInfo.displayName : 'Unknown',
                        balance: {
                          coin: gift,
                          bank: 0
                        },
                      }
                    },
                    { upsert: true }
                );

                const embed = this.client.embed()
                    .setColor(color.main)
                    .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setTitle(`${emoji.mainLeft} 𝐏𝐄𝐀𝐂𝐇𝐘 ${emoji.mainRight}`)
                    .setDescription(`Warming Gift for you ${emoji.congratulation}\nDear ${ctx.author.displayName}!!\nYou got ${this.client.utils.formatNumber(gift)} ${emoji.coin} from 𝐏𝐄𝐀𝐂𝐇𝐘\n\nYou have successfully registered!\nYou can now use the bot.`)
                    .setImage(gif.peachy);
                await int.editReply({
                  content: '',
                  embeds: [embed],
                  components: [],
                });
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
                        .setColor(color.main)
                        .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                        .setTitle(`${emoji.mainLeft} 𝐓𝐇𝐀𝐍𝐊 𝐘𝐎𝐔 ${ctx.author.displayName} ${emoji.mainRight}`)
                        .setDescription(`Registration has been canceled.\n\nYou can register again by using the command \`${this.client.config.prefix}register\`.\n\nHere are some other commands you might find useful:\n${commandList}`)
                  ],
                  components: [],
                });
              }
            })
            collector.on('end', async () => {
              await msg.edit({ components: [] });
            });
            })
                .catch(error => {
                  console.error('Error in Register Command:', error);
                });
          } else {
            if(!!user) {
              this.client.users.fetch(user?.userId)
                  .then(userInfo => {
                    if (!user.username || user.username !== userInfo.displayName) {
                      user.username = userInfo ? userInfo.displayName : 'Unknown';

                      if (!user.isSaving) {
                        user.isSaving = true;  // Flag to indicate a save operation is in progress
                        user.save().then(() => {
                          user.isSaving = false; // Reset the flag once saving is done
                        }).catch(() => {
                          user.isSaving = false; // Reset the flag if saving fails
                        });
                      }
                    }
                  })
                  .catch(() => null);
            }

            if (!command) return;

            if (command.permissions) {
              if (command.permissions.client && !message.guild.members.me.permissions.has(command.permissions.client)) {
                return message.reply({
                  content: "I don't have enough permissions to execute this command.",
                });
              }
              if (command.permissions.user && !message.member.permissions.has(command.permissions.user)) {
                return message.reply({
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
                  .setColor(color.danger)
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
                  .setFooter({text: 'Syntax: [] = optional, <> = required'});
              return message.reply({embeds: [embed]});
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
                return message.reply({
                  content: `Please wait \`${timeLeft.toFixed(1)}\` more second(s) before reusing the **${cmd}** command.`,
                });
              }
              timestamps.set(message.author.id, now);
              setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
            }

            if (args.includes('@everyone') || args.includes('@here')) {
              return message.reply({
                content: language.noEveryoneOrHereUsage, // Use language file for message
              });
            }

            const balanceCommands = ['balance', 'deposit', 'withdraw', 'multitransfer', 'transfer', 'buy', 'sell'];
            const gamblingCommands = ['slots', 'blackjack', 'coinflip'];
            const gameCommands = ['guessnumber'];
            const mineCommands = ['eat', 'drink', 'shop', 'inventory', 'giveitem'];
            const utilityCommands = ['avatar', 'emoji', 'language', 'qr', 'serverinfo', 'theme', 'userinfo', 'verify'];
            const giveawaysCommands = ['giveaway', 'giveawayshopitem', 'reroll'];

            try {
              let logChannelId;
              if (giveawaysCommands.includes(command.name)) {
                logChannelId = this.client.config.logChannelId[6];
              } else if (utilityCommands.includes(command.name)) {
                logChannelId = this.client.config.logChannelId[5];
              } else if (mineCommands.includes(command.name)) {
                logChannelId = this.client.config.logChannelId[4];
              } else if (balanceCommands.includes(command.name)) {
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
                const embed = this.client.embed()
                    .setColor(color.success)
                    .setTitle(`Command - ${this.client.utils.formatCapitalize(command.name)}`)
                    .setThumbnail(message.guild.iconURL({extension: 'jpeg'}))
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
                      iconURL: message.author.displayAvatarURL({extension: 'jpeg'})
                    })
                    .setTimestamp();
                channel.send({embeds: [embed]}).catch(() => console.error('Error sending log message'));
              }
              return command.run(this.client, ctx, ctx.args, color, emoji, language);
            } catch (error) {
              console.error('Error executing command:', error);
              BotLog.send(this.client, `An error occurred: \`${error.message}\``, 'error');
              message.reply({content: `An error occurred: \`${error.message}\``});
            }
          }
        }
      }
    })
  }
};