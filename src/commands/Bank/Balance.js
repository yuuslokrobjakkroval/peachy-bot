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
        examples: ["balance", "balance @user"],
        usage: "balance [user]",
      },
      category: "bank",
      aliases: ["bal", "money", "coins"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user to check balance for",
          type: 6,
          required: false,
        },
      ],
    });

    // Store active modal handlers to prevent duplicates
    this.activeModalHandlers = new Map();

    // Store active collectors to prevent duplicates and allow cleanup
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

      // Get target user
      const targetUser = ctx.isInteraction
        ? ctx.interaction.options.getUser("user") || ctx.author
        : ctx.message.mentions.users.first() || ctx.author;

      // Get user data
      const user = await client.utils.getUser(targetUser.id);
      if (!user) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userNotFound || "User not found.",
          color
        );
      }

      const { coin = 0, bank = 0, credit = 0 } = user.balance || {};
      const netWorth = coin + bank;

      if (targetUser.id === ctx.author.id && client.achievementManager) {
        await client.achievementManager.checkEconomyAchievements(
          targetUser.id,
          netWorth
        );
      }

      // Create the balance embed
      const embed = this.createBalanceEmbed(
        client,
        ctx,
        targetUser,
        user,
        color,
        emoji,
        generalMessages,
        balanceMessages
      );

      // Only add interactive buttons if viewing own balance
      if (targetUser.id === ctx.author.id) {
        const components = this.createBalanceButtons(emoji);
        const message = await ctx.sendMessage({ embeds: [embed], components });

        // Set up button collector
        this.handleBalanceInteractions(
          client,
          ctx,
          message,
          user,
          color,
          emoji,
          language
        );
      } else {
        // Just send the embed without buttons for other users
        return ctx.sendMessage({ embeds: [embed] });
      }
    } catch (error) {
      return ctx.sendMessage({
        content: "An error occurred while processing your request.",
      });
    }
  }

  createBalanceEmbed(
    client,
    ctx,
    targetUser,
    user,
    color,
    emoji,
    generalMessages,
    balanceMessages
  ) {
    const { coin = 0, bank = 0, credit = 0 } = user.balance || {};
    const titleTemplate =
      generalMessages?.title || "# %{mainLeft} %{title} %{mainRight}\n";
    const descriptionTemplate =
      balanceMessages?.description ||
      "%{coinEmote} : **%{coin}** coins\n%{bankEmote} : **%{bank}** coins\n%{creditEmote} : **%{credit}** credits";

    return client
      .embed()
      .setColor(color.main || "#5865F2")
      .setThumbnail(
        globalGif.balanceThumbnail
          ? globalGif.balanceThumbnail
          : client.utils.emojiToImage(emoji.main || "💰")
      )
      .setDescription(
        titleTemplate
          .replace("%{mainLeft}", emoji.mainLeft || "")
          .replace("%{title}", `${targetUser.displayName} BALANCE`)
          .replace("%{mainRight}", emoji.mainRight || "") +
          descriptionTemplate
            .replace("%{coinEmote}", emoji.coin || "💰")
            .replace("%{coin}", client.utils.formatNumber(coin))
            .replace("%{bankEmote}", emoji.bank || "🏦")
            .replace("%{bank}", client.utils.formatNumber(bank))
            .replace("%{creditEmote}", globalEmoji.card?.apple || "💳")
            .replace("%{credit}", client.utils.formatNumber(credit))
      )
      .setImage(globalGif.balanceBanner)
      .setFooter({
        text: (generalMessages?.requestedBy).replace(
          "%{username}",
          ctx.author.displayName
        ),
        iconURL: ctx.author.displayAvatarURL(),
      });
  }

  createBalanceButtons(emoji) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("deposit")
        .setLabel("Deposit")
        .setEmoji(emoji.bank || "🏦")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("withdraw")
        .setLabel("Withdraw")
        .setEmoji(emoji.coin || "💰")
        .setStyle(ButtonStyle.Success)
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
    language
  ) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const balanceMessages = language.locales.get(language.defaultLocale)
      ?.economyMessages?.balanceMessages;

    // Generate a unique ID for this command instance
    const commandInstanceId = `balance_${ctx.author.id}_${Date.now()}`;

    // Set up modal handler for this specific command instance
    this.setupModalHandler(
      client,
      ctx,
      commandInstanceId,
      color,
      emoji,
      language,
      message
    );

    // Create collector for button interactions
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 minutes
    });

    // Store the collector for cleanup
    this.activeCollectors.set(commandInstanceId, collector);

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ctx.author.id) {
        await interaction.reply({
          embeds: [
            client
              .embed()
              .setColor(color.error)
              .setDescription(
                "This balance menu belongs to someone else. Please use the balance command yourself."
              ),
          ],
          ephemeral: true,
        });
        return;
      }

      try {
        await interaction.deferUpdate().catch(() => {});

        // Get fresh user data
        const updatedUser = await client.utils.getUser(ctx.author.id);
        if (!updatedUser) {
          await interaction.followUp({
            embeds: [
              client
                .embed()
                .setColor(color.error)
                .setDescription(generalMessages.userNotFound),
            ],
            ephemeral: true,
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
              message
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
              message
            );
            break;
        }
      } catch (error) {
        try {
          await interaction.followUp({
            embeds: [
              client
                .embed()
                .setColor(color.error)
                .setDescription(
                  "An error occurred while processing your request."
                ),
            ],
            ephemeral: true,
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

      // Clean up modal handler
      this.cleanupModalHandler(client, commandInstanceId);

      // Remove from active collectors
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
    message
  ) {
    // Create a handler function for modal submissions
    const modalHandler = async (interaction) => {
      // Check if this is one of our modals
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.includes(commandInstanceId)) return;

      try {
        // CRITICAL FIX: Immediately defer the update to prevent "This interaction failed" errors
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
                    .setColor(color.error)
                    .setDescription("Please enter a valid amount."),
                ],
                ephemeral: true,
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
            message
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
                    .setColor(color.error)
                    .setDescription("Please enter a valid amount."),
                ],
                ephemeral: true,
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
            message
          );
        }
      } catch (error) {
        try {
          await interaction.followUp({
            embeds: [
              client
                .embed()
                .setColor(color.error)
                .setDescription(
                  "An error occurred while processing your request."
                ),
            ],
            ephemeral: true,
          });
        } catch (followUpError) {}
      }
    };

    // Store the handler with its ID
    this.activeModalHandlers.set(commandInstanceId, modalHandler);

    // Add the event listener
    client.on("interactionCreate", modalHandler);
  }

  cleanupModalHandler(client, commandInstanceId) {
    // Get the handler
    const handler = this.activeModalHandlers.get(commandInstanceId);
    if (handler) {
      // Remove the event listener
      client.removeListener("interactionCreate", handler);
      // Remove from the map
      this.activeModalHandlers.delete(commandInstanceId);
    }
  }

  // CRITICAL FIX: New method that handles deposit directly without secondary buttons
  async handleDepositDirectly(
    client,
    ctx,
    interaction,
    user,
    color,
    emoji,
    language,
    message
  ) {
    try {
      // Add fallbacks for language properties
      const depositMessages =
        language?.locales?.get(language.defaultLocale)?.economyMessages
          ?.depositMessages || {};
      const generalMessages =
        language?.locales?.get(language.defaultLocale)?.generalMessages || {};
      const balanceMessages =
        language?.locales?.get(language.defaultLocale)?.economyMessages
          ?.balanceMessages || {};

      // Check if user has coins to deposit
      if (user.balance.coin <= 0) {
        await interaction.followUp({
          embeds: [
            client
              .embed()
              .setColor(color.error)
              .setDescription("You don't have any coins to deposit."),
          ],
          ephemeral: true,
        });
        return;
      }

      // Create embed with options
      const depositEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji?.bank || "🏦"} Deposit Options`)
        .setDescription(
          `Select an option to deposit coins to your bank.\nYou have **${client.utils.formatNumber(
            user.balance.coin
          )}** coins in your wallet.`
        );

      // Generate unique IDs for this specific interaction
      const uniqueId = Date.now().toString();
      const depositAllId = `deposit_all_${uniqueId}`;
      const depositHalfId = `deposit_half_${uniqueId}`;

      // Create action row with buttons
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(depositAllId)
          .setLabel("Deposit All")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(depositHalfId)
          .setLabel("Deposit Half")
          .setStyle(ButtonStyle.Secondary)
      );

      // Send the message with buttons - REMOVED ephemeral: true
      const reply = await interaction.followUp({
        embeds: [depositEmbed],
        components: [actionRow],
      });

      // Create a collector for this specific reply
      const filter = (i) => {
        const isCorrectUser = i.user.id === ctx.author.id;
        const isCorrectButton =
          i.customId === depositAllId || i.customId === depositHalfId;
        return isCorrectUser && isCorrectButton;
      };

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 60000, // 1 minute timeout
        componentType: ComponentType.Button,
        max: 1, // Only collect one interaction
      });

      collector.on("collect", async (buttonInteraction) => {
        try {
          // Check which button was clicked
          if (buttonInteraction.customId === depositAllId) {
            // Defer update for non-modal buttons
            await buttonInteraction.deferUpdate().catch(() => {});

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
              reply // Pass the reply message to be deleted after successful operation
            );
          } else if (buttonInteraction.customId === depositHalfId) {
            // Defer update for non-modal buttons
            await buttonInteraction.deferUpdate().catch(() => {});

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
              reply // Pass the reply message to be deleted after successful operation
            );
          }
        } catch (error) {
          await buttonInteraction
            .followUp({
              embeds: [
                client
                  .embed()
                  .setColor(color.error)
                  .setDescription(
                    "An error occurred while processing your request."
                  ),
              ],
              ephemeral: true,
            })
            .catch(() => {});
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          // No interactions collected, update the message to show it expired
          const disabledRow = ActionRowBuilder.from(actionRow);
          disabledRow.components.forEach((component) =>
            component.setDisabled(true)
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
              .setColor(color.error)
              .setDescription(
                "An error occurred while creating deposit options. Please try again."
              ),
          ],
          ephemeral: true,
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
    message
  ) {
    try {
      if (user.balance.bank <= 0) {
        // Use ephemeral: true instead of flags: 64 for clarity
        await interaction
          .followUp({
            embeds: [
              client
                .embed()
                .setColor(color.error)
                .setDescription(
                  `${
                    emoji?.error || "❌"
                  } You don't have any coins in your bank to withdraw.`
                ),
            ],
            ephemeral: true,
          })
          .catch(() => {}); // Add error handling
        return;
      }

      const withdrawEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji?.coin || "💰"} Withdraw Options`)
        .setDescription(
          `Select an option to withdraw coins from your bank.\nYou have **${client.utils.formatNumber(
            user.balance.bank
          )}** coins in your bank.`
        );

      // Generate unique IDs for this specific interaction
      const uniqueId = Date.now().toString();
      const withdrawAllId = `withdraw_all_${uniqueId}`;
      const withdrawHalfId = `withdraw_half_${uniqueId}`;

      // Create action row with buttons
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(withdrawAllId)
          .setLabel("Withdraw All")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(withdrawHalfId)
          .setLabel("Withdraw Half")
          .setStyle(ButtonStyle.Secondary)
      );

      // Send the message with buttons - REMOVED ephemeral: true
      const reply = await interaction.followUp({
        embeds: [withdrawEmbed],
        components: [actionRow],
      });

      // Create a collector for this specific reply
      const filter = (i) => {
        const isCorrectUser = i.user.id === ctx.author.id;
        const isCorrectButton =
          i.customId === withdrawAllId || i.customId === withdrawHalfId;
        return isCorrectUser && isCorrectButton;
      };

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 60000, // 1 minute timeout
        componentType: ComponentType.Button,
        max: 1, // Only collect one interaction
      });

      collector.on("collect", async (buttonInteraction) => {
        try {
          if (buttonInteraction.customId === withdrawAllId) {
            await buttonInteraction.deferUpdate().catch(() => {});

            // Process withdraw all
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
              reply
            );
          } else if (buttonInteraction.customId === withdrawHalfId) {
            await buttonInteraction.deferUpdate().catch(() => {});

            // Process withdraw half
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
              reply // Pass the reply message to be deleted after successful operation
            );
          }
        } catch (error) {
          await buttonInteraction
            .followUp({
              embeds: [
                client
                  .embed()
                  .setColor(color.error)
                  .setDescription(
                    "An error occurred while processing your request."
                  ),
              ],
              ephemeral: true,
            })
            .catch(() => {});
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          // No interactions collected, update the message to show it expired
          const disabledRow = ActionRowBuilder.from(actionRow);
          disabledRow.components.forEach((component) =>
            component.setDisabled(true)
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
        await interaction.followUp({
          embeds: [
            client
              .embed()
              .setColor(color.error)
              .setDescription(
                `${
                  emoji?.error || "❌"
                } You don't have any coins in your bank to withdraw.`
              ),
          ],
          ephemeral: true,
        });
        return;
      }
      await interaction
        .followUp({
          embeds: [
            client
              .embed()
              .setColor(color?.error)
              .setDescription(
                "An error occurred while creating withdraw options. Please try again."
              ),
          ],
          ephemeral: true,
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
    originalReply = null
  ) {
    // Add fallbacks for undefined language properties
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
              .setColor(color.error)
              .setDescription(
                depositMessages.errors?.invalidAmount || "Invalid amount."
              ),
          ],
          ephemeral: true,
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
              .setColor(color.error)
              .setDescription(
                depositMessages.errors?.notEnoughCoins ||
                  "You don't have enough coins."
              ),
          ],
          ephemeral: true,
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
        }
      );

      // Get updated user data
      const updatedUser = await client.utils.getUser(user.userId);

      // Delete the original reply message if it exists
      if (originalReply) {
        try {
          await originalReply.delete();
        } catch (deleteError) {}
      }

      // Send success message and store the message object
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
                    client.utils.formatNumber(updatedUser.balance.bank)
                  )
              ),
          ],
          ephemeral: false, // Make the success message visible to everyone
        })
        .catch(() => {});

      // Delete the success message after 5 seconds
      if (successMessage) {
        setTimeout(() => {
          successMessage.delete().catch(() => {});
        }, 3000); // 5 seconds
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
          balanceMessages
        );

        await message
          .edit({
            embeds: [refreshedEmbed],
            components: this.createBalanceButtons(emoji || {}),
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
                "An error occurred while processing your deposit."
              ),
          ],
          ephemeral: true,
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
    originalReply = null
  ) {
    // Add fallbacks for undefined language properties
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
              .setColor(color.error)
              .setDescription(
                withdrawMessages.errors?.invalidAmount || "Invalid amount."
              ),
          ],
          ephemeral: true,
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
              .setColor(color.error)
              .setDescription(
                withdrawMessages.errors?.notEnoughCoins ||
                  "You don't have enough coins in your bank."
              ),
          ],
          ephemeral: true,
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
        }
      );

      // Get updated user data
      const updatedUser = await client.utils.getUser(user.userId);

      // Delete the original reply message if it exists
      if (originalReply) {
        try {
          await originalReply.delete();
        } catch (deleteError) {}
      }

      // Send success message and store the message object
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
                    client.utils.formatNumber(updatedUser.balance.coin)
                  )
              ),
          ],
          ephemeral: false, // Make the success message visible to everyone
        })
        .catch(() => {});

      // Delete the success message after 5 seconds
      if (successMessage) {
        setTimeout(() => {
          successMessage.delete().catch(() => {});
        }, 3000); // 5 seconds
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
          balanceMessages
        );

        await message
          .edit({
            embeds: [refreshedEmbed],
            components: this.createBalanceButtons(emoji),
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
                "An error occurred while processing your withdrawal."
              ),
          ],
          ephemeral: true,
        })
        .catch(() => {});
    }
  }
};
