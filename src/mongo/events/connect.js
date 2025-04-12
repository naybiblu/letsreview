const mongo = require("mongoose");
const { log } = require("./../../assets/func/misc.js");

module.exports = {

    event: "connect",
    async run() {
          
        mongo.connection.on("connect", async () => {

            log.success(
                "MongoDB",
                `Online.`
            );

        });
  
    }
  
};