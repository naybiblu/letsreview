const axios = require("axios");
const { 
    FB_TOKEN: fbToken,
} = process.env;

exports.publishFBPost = async (pageId, text, photoURL) => {

  let post;

  if (photoURL) post = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
    message: text,
    access_token: fbToken,
    url: photoURL
  });
  else post = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    message: text,
    access_token: fbToken
  });

  return photoURL ? post?.data.id : post?.data.id.split("_")[1];

};

exports.getFBComments = async (pageId, postId) => {

  let refinedComments = [];
  let comments = await axios.get(`https://graph.facebook.com/v21.0/${pageId}_${postId}/comments?access_token=${fbToken}`);
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
    access_token: fbToken
  });
  else comment = await axios.post(`https://graph.facebook.com/v21.0/${postId}_${commentId}/comments`, {
    message: text,
    access_token: fbToken
  });

  return comment?.data;

};