const { dc } = require("./clients");

exports.sendMessage = async (channelId, message) => {

  dc.channels.fetch(channelId)
    .then(channel => channel.send(message));

};

exports.deleteMessage = async(channelId, messageId) => {

  dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch())
    .then(messages => {

      if (!messageId) messages.forEach(async message => {
        await messages.delete(message.id);
      });
      else messages.first().channel.messages.delete(messageId);

  });

};

exports.getMessage = async (channelId) => {

  return dc.channels.fetch(channelId)
    .then(channel => channel.messages.fetch({ limit: 1 }))
    .then(messages => {
      return messages.first();
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