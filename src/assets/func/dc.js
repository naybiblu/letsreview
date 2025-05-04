const { dc } = require("./clients");
const { log } = require("./misc");

exports.sendMessage = async (channelId, message) => {

  dc.channels.fetch(channelId)
    .then(channel => channel.send(message));

  log.success("Discord", `Sent a message on ${channelId}.`);

};

exports.deleteMessage = async(channelId, messageId) => {

  let index = 0;
  dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch())
    .then(messages => {

      if (!messageId) {
        
        messages.forEach(async message => {
          dc.channels.fetch(channelId).then(chan => {
            chan.messages.delete(message.id);
          });
          index++;
        });

      } else {

        messages.first().channel.messages.delete(messageId);
        index = 1;

      };

  })
  .then(() => {

    log.success("Discord", `Deleted ${index} message${index > 1 ? "s" : ""} on ${channelId}.`);

  });

};

exports.editMessageContent = async (channelId, messageId, message) => {

  dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch({ limit: 1, around: messageId }))
    .then(messages => messages.first().edit(message));

  log.success("Discord", `Edited message #${messageId} on ${channelId}.`);

};

exports.getMessage = async (channelId) => {

  return dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch({ limit: 1 }))
    .then(messages => {
      return messages.first();
    });

};

exports.getAllMsgs = async (channelId) => {

  return dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch())
    .then(messages => {
      return messages;
    });

};

exports.getMessageWithTitle = async (text, channelId) => {

  return dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch())
    .then(messages => {

      let message = {};
      let count = 0;

      messages.forEach(msg => {

        if (msg.embeds.length > 0 && msg.embeds[0].title && msg.embeds[0].title.includes(text)) {

          message = msg; 
          count++;

        }

      });

      return {
        data: message,
        count: count
      };

    });

};

exports.getSimilarFooterCount = async (footerText, channelId) => {

  return dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch({ limit: 1 }))
    .then(messages => {

      let count = 0;

      messages.forEach(message => {

        if (message.embeds.length > 0 && message.embeds[0].footer && message.embeds[0].footer.text === footerText) count++;
      
      });

      return count;
    
    });

};

exports.getFooterText = async () => {

  return dc.channels.fetch(weatherChanId)
    .then(channel => channel.messages.fetch({ limit: 1 }))
    .then(messages => {

      return messages.first().embeds[0].footer.text;

    });

};