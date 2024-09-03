const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const font = {
  Actions: '𝐀𝐂𝐓𝐈𝐎𝐍𝐒',
  Economy: '𝐄𝐂𝐎𝐍𝐎𝐌𝐘',
  Task: '𝐓𝐀𝐒𝐊',
  Inventory: '𝐈𝐍𝐕𝐄𝐍𝐓𝐎𝐑𝐘',
  Gambling: '𝐆𝐀𝐌𝐁𝐋𝐈𝐍𝐆',
  Games: '𝐆𝐀𝐌𝐄𝐒',
  Giveaway: '𝐆𝐈𝐕𝐄𝐀𝐖𝐀𝐘',
  Profile: '𝐏𝐑𝐎𝐅𝐈𝐋𝐄',
  Social: '𝐒𝐎𝐂𝐈𝐀𝐋',
  Emotes: '𝐄𝐌𝐎𝐓𝐄𝐒',
  Utility: '𝐔𝐓𝐈𝐋𝐈𝐓𝐘',
  Info: '𝐈𝐍𝐅𝐎',
};

module.exports = class Help extends Command {
  constructor(client) {
    super(client, {
      name: 'help',
      description: {
        content: 'Displays the commands of the bot',
        examples: ['help'],
        usage: 'help',
      },
      category: 'information',
      aliases: ['h'],
      cooldown: 3,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: 'command',
          description: 'The command you want to get info on',
          type: 3,
          required: false,
        },
      ],
    });
  }
  async run(client, ctx, args) {
    const embed = client.embed();
    const prefix = client.config.prefix;

    const commands = client.commands.filter(cmd => cmd.category !== 'dev' && cmd.category !== 'giveaway');
    const categories = ['Actions', 'Economy', 'Task', 'Inventory', 'Games', 'Gambling', 'Profile', 'Social', 'Emotes', 'Utility', 'Info',];

    if (!args[0]) {
      const sortedCommands = {};
      categories.forEach(category => {
        sortedCommands[category] = commands.filter(cmd => cmd.category.toLowerCase() === category.toLowerCase());
      });

      const helpEmbed = embed
          .setColor(client.color.main)
          .setTitle(`${client.emoji.mainLeft} 𝐏𝐄𝐀𝐂𝐇𝐘 𝐇𝐞𝐥𝐩 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬 ${client.emoji.mainRight}`)
          .setDescription(
              `Use **\`${prefix}help [command]\`** to get more help!
Example: **\`${prefix}help balance\`**

Note that certain commands might display usernames in lists retrieved by the bot. Check command details for more information.`
          )
          .setImage(client.config.links.banner)
          .setFooter({
            text: `© 𝐂𝐨𝐩𝐲𝐫𝐢𝐠𝐡𝐭 𝐁𝐲 𝐊𝐘𝐔𝐔`,
            iconURL: client.user.displayAvatarURL(),
          });

      for (const category in sortedCommands) {
        if (Object.prototype.hasOwnProperty.call(sortedCommands, category)) {
          const categoryCommands = sortedCommands[category];
          const commandNames = categoryCommands.map(cmd => `\`${cmd.name}\``).join(', ');

          helpEmbed.addFields([
            {
              name: `${client.emote.help[category.toLowerCase()]} ${font[category]}`,
              value: commandNames,
              inline: false,
            },
          ]);
        }
      }

      const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('support-link').setLabel('Click for support').setStyle(1),
          new ButtonBuilder().setLabel('Invite me!').setStyle(5).setURL(client.config.links.invite),
          new ButtonBuilder().setLabel('Vote for me').setStyle(5).setURL(client.config.links.vote)
      );

      return await ctx.sendMessage({ embeds: [helpEmbed], components: [row], ephemeral: true });
    } else {
      const command = client.commands.get(args[0].toLowerCase());
      if (!command)
        return await ctx.sendMessage({
          embeds: [client.embed().setColor(client.color.red).setDescription(`Command \`${args[0]}\` not found`)],
        });

      const helpEmbed = embed
          .setColor(client.color.main)
          .setTitle(`Help - ${command.name}`)
          .setDescription(command.description.content)
          .addFields([
            {
              name: `Category`,
              value: `${command.category}`,
              inline: false,
            },
            {
              name: `Aliases:`,
              value: `${command.aliases.map(alias => `\`${alias}\``).join(', ')}`,
              inline: false,
            },
            {
              name: `Cooldown`,
              value: `\`[${client.utils.formatTime(command.cooldown)}]\``,
              inline: false,
            },
            {
              name: `Bot Permissions:`,
              value: `${command.permissions.client.map(perm => `\`${perm}\``).join(', ')}`,
              inline: false,
            },
            {
              name: 'Example(s):',
              value: `\`\`\`arm\n${command.description.examples.map(example => `${prefix.prefix}${example}`).join('\n')}\n\`\`\``,
              inline: false,
            },
          ]);

      await ctx.sendMessage({ embeds: [helpEmbed] });
    }
  }
};

