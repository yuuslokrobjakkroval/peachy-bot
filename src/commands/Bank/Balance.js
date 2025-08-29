const { Command } = require("../../structures");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const Users = require("../../schemas/user");
const globalGif = require("../../utils/Gif");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Balance extends Command {
  constructor(client) {
    super(client, {
      name: "balance",
      description: {
        content:
          "Check your balance with interactive deposit and withdrawal options.",
        examples: ["balance"],
        usage: "balance",
      },
      category: "bank",
      aliases: ["bal", "cash"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [],
    });

    this.activeModalHandlers = new Map();
    this.activeCollectors = new Map();
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      const generalMessages = language?.locales?.get(language.defaultLocale)
        ?.generalMessages || {
        userNotFound: "User not found in database.",
      };
      const balanceMessages =
        language?.locales?.get(language.defaultLocale)?.economyMessages
          ?.balanceMessages || {};

      // Check if user is trying to check another user's balance
      if (
        args?.length > 0 ||
        (ctx.isInteraction && ctx.interaction.options.getUser("user")) ||
        ctx.message?.mentions?.users?.size > 0
      ) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          "You are not allowed to check another user's balance.",
          color,
        );
      }

      const user = await client.utils.getUser(ctx.author.id);
      if (!user) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userNotFound || "User not found.",
          color,
        );
      }

      const { coin = 0, bank = 0, credit = 0 } = user.balance || {};
      const netWorth = coin + bank;

      if (client.achievementManager) {
        await client.achievementManager.checkEconomyAchievements(
          ctx.author.id,
          netWorth,
        );
      }

      const embed = this.createBalanceEmbed(
        client,
        ctx,
        ctx.author,
        user,
        color,
        emoji,
        generalMessages,
        balanceMessages,
      );
      const components = this.createBalanceButtons(emoji);
      const message = await ctx.sendMessage({ embeds: [embed], components });

      this.handleBalanceInteractions(
        client,
        ctx,
        message,
        user,
        color,
        emoji,
        language,
      );
    } catch (error) {
      return ctx.sendMessage({
        content: "An error occurred while processing your request.",
      });
    }
  }

  createBalanceEmbed(
    client,
    ctx,
    user,
    userData,
    color,
    emoji,
    generalMessages,
    balanceMessages,
  ) {
    const { coin = 0, bank = 0, credit = 0 } = userData.balance || {};
    const titleTemplate = generalMessages?.title;
    const descriptionTemplate = balanceMessages?.description;

    return client
      .embed()
      .setColor(color.main || "#5865F2")
      .setThumbnail(
        globalGif.balanceThumbnail
          ? globalGif.balanceThumbnail
          : client.utils.emojiToImage(emoji.main || "💰"),
      )
      .setDescription(
        titleTemplate
          .replace("%{mainLeft}", emoji.mainLeft || "")
          .replace("%{title}", `BALANCE`)
          .replace("%{mainRight}", emoji.mainRight || "") +
          descriptionTemplate
            .replace("%{coinEmote}", emoji.coin || "💰")
            .replace("%{coin}", client.utils.formatNumber(coin))
            .replace("%{bankEmote}", emoji.bank || "🏦")
            .replace("%{bank}", client.utils.formatNumber(bank)),
      )
      .setImage(globalGif.balanceBanner)
      .setFooter({
        text: (
          generalMessages?.requestedBy || "Requested by %{username}"
        ).replace("%{username}", ctx.author.displayName),
        iconURL: ctx.author.displayAvatarURL(),
      });
  }

  createBalanceButtons(emoji, disabled = false) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("deposit")
        .setLabel("Deposit")
        .setEmoji(emoji.bank || "🏦")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("withdraw")
        .setLabel("Withdraw")
        .setEmoji(emoji.coin || "💰")
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
    );

    return [row];
  }

  async handleBalanceInteractions(
    client,
    ctx,
    message,
    user,
    color,
    emoji,
    language,
  ) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    const balanceMessages = language.locales.get(language.defaultLocale)
      ?.economyMessages?.balanceMessages;

    const commandInstanceId = `balance_${ctx.author.id}_${Date.now()}`;
    this.setupModalHandler(
      client,
      ctx,
      commandInstanceId,
      color,
      emoji,
      language,
      message,
    );

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
    });

    this.activeCollectors.set(commandInstanceId, collector);

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ctx.author.id) {
        await interaction.reply({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "This balance menu belongs to someone else. Please use the balance command yourself.",
              ),
          ],
          flags: 64,
        });
        return;
      }

      try {
        await interaction.deferUpdate().catch(() => {});
        const updatedUser = await client.utils.getUser(ctx.author.id);
        if (!updatedUser) {
          await interaction.followUp({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(generalMessages.userNotFound),
            ],
            flags: 64,
          });
          return;
        }

        switch (interaction.customId) {
          case "deposit":
            await this.handleDepositDirectly(
              client,
              ctx,
              interaction,
              updatedUser,
              color,
              emoji,
              language,
              message,
            );
            break;
          case "withdraw":
            await this.handleWithdrawDirectly(
              client,
              ctx,
              interaction,
              updatedUser,
              color,
              emoji,
              language,
              message,
            );
            break;
        }
      } catch (error) {
        try {
          await interaction.followUp({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(
                  "An error occurred while processing your request.",
                ),
            ],
            flags: 64,
          });
        } catch (followUpError) {}
      }
    });

    collector.on("end", () => {
      const disabledComponents = this.createBalanceButtons(emoji).map((row) => {
        const newRow = ActionRowBuilder.from(row);
        newRow.components.forEach((component) => component.setDisabled(true));
        return newRow;
      });

      message.edit({ components: disabledComponents }).catch(() => {});
      this.cleanupModalHandler(client, commandInstanceId);
      this.activeCollectors.delete(commandInstanceId);
    });
  }

  setupModalHandler(
    client,
    ctx,
    commandInstanceId,
    color,
    emoji,
    language,
    message,
  ) {
    const modalHandler = async (interaction) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.includes(commandInstanceId)) return;

      try {
        await interaction.deferUpdate().catch(() => {});
        const updatedUser = await client.utils.getUser(ctx.author.id);

        if (interaction.customId.startsWith("deposit_modal_")) {
          const amount = interaction.fields
            .getTextInputValue("deposit_amount")
            .replace(/,/g, "");
          const parsedAmount = Number.parseInt(amount);

          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            await interaction
              .followUp({
                embeds: [
                  client
                    .embed()
                    .setColor(color.danger)
                    .setDescription("Please enter a valid amount."),
                ],
                flags: 64,
              })
              .catch(() => {});
            return;
          }

          await this.processDeposit(
            client,
            ctx,
            interaction,
            updatedUser,
            parsedAmount,
            color,
            emoji,
            language,
            message,
          );
        }

        if (interaction.customId.startsWith("withdraw_modal_")) {
          const amount = interaction.fields
            .getTextInputValue("withdraw_amount")
            .replace(/,/g, "");
          const parsedAmount = Number.parseInt(amount);

          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            await interaction
              .followUp({
                embeds: [
                  client
                    .embed()
                    .setColor(color.danger)
                    .setDescription("Please enter a valid amount."),
                ],
                flags: 64,
              })
              .catch(() => {});
            return;
          }

          await this.processWithdraw(
            client,
            ctx,
            interaction,
            updatedUser,
            parsedAmount,
            color,
            emoji,
            language,
            message,
          );
        }
      } catch (error) {
        try {
          await interaction.followUp({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(
                  "An error occurred while processing your request.",
                ),
            ],
            flags: 64,
          });
        } catch (followUpError) {}
      }
    };

    this.activeModalHandlers.set(commandInstanceId, modalHandler);
    client.on("interactionCreate", modalHandler);
  }

  cleanupModalHandler(client, commandInstanceId) {
    const handler = this.activeModalHandlers.get(commandInstanceId);
    if (handler) {
      client.removeListener("interactionCreate", handler);
      this.activeModalHandlers.delete(commandInstanceId);
    }
  }

  async handleDepositDirectly(
    client,
    ctx,
    interaction,
    user,
    color,
    emoji,
    language,
    message,
  ) {
    try {
      if (message) {
        const disabledEmbed = this.createBalanceEmbed(
          client,
          ctx,
          ctx.author,
          user,
          color,
          emoji,
          language?.locales?.get(language.defaultLocale)?.generalMessages || {},
          language?.locales?.get(language.defaultLocale)?.economyMessages
            ?.balanceMessages || {},
        );

        await message
          .edit({
            embeds: [disabledEmbed],
            components: this.createBalanceButtons(emoji, true),
          })
          .catch(() => {});
      }

      const depositMessages =
        language?.locales?.get(language.defaultLocale)?.economyMessages
          ?.depositMessages || {};
      const generalMessages =
        language?.locales?.get(language.defaultLocale)?.generalMessages || {};
      const balanceMessages =
        language?.locales?.get(language.defaultLocale)?.economyMessages
          ?.balanceMessages || {};

      if (user.balance.coin <= 0) {
        if (message) {
          await message
            .edit({
              embeds: [message.embeds[0]],
              components: this.createBalanceButtons(emoji, false),
            })
            .catch(() => {});
        }

        await interaction.followUp({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                `${emoji?.error || "❌"} You don't have any coins to deposit.`,
              ),
          ],
          flags: 64,
        });
        return;
      }

      const depositEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji?.bank || "🏦"} Deposit Options`)
        .setDescription(
          `Select an option to deposit coins to your bank.\nYou have **${client.utils.formatNumber(
            user.balance.coin,
          )}** coins in your wallet.`,
        );

      const uniqueId = Date.now().toString();
      const depositAllId = `deposit_all_${uniqueId}`;
      const depositHalfId = `deposit_half_${uniqueId}`;
      const cancelId = `deposit_cancel_${uniqueId}`;

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(depositAllId)
          .setLabel("Deposit All")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(depositHalfId)
          .setLabel("Deposit Half")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(cancelId)
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger),
      );

      const reply = await interaction.followUp({
        embeds: [depositEmbed],
        components: [actionRow],
      });

      const filter = (i) => {
        const isCorrectUser = i.user.id === ctx.author.id;
        const isCorrectButton =
          i.customId === depositAllId ||
          i.customId === depositHalfId ||
          i.customId === cancelId;
        return isCorrectUser && isCorrectButton;
      };

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 60000,
        componentType: ComponentType.Button,
        max: 1,
      });

      collector.on("collect", async (buttonInteraction) => {
        try {
          if (
            buttonInteraction.customId === depositAllId ||
            buttonInteraction.customId === depositHalfId
          ) {
            const disabledButtonsRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(depositAllId)
                .setLabel("Deposit All")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(depositHalfId)
                .setLabel("Deposit Half")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(cancelId)
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(false),
            );

            await reply
              .edit({
                embeds: [
                  depositEmbed.setFooter({
                    text: "Processing your deposit... Cancel is still available.",
                  }),
                ],
                components: [disabledButtonsRow],
              })
              .catch(() => {});
            await buttonInteraction.deferUpdate().catch(() => {});

            if (buttonInteraction.customId === depositAllId) {
              await this.processDeposit(
                client,
                ctx,
                buttonInteraction,
                user,
                user.balance.coin,
                color,
                emoji,
                language,
                message,
                reply,
              );
            } else if (buttonInteraction.customId === depositHalfId) {
              await this.processDeposit(
                client,
                ctx,
                buttonInteraction,
                user,
                Math.floor(user.balance.coin / 2),
                color,
                emoji,
                language,
                message,
                reply,
              );
            }
          } else if (buttonInteraction.customId === cancelId) {
            await buttonInteraction.deferUpdate().catch(() => {});
            const cancelEmbed = client
              .embed()
              .setColor(color.danger || "#ff0000")
              .setTitle(`${emoji?.bank || "🏦"} Deposit Canceled`)
              .setDescription("The deposit operation has been canceled.");
            const disabledRow = ActionRowBuilder.from(actionRow);
            disabledRow.components.forEach((component) =>
              component.setDisabled(true),
            );
            await reply
              .edit({ embeds: [cancelEmbed], components: [disabledRow] })
              .catch(() => {});
            setTimeout(() => reply.delete().catch(() => {}), 3000);
          }
        } catch (error) {
          await buttonInteraction
            .followUp({
              embeds: [
                client
                  .embed()
                  .setColor(color.danger)
                  .setDescription(
                    "An error occurred while processing your request.",
                  ),
              ],
              flags: 64,
            })
            .catch(() => {});
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          const disabledRow = ActionRowBuilder.from(actionRow);
          disabledRow.components.forEach((component) =>
            component.setDisabled(true),
          );
          reply
            .edit({
              embeds: [
                depositEmbed.setFooter({
                  text: "This menu has expired. Use the deposit button again.",
                }),
              ],
              components: [disabledRow],
            })
            .catch(() => {});
        }
      });
    } catch (error) {
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "An error occurred while creating deposit options. Please try again.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
    }
  }

  async handleWithdrawDirectly(
    client,
    ctx,
    interaction,
    user,
    color,
    emoji,
    language,
    message,
  ) {
    try {
      if (message) {
        const disabledEmbed = this.createBalanceEmbed(
          client,
          ctx,
          ctx.author,
          user,
          color,
          emoji,
          language?.locales?.get(language.defaultLocale)?.generalMessages || {},
          language?.locales?.get(language.defaultLocale)?.economyMessages
            ?.balanceMessages || {},
        );
        await message
          .edit({
            embeds: [disabledEmbed],
            components: this.createBalanceButtons(emoji, true),
          })
          .catch(() => {});
      }

      if (user.balance.bank <= 0) {
        if (message) {
          await message
            .edit({
              embeds: [message.embeds[0]],
              components: this.createBalanceButtons(emoji, false),
            })
            .catch(() => {});
        }
        await interaction
          .followUp({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(
                  `${
                    emoji?.error || "❌"
                  } You don't have any coins in your bank to withdraw.`,
                ),
            ],
            flags: 64,
          })
          .catch(() => {});
        return;
      }

      const withdrawEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji?.coin || "💰"} Withdraw Options`)
        .setDescription(
          `Select an option to withdraw coins from your bank.\nYou have **${client.utils.formatNumber(
            user.balance.bank,
          )}** coins in your bank.`,
        );

      const uniqueId = Date.now().toString();
      const withdrawAllId = `withdraw_all_${uniqueId}`;
      const withdrawHalfId = `withdraw_half_${uniqueId}`;
      const cancelId = `withdraw_cancel_${uniqueId}`;

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(withdrawAllId)
          .setLabel("Withdraw All")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(withdrawHalfId)
          .setLabel("Withdraw Half")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(cancelId)
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger),
      );

      const reply = await interaction.followUp({
        embeds: [withdrawEmbed],
        components: [actionRow],
      });

      const filter = (i) => {
        const isCorrectUser = i.user.id === ctx.author.id;
        const isCorrectButton =
          i.customId === withdrawAllId ||
          i.customId === withdrawHalfId ||
          i.customId === cancelId;
        return isCorrectUser && isCorrectButton;
      };

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 60000,
        componentType: ComponentType.Button,
        max: 1,
      });

      collector.on("collect", async (buttonInteraction) => {
        try {
          if (
            buttonInteraction.customId === withdrawAllId ||
            buttonInteraction.customId === withdrawHalfId
          ) {
            const disabledButtonsRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(withdrawAllId)
                .setLabel("Withdraw All")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(withdrawHalfId)
                .setLabel("Withdraw Half")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(cancelId)
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(false),
            );

            await reply
              .edit({
                embeds: [
                  withdrawEmbed.setFooter({
                    text: "Processing your withdrawal... Cancel is still available.",
                  }),
                ],
                components: [disabledButtonsRow],
              })
              .catch(() => {});
            await buttonInteraction.deferUpdate().catch(() => {});

            if (buttonInteraction.customId === withdrawAllId) {
              await this.processWithdraw(
                client,
                ctx,
                buttonInteraction,
                user,
                user.balance.bank,
                color,
                emoji,
                language,
                message,
                reply,
              );
            } else if (buttonInteraction.customId === withdrawHalfId) {
              await this.processWithdraw(
                client,
                ctx,
                buttonInteraction,
                user,
                Math.floor(user.balance.bank / 2),
                color,
                emoji,
                language,
                message,
                reply,
              );
            }
          } else if (buttonInteraction.customId === cancelId) {
            await buttonInteraction.deferUpdate().catch(() => {});
            const cancelEmbed = client
              .embed()
              .setColor(color.danger || "#ff0000")
              .setTitle(`${emoji?.coin || "💰"} Withdrawal Canceled`)
              .setDescription("The withdrawal operation has been canceled.");
            const disabledRow = ActionRowBuilder.from(actionRow);
            disabledRow.components.forEach((component) =>
              component.setDisabled(true),
            );
            await reply
              .edit({ embeds: [cancelEmbed], components: [disabledRow] })
              .catch(() => {});
            setTimeout(() => reply.delete().catch(() => {}), 3000);
          }
        } catch (error) {
          await buttonInteraction
            .followUp({
              embeds: [
                client
                  .embed()
                  .setColor(color.danger)
                  .setDescription(
                    "An error occurred while processing your request.",
                  ),
              ],
              flags: 64,
            })
            .catch(() => {});
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          const disabledRow = ActionRowBuilder.from(actionRow);
          disabledRow.components.forEach((component) =>
            component.setDisabled(true),
          );
          reply
            .edit({
              embeds: [
                withdrawEmbed.setFooter({
                  text: "This menu has expired. Use the withdraw button again.",
                }),
              ],
              components: [disabledRow],
            })
            .catch(() => {});
        }
      });
    } catch (error) {
      if (user.balance.bank <= 0) {
        await interaction
          .followUp({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(
                  `${
                    emoji?.error || "❌"
                  } You don't have any coins in your bank to withdraw.`,
                ),
            ],
            flags: 64,
          })
          .catch(() => {});
        return;
      }

      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color?.error || "#ff0000")
              .setDescription(
                "An error occurred while creating withdraw options. Please try again.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
    }
  }

  async processDeposit(
    client,
    ctx,
    interaction,
    user,
    amount,
    color,
    emoji,
    language,
    message,
    originalReply = null,
  ) {
    const depositMessages = language?.locales?.get(language.defaultLocale)
      ?.economyMessages?.depositMessages || {
      success: "You have deposited **{amount}** {bankEmote} to your bank.",
      errors: {
        invalidAmount:
          "Invalid amount. Please enter a valid number or use 'all' or 'half'.",
        notEnoughCoins:
          "You cannot deposit more than what you have in your wallet.",
      },
    };
    const generalMessages =
      language?.locales?.get(language.defaultLocale)?.generalMessages || {};
    const balanceMessages =
      language?.locales?.get(language.defaultLocale)?.economyMessages
        ?.balanceMessages || {};

    if (amount <= 0) {
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                depositMessages.errors?.invalidAmount || "Invalid amount.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
      return;
    }

    if (amount > user.balance.coin) {
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                depositMessages.errors?.notEnoughCoins ||
                  "You don't have enough coins.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
      return;
    }

    try {
      await Users.findOneAndUpdate(
        { userId: user.userId },
        {
          $inc: {
            "balance.coin": -amount,
            "balance.bank": amount,
          },
        },
      );

      const updatedUser = await client.utils.getUser(user.userId);
      if (originalReply) {
        try {
          await originalReply.delete();
        } catch (deleteError) {}
      }

      const successMessage = await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.success)
              .setTitle(`${emoji?.bank || "🏦"} Deposit Successful`)
              .setDescription(
                (
                  depositMessages.success ||
                  "You have deposited **{amount}** {bankEmote} to your bank."
                )
                  .replace("{amount}", client.utils.formatNumber(amount))
                  .replace("{bankEmote}", emoji?.bank || "🏦")
                  .replace(
                    "{bank}",
                    client.utils.formatNumber(updatedUser.balance.bank),
                  ),
              ),
          ],
          flags: 0,
        })
        .catch(() => {});

      if (successMessage) {
        setTimeout(() => successMessage.delete().catch(() => {}), 3000);
      }

      if (message) {
        const refreshedEmbed = this.createBalanceEmbed(
          client,
          ctx,
          ctx.author,
          updatedUser,
          color,
          emoji || {},
          generalMessages,
          balanceMessages,
        );
        await message
          .edit({
            embeds: [refreshedEmbed],
            components: this.createBalanceButtons(emoji || {}, false),
          })
          .catch(() => {});
      }
    } catch (error) {
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.error)
              .setDescription(
                "An error occurred while processing your deposit.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
    }
  }

  async processWithdraw(
    client,
    ctx,
    interaction,
    user,
    amount,
    color,
    emoji,
    language,
    message,
    originalReply = null,
  ) {
    const withdrawMessages = language?.locales?.get(language.defaultLocale)
      ?.economyMessages?.withdrawMessages || {
      success: "You have withdrawn **{amount}** {coinEmote} from your bank.",
      errors: {
        invalidAmount:
          "Invalid amount. Please enter a valid number or use 'all' or 'half'.",
        notEnoughCoins:
          "You cannot withdraw more than what you have in your bank.",
      },
    };
    const generalMessages =
      language?.locales?.get(language.defaultLocale)?.generalMessages || {};
    const balanceMessages =
      language?.locales?.get(language.defaultLocale)?.economyMessages
        ?.balanceMessages || {};

    if (amount <= 0) {
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                withdrawMessages.errors?.invalidAmount || "Invalid amount.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
      return;
    }

    if (amount > user.balance.bank) {
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                withdrawMessages.errors?.notEnoughCoins ||
                  "You don't have enough coins in your bank.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
      return;
    }

    try {
      await Users.findOneAndUpdate(
        { userId: user.userId },
        {
          $inc: {
            "balance.coin": amount,
            "balance.bank": -amount,
          },
        },
      );

      const updatedUser = await client.utils.getUser(user.userId);
      if (originalReply) {
        try {
          await originalReply.delete();
        } catch (deleteError) {}
      }

      const successMessage = await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.success)
              .setTitle(`${emoji?.coin || "💰"} Withdrawal Successful`)
              .setDescription(
                (
                  withdrawMessages.success ||
                  "You have withdrawn **{amount}** {coinEmote} from your bank."
                )
                  .replace("{amount}", client.utils.formatNumber(amount))
                  .replace("{coinEmote}", emoji?.coin || "💰")
                  .replace(
                    "{coin}",
                    client.utils.formatNumber(updatedUser.balance.coin),
                  ),
              ),
          ],
          flags: 0,
        })
        .catch(() => {});

      if (successMessage) {
        setTimeout(() => successMessage.delete().catch(() => {}), 3000);
      }

      if (message) {
        const refreshedEmbed = this.createBalanceEmbed(
          client,
          ctx,
          ctx.author,
          updatedUser,
          color,
          emoji,
          generalMessages,
          balanceMessages,
        );
        await message
          .edit({
            embeds: [refreshedEmbed],
            components: this.createBalanceButtons(emoji, false),
          })
          .catch(() => {});
      }
    } catch (error) {
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "An error occurred while processing your withdrawal.",
              ),
          ],
          flags: 64,
        })
        .catch(() => {});
    }
  }
};
