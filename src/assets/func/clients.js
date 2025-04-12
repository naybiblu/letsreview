const { Client, Partials } = require("discord.js");
require("dotenv").config();

exports.dc = new Client({
    intents: [
      "Guilds",
      "GuildMessages",
      "DirectMessages",
      "MessageContent"
    ],
    partials: [
      Partials.Channel
    ]
});
