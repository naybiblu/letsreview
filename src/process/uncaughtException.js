const { log } = require("./../assets/func/misc.js");

module.exports = {
  
  event: "uncaughtException", 
  async run (err, orig) {

    log.error(
      "NodeJS", 
      `Error detected from ${orig}:`
    );
    console.error(err);
    
  }
  
};