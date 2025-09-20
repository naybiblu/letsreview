const { readdirSync } = require("fs");
const {
  DISCORD_TOKEN: token,
  DISCORD_PUBPOSTS_CHANNELID: pubPostsChanId,
} = process.env;
require("dotenv").config();
const { dc } = require("./clients");
const { indexAR } = require("./../../../acad-reminder/index");
const { 
  log, 
  mongo,
} = require("./misc");
const {
  deleteMessage,
} = require("./dc");
const {
  questionScheduler,
  getLETData
} = require("./main");
const { model } = require("./../db/models/user");

exports.connectDB = async () => {

  await mongo.connect().then(() => log.success(
    "MongoDB",
    `Online.`
  ));

  readdirSync("./src/mongo/events").filter((e) => e.endsWith(".js")).forEach(async (event) => {

    let data = require(`./../../mongo/events/${event}`);

    data.run().catch(err => console.error(err));

  });

};

exports.repeatables = async () => {

  await questionScheduler();
  await indexAR();

};

exports.connectDC = async () => {

  const { repeatables } = this;

  dc
    .on("clientReady", async () => {

      log.success(
        "Discord", 
        "Online."
      );

      try {

        await repeatables();

        setInterval(async () => {
          
          await repeatables();
        
        }, require("./../config.json").refreshRate * 1000);


      } catch (err) { console.error(err); }

    })
    .on("messageCreate", async msg => {

      if (msg.content.toLowerCase() === "!!purge") {
        await msg.delete();
        await deleteMessage(msg.channelId);
      };

      if (msg.content.toLowerCase() === "!!reset") {
        await msg.delete();
        await model.deleteMany({});
      };

    })
    .login(token)

};