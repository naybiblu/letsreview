const axios = require("axios");
const {
    getRandomInt,
    getAccurateDate,
    toMilitaryTime,
    fancyText,
    uniqByKeepFirst
} = require("./misc.js");
const {
    publishFBPost,
    publishFBComment,
    getFBComments
} = require("./fb.js");
const {
    sendMessage,
    getMessageWithTitle,
    deleteMessage,
} = require("./dc.js");
const {
    GSHEET_KEY: key,
    GSHEET_QUESTIONBANKID: id,
    DISCORD_PUBPOSTS_CHANNELID: pubPostsChanId,
    FB_PAGEID: pageId,
} = process.env;

exports.getLETData = async (getAll = false) => {

    let subjectMatter;
    let photo;
    const photoArray = [
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-xks1i6lj9eue1.png?width=1080&crop=smart&auto=webp&s=4f028db4f7fdeb0da9e49984a927d1150eb6b3f0",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-esjkj8lj9eue1.png?width=1080&crop=smart&auto=webp&s=c1249361fbfccf1cfe6219aca516ee6ec1be0235",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-e7p497lj9eue1.png?width=1080&crop=smart&auto=webp&s=3d857c3ac7fea4e8c5eb801adaa55d1a098002b9",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-b0qqd8lj9eue1.png?width=1080&crop=smart&auto=webp&s=962471a579887f344ff1e9ffa059617d20e05b17",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-akrdi6lj9eue1.png?width=1080&crop=smart&auto=webp&s=028fb6f1aa50877875edae66db82a0986a72ac5e",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-cc5575lj9eue1.png?width=1080&crop=smart&auto=webp&s=1397344ea466c83341ada94c4312f1a682881ac9",
    ];
  
    const subjMatArray = [
      "GenEd",
      "ProfEd"
    ]
  
    switch ("Friday") {
  
      case "Monday": photo = photoArray[0]; subjectMatter = subjMatArray[0]; break;
      case "Tuesday": photo = photoArray[1]; subjectMatter = subjMatArray[0]; break;
      case "Wednesday": photo = photoArray[2]; subjectMatter = subjMatArray[0]; break;
      case "Thursday": photo = photoArray[3]; subjectMatter = subjMatArray[1]; break;
      case "Friday": photo = photoArray[4]; subjectMatter = subjMatArray[1]; break;
      case "Saturday": photo = photoArray[5]; subjectMatter = subjMatArray[1]; break;
  
    };

    if (!subjectMatter) return;
  
    let data = (await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${subjectMatter}?key=${key}`)).data.values;
  
    data = data.slice(1).map(item => {
      return {
        id: item[0],
        subMatter: item[1],
        item: item[2],
        photo: photo,
        answer: item[3],
        rationale: item[4],
      };
    });
  
    return getAll ? data : data[getRandomInt(0, data.length - 1)];
  
};
  
exports.sendLETData = async () => {
  
    
    let data = await this.getLETData();

    if (!data) return;

    const shorthand = data.subMatter === "General Education" ? "GenEd" : "ProfEd";
  
    // posting to Facebook page
    const post = await publishFBPost(pageId, `💡 #${shorthand}${getAccurateDate("dayWord")} | ${fancyText(data.item, 0)}\n\n` +
      "Ano pang hinihintay ninyo, preservice teachers? #LETsReview and comment the correct answer! 🚀✨\n\n" +
      `${fancyText("Note:", 2)} ${fancyText("The correct answer will be revealed after one (1) hour.", 1)}`, data.photo);
  
    data.postId = post;
    
    await publishFBComment(pageId, data.postId, fancyText("How to answer?", 0) +
      "\n\n❎ A\n❎ c\n❎ A.\n❎ JamesPogi _ A\n✅ JamesPogi_A\n✅ JamesPogi_a");
  
    // auditing logs to Discord
    // GREEN >> posted, answer not revealed
    // RED >> posted and answer is revealed
    await sendMessage(pubPostsChanId, {
      embeds: [
        {
          title: `GREEN_${data.id}`,
          description: JSON.stringify(data),
          footer: {
            text: `${getAccurateDate("dayWord")}_${getAccurateDate("unix")}`
          }
        }
      ]
    });
  
};
  
exports.revealLETAnswer = async () => {
  
    let correctAnsArray = [];
    const message = await getMessageWithTitle("GREEN", pubPostsChanId);
  
    if (message.count === 0) return;
  
    const embed = message.data.embeds[0];
    const data = JSON.parse(embed.description);
    const today = getAccurateDate("unix");
    const targetDate = parseInt(embed.footer.text.split("_")[1]) + 120; // seconds
  
    if (today < targetDate) return;
  
    const comments = await getFBComments(pageId, data.postId);
  
    await publishFBComment(pageId, data.postId, 
      `Time's up! ⏰ The correct answer is: ${fancyText(data.answer, 0)}! ✨\n\n` +
      "Bakit? 🤔 Here\'s why:\n\n" +
      fancyText(data.rationale, 0) + "😲");
    
    // sort correct answers
    comments.forEach(async (comment, i) => {

        if (!comment.message.includes("_")) return;

        const [ username, answer ] = comment.message.split("_");
        comment.username = username;

        if (data.answer.toLowerCase() !== answer.toLowerCase()) return await publishFBComment(pageId, data.postId, "❎ Sorry, baks... mali ka!", comment.id.split("_")[1]);
            
        correctAnsArray.push(comment); 
  
    });

    console.log(correctAnsArray)

    // rank comments via timeliness
    uniqByKeepFirst(correctAnsArray, c => c.username).forEach(async (comment, i) => {

        let reply = "";

        switch (i) {

            case 0: 
                // TO DO: add 5 pts. to the DB for leaderboard
                reply = `🥇 Sumakses ka! Dahil diyan, may ${fancyText("5 points", 0)} ka!`;
                break;
            case 1:
                // TO DO: add 3 pts. to the DB for leaderboard
                reply = `🥈 Ang yabang, ah? Sige, \'eto na ang ${fancyText("3 points", 0)}!`;
                break;
            case 2:
                // TO DO: add 2 pts. to the DB for leaderboard
                reply = `🥉 Uy, si lodi! May ${fancyText("2 points", 0)} ka sa'kin!`;
                break;
            default:
                // TO DO: add 1 pts. to the DB for leaderboard
                reply = `✅ Tumpak! May ${fancyText("1 point", 0)} ka!`;

        };

        await publishFBComment(pageId, data.postId, reply, comment.id.split("_")[1]);

    });

    await sendMessage(pubPostsChanId, {
      embeds: [
        {
          title: `RED_${embed.title.split("_")[1]}`,
          description: JSON.stringify(data),
          footer: {
            text: embed.footer.text
          }
        }
      ]
    });
  
    await deleteMessage(pubPostsChanId, message.data.id);
  
  };