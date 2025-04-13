const { readdirSync } = require("fs");
const { DISCORD_TOKEN: token } = process.env;
require("dotenv").config();
const { dc } = require("./clients");
const { 
  log, 
  mongo,
  } = require("./misc");
const {
  sendLETData,
  revealLETAnswer,
} = require("./main");
const { model } = require("./../db/models/user");

exports.connectDB = async () => {

  await mongo.connect();

  readdirSync("./src/mongo/events").filter((e) => e.endsWith(".js")).forEach(async (event) => {

    let data = require(`./../../mongo/events/${event}`);

    data.run().catch(err => console.error(err));

  });

};

exports.connectDC = async () => {

  dc
    .on("ready", async () => {

      log.success(
        "Discord", 
        "Online."
      );

      try {

        await sendLETData();
        await revealLETAnswer();

        setInterval(async () => {
          
          await revealLETAnswer();
        
        }, 20 * 1000);

      } catch (err) { console.error(err); }

    })
    .login(token);

}