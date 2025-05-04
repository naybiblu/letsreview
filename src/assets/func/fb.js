const axios = require("axios");
const { log } = require("./misc");
const { 
    FB_TOKEN: fbToken,
    FB_TOKENDEV: fbTokenTest,
} = process.env;
let token = require("./../config.json").onDevMode ? fbTokenTest : fbToken;

exports.publishFBPost = async (pageId, text, photoURL) => {

  let post;

  if (photoURL) post = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
    message: text,
    access_token: token,
    url: photoURL
  })
  else post = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    message: text,
    access_token: token
  });

  log.success("Facebook", `Posted a status ${photoURL ? "with a photo" : ""}.`);

  return photoURL ? post?.data.id : post?.data.id.split("_")[1];

};

exports.getFBComments = async (pageId, postId) => {

  let refinedComments = [];
  let comments = await axios.get(`https://graph.facebook.com/v21.0/${pageId}_${postId}/comments?access_token=${token}`);
  comments?.data.data.forEach(comment => {

    if (comment.from?.id === pageId) return;
    
    refinedComments.push(comment);

  });

  return refinedComments;

};

exports.publishFBComment = async (pageId, postId, text, commentId) => {

  let comment;
  
  if (!commentId) comment = await axios.post(`https://graph.facebook.com/v21.0/${pageId}_${postId}/comments`, {
    message: text,
    access_token: token
  });
  else comment = await axios.post(`https://graph.facebook.com/v21.0/${postId}_${commentId}/comments`, {
    message: text,
    access_token: token
  });

  log.success("Facebook", `Published a comment on ${commentId ? commentId : postId}.`);

  return comment?.data;

};