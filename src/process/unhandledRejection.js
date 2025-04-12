const { log } = require("../assets/func/misc.js");

module.exports = {
  
  event: "unhandledRejection", 
  async run (reason, p) {

    log.error(
      "NodeJS", 
      `Promise ${p} is unhandled due to:`
    );
    console.error(reason);
    
  }
  
};