const mongo = require("mongoose");
const { log, mongo: db } = require("./../../assets/func/misc.js");

module.exports = {

    event: "disconnect",
    async run() {

        mongo.connection.on("disconnect", async () => {

            log.error(
                "MongoDB", 
                `Offline.`
            );
    
            await db.connect();

        });
  
    }
  
};