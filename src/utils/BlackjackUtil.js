const globalEmoji = require("./Emoji");
const DEALER = "<:DEALERBLACKJACK:1350677991365152900>";

const cardsf = [
  "<:CARD:1342745952225595454>",
  // '<:BACKCF:1281843924062703679>',
  // '<:BACKHF:1281843958846328842>',
  // '<:BACKDF:1281843932430471169>',

  "<a:asf:1342745508812165210>",
  "<a:2sf:1342745517410746369>",
  "<a:3sf:1342745524532678717>",
  "<a:4sf:1342745530966478869>",
  "<a:5sf:1342745537602129970>",
  "<a:6sf:1342745544816201738>",
  "<a:7sf:1342745555721388052>",
  "<a:8sf:1342745562872811550>",
  "<a:9sf:1342745571877847040>",
  "<a:10sf:1342745582053232740>",
  "<a:jsf:1342745590446161941>",
  "<a:qsf:1342745599291953232>",
  "<a:ksf:1342745604559736894>",

  "<a:acf:1342745131899420785>",
  "<a:2cf:1342745156067135538>",
  "<a:3cf:1342745161116946432>",
  "<a:4cf:1342745169858134026>",
  "<a:5cf:1342745177307222128>",
  "<a:6cf:1342745183795679242>",
  "<a:7cf:1342745191907332106>",
  "<a:8cf:1342745199121793075>",
  "<a:9cf:1342745206180810824>",
  "<a:10cf:1342745213294084116>",
  "<a:jcf:1342745220630052906>",
  "<a:qcf:1342745247431528478>",
  "<a:kcf:1342745255211958303>",

  "<a:ahf:1342745382488379433>",
  "<a:2hf:1342745392709763143>",
  "<a:3hf:1342745398267351102>",
  "<a:4hf:1342745403849965609>",
  "<a:5hf:1342745409059164201>",
  "<a:6hf:1342745415312998431>",
  "<a:7hf:1342745423730966540>",
  "<a:8hf:1342745428965199882>",
  "<a:9hf:1342745447206223953>",
  "<a:10hf:1342745455309619230>",
  "<a:jhf:1342745467556990976>",
  "<a:qhf:1342745477820448808>",
  "<a:khf:1342745484820877332>",

  "<a:adf:1342745273268699186>",
  "<a:2df:1342745280185110649>",
  "<a:3df:1342745287449641061>",
  "<a:4df:1342745293950681130>",
  "<a:5df:1342745300657504377>",
  "<a:6df:1342745308479623238>",
  "<a:7df:1342745316792991755>",
  "<a:8df:1342745323319328798>",
  "<a:9df:1342745330998841424>",
  "<a:10df:1342745340075577356>",
  "<a:jdf:1342745348594073661>",
  "<a:qdf:1342745357599117403>",
  "<a:kdf:1342745366780444752>",
];
exports.randCard = randCard;
function randCard(client, deck, type) {
  let card = deck.splice(
    client.utils.getRandomNumber(0, deck.length - 1),
    1,
  )[0];
  return { card: card, type: type };
}

exports.initDeck = initDeck;
function initDeck(deck, player, dealer) {
  for (let i = 0; i < player.length; i++)
    deck.splice(deck.indexOf(player[i].card), 1);
  for (let i = 0; i < dealer.length; i++)
    deck.splice(deck.indexOf(dealer[i].card), 1);
  return deck;
}

exports.generateEmbed = generateEmbed;
function generateEmbed(
  author,
  client,
  color,
  emoji,
  dealer,
  player,
  bet,
  end,
  winnings,
  generalMessages,
  blackjackMessages,
) {
  let description = "";
  let endColor = "";
  let dealerValue = cardValue(dealer);
  let playerValue = cardValue(player);

  if (end === "w") {
    endColor = color.success;
    description = `${blackjackMessages.bet
      .replace("%{coin}", client.utils.formatNumber(bet))
      .replace("%{coinEmote}", emoji.coin)}\n${blackjackMessages.won
      .replace("%{coin}", client.utils.formatNumber(winnings))
      .replace("%{coinEmote}", emoji.coin)}`;
  } else if (end === "l") {
    endColor = color.danger;
    description = `${blackjackMessages.bet
      .replace("%{coin}", client.utils.formatNumber(bet))
      .replace("%{coinEmote}", emoji.coin)}\n${blackjackMessages.lost
      .replace("%{coin}", client.utils.formatNumber(bet))
      .replace("%{coinEmote}", emoji.coin)}`;
  } else if (end === "tb") {
    endColor = color.blue;
    description = `${blackjackMessages.bothBust}`;
  } else if (end === "t") {
    endColor = color.blue;
    description = `${blackjackMessages.tied}`;
  } else {
    endColor = color.main;
    dealerValue.points = dealerValue.shownPoints + "+?";
    description = `${blackjackMessages.bet
      .replace("%{coin}", client.utils.formatNumber(bet))
      .replace("%{coinEmote}", emoji.coin)}`;
  }

  const checkThumbnail = (result) => {
    switch (result) {
      case "w":
        return client.utils.emojiToImage(globalEmoji.option.win);
      case "l":
        return client.utils.emojiToImage(globalEmoji.option.lose);
      case "t":
      case "tb":
        return client.utils.emojiToImage(globalEmoji.option.wfu);
      default:
        return client.utils.emojiToImage(globalEmoji.option.doIt);
    }
  };

  return client
    .embed()
    .setColor(endColor)
    .setThumbnail(checkThumbnail(end))
    .setDescription(
      generalMessages.title
        .replace("%{mainLeft}", emoji.mainLeft)
        .replace("%{title}", blackjackMessages.title)
        .replace("%{mainRight}", emoji.mainRight) +
        `${blackjackMessages.winnerInfo}\n` +
        `## ${DEALER} **${blackjackMessages.dealer}  \`[${dealerValue.points}]\`**\n` +
        `# \n${dealerValue.display}\n` +
        `## **${author.displayName} \`[${playerValue.points}]${
          playerValue.ace ? "*" : ""
        }\`**\n` +
        `# ${playerValue.display}\n` +
        `${description}`,
    )
    .setFooter({
      text: !end
        ? generalMessages.gameInProgress.replace("%{user}", author.displayName)
        : generalMessages.gameOver.replace("%{user}", author.displayName),
      iconURL: author.displayAvatarURL(),
    });
}

exports.cardValue = cardValue;
function cardValue(deck) {
  let text = "";
  let points = 0;
  let unhiddenPoints = 0;
  let aces = 0;
  for (let i = 0; i < deck.length; i++) {
    let value = deck[i].card % 13;

    if (deck[i].type == "f") text += cardsf[deck[i].card] + " ";
    else if (deck[i].type == "c") text += cardsf[deck[i].card] + " ";
    else text += cardsf[0] + " ";

    if (value >= 10 || value == 0) {
      points += 10;
      if (deck[i].type == "f" || deck[i].type == "c") unhiddenPoints += 10;
    } else if (value > 1) {
      points += value;
      if (deck[i].type == "f" || deck[i].type == "c") unhiddenPoints += value;
    } else {
      if (deck[i].type == "f" || deck[i].type == "c") unhiddenPoints++;
      points++;
      aces++;
    }
  }

  let usedAces = 0;
  for (let i = 0; i < aces; i++) {
    points += 10;
    if (points > 21) {
      usedAces++;
      points -= 10;
    }
  }

  let ace = false;
  if (aces > 0 && usedAces < aces) ace = true;

  return {
    display: text,
    points: points,
    shownPoints: unhiddenPoints,
    ace: ace,
  };
}
