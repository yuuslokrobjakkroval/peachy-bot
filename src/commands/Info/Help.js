const Command = require('../../structures/Command.js');
const globalConfig = require("../../utils/Config");

module.exports = class Help extends Command {
  constructor(client) {
    super(client, {
      name: 'help',
      description: {
        content: 'Displays the commands of the bot',
        examples: ['help'],
        usage: 'help',
      },
      category: 'info',
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

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const helpMessages = language.locales.get(language.defaultLocale)?.informationMessages?.helpMessages;
    const categoriesMessages = language.locales.get(language.defaultLocale)?.informationMessages?.helpMessages?.categoriesMessages;
    const directoriesMessages = language.locales.get(language.defaultLocale)?.informationMessages?.helpMessages?.directoriesMessages;
    const embed = client.embed();
    const prefix = globalConfig.prefix;
    const commands = client.commands.filter(cmd => cmd.category !== 'dev');
    let categories = ['actions', 'bank', 'economy', 'inventory', 'fun', 'games', 'gambling', 'giveaways', 'profile', 'social', 'utility', 'info'];

    if (!args[0]) {
      const sortedCommands = {};
      categories.forEach(category => {
        sortedCommands[category] = commands.filter(cmd => cmd.category.toLowerCase() === category.toLowerCase());
      });

      const helpEmbed = embed
          .setColor(color.main)
          .setTitle(`${emoji.mainLeft} ${helpMessages.title} ${emoji.mainRight}`)
          .setDescription(
              `${helpMessages.description} **\`${prefix}help [command]\`**\n` +
              `${helpMessages.examples} **\`${prefix}help balance\`**\n\n` +
              `${helpMessages.note}`
          )
          .setImage(client.config.links.banner)
          .setFooter({
            text: helpMessages.footer,
            iconURL: client.user.displayAvatarURL(),
          });

      for (const category in sortedCommands) {
        if (Object.prototype.hasOwnProperty.call(sortedCommands, category)) {
          const categoryCommands = sortedCommands[category];
          const commandNames = categoryCommands.map(cmd => `\`${directoriesMessages[cmd.name] || cmd.name}\``).join(', ');

          helpEmbed.addFields([{
            name: `${emoji.help[category.toLowerCase()]} ${categoriesMessages[category.toLowerCase()] || category}`,
            value: commandNames,
            inline: false,
          }]);

        }
      }

      const supportButton = client.utils.linkButton(generalMessages.supportButton, client.config.links.support)
      const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite)
      // const voteButton = client.utils.linkButton(generalMessages.voteButton, client.config.links.vote)
      const row = client.utils.createButtonRow(supportButton, inviteButton);

      await ctx.sendMessage({ embeds: [helpEmbed], components: [row], ephemeral: true });
    } else {
      const command = client.commands.get(args[0].toLowerCase());
      if (!command)
        return ctx.sendMessage({
          embeds: [client.embed().setColor(color.danger).setDescription(`${helpMessages.commandNotFound} \`${args[0]}\``)],
        });

      const helpEmbed = embed
          .setColor(color.main)
          .setTitle(`${commandTitle.title} - ${command.name}`)
          .setDescription(command.description.content)
          .addFields([
            {
              name: `${helpMessages.category}`,
              value: `${command.category}`,
              inline: false,
            },
            {
              name: `${helpMessages.aliases}`,
              value: `${command.aliases.map(alias => `\`${alias}\``).join(', ')}`,
              inline: false,
            },
            {
              name: `${helpMessages.cooldown}`,
              value: `\`[${client.utils.formatTime(command.cooldown)}]\``,
              inline: false,
            },
            {
              name: `${helpMessages.botPermissions}`,
              value: `${command.permissions.client.map(perm => `\`${perm}\``).join(', ')}`,
              inline: false,
            },
            {
              name: `${helpMessages.examples}`,
              value: `\`\`\`arm\n${command.description.examples.map(example => `${prefix}${example}`).join('\n')}\n\`\`\``,
              inline: false,
            },
          ]);

      await ctx.sendMessage({ embeds: [helpEmbed] });
    }
  }
};
