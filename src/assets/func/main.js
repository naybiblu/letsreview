const axios = require("axios");
const {
    getRandomInt,
    getAccurateDate,
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
    getMessage,
    getAllMsgs,
    editMessageContent,
    getSimilarFooterCount,
} = require("./dc.js");
const {
  onDevMode,
  answerDuration,
} = require("./../config.json");
const {
    GSHEET_KEY: key,
    GSHEET_QUESTIONBANKID: id,
    DISCORD_PUBPOSTS_CHANNELID: pubPostsChanId,
    DISCORD_LB_CHANNELID: leaderBoardChanId,
    DISCORD_CP_CHANNELID: checkPointChanId,
    FB_PAGEID: pageId,
    FB_PAGEIDDEV: pageIdTest
} = process.env;
const { model } = require("./../db/models/user");
let fbId = onDevMode ? pageIdTest : pageId;

exports.assignQCode = (code = getAccurateDate("militaryTime").split(":")[0]) => {

  let queueCode;

  if (!code || !isNaN(parseInt(code))) {

    switch (code) {

      case "9": queueCode = "A"; break;
      case "11": queueCode = "B"; break;
      case "13": queueCode = "C"; break;
      case "15": queueCode = "D"; break;
      case "17": queueCode = "E";

    };
    
  } else {

    switch (code) {

      case "A": queueCode = "9"; break;
      case "B": queueCode = "11"; break;
      case "C": queueCode = "13"; break;
      case "D": queueCode = "15"; break;
      case "E": queueCode = "17";

    };

  }
  return queueCode;

};

exports.getAllQIds = async (category = 0) => {

  let msgs = await getAllMsgs(pubPostsChanId);
  let qIds = msgs.map(msg => msg.embeds[0].title.split("_")[1]);

  switch (category) {
    case 1: qIds = qIds.filter(id => id.startsWith("GENED")); break;
    case 2: qIds = qIds.filter(id => id.startsWith("PROFED")); break;
    default: qIds = qIds;
  }

  return qIds;

};

exports.getLETData = async (getAll = false, noFilter = false, getOverall = false) => {

    try {

    let subjectMatter;
    let photo;
    let filteredQs = [];
    const photoArray = [
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-xks1i6lj9eue1.png?width=1080&crop=smart&auto=webp&s=4f028db4f7fdeb0da9e49984a927d1150eb6b3f0",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-esjkj8lj9eue1.png?width=1080&crop=smart&auto=webp&s=c1249361fbfccf1cfe6219aca516ee6ec1be0235",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-e7p497lj9eue1.png?width=1080&crop=smart&auto=webp&s=3d857c3ac7fea4e8c5eb801adaa55d1a098002b9",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-b0qqd8lj9eue1.png?width=1080&crop=smart&auto=webp&s=962471a579887f344ff1e9ffa059617d20e05b17",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-akrdi6lj9eue1.png?width=1080&crop=smart&auto=webp&s=028fb6f1aa50877875edae66db82a0986a72ac5e",
      "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-cc5575lj9eue1.png?width=1080&crop=smart&auto=webp&s=1397344ea466c83341ada94c4312f1a682881ac9",
    ];
  
    const subjMatArray = [
      "General Education",
      "Professional Education"
    ];

    switch (getAccurateDate("dayWord")) {
  
      case "Monday": photo = photoArray[0]; subjectMatter = subjMatArray[0]; break;
      case "Tuesday": photo = photoArray[1]; subjectMatter = subjMatArray[0]; break;
      case "Wednesday": photo = photoArray[2]; subjectMatter = subjMatArray[0]; break;
      case "Thursday": photo = photoArray[3]; subjectMatter = subjMatArray[1]; break;
      case "Friday": photo = photoArray[4]; subjectMatter = subjMatArray[1]; break;
      case "Saturday": photo = photoArray[5]; subjectMatter = subjMatArray[1]; break;
      //default: photo = photoArray[6]; subjectMatter = "Overall";
    };

    if (!subjectMatter) return;
  
    let data = (await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${getOverall ? "Overall" : subjectMatter}?key=${key}`)).data.values;
    let existingQIds = await this.getAllQIds(subjectMatter === "General Education" ? 1 : 2);

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

    if (!noFilter) filteredQs = data.filter(q => !existingQIds.includes(q.id) && q.id.startsWith(subjectMatter === "General Education" ? "GENED" : "PROFED"));
    else filteredQs = data.filter(q => q.id.startsWith(subjectMatter === "General Education" ? "GENED" : "PROFED"))

    return getAll ? filteredQs : filteredQs[getRandomInt(0, filteredQs.length - 1)];

  } catch (e) {}
  
};
  
exports.sendLETData = async () => {
  
    const {
      assignQCode,
      getLETData,
    } = this;
    const message = await getMessageWithTitle("GREEN", pubPostsChanId);
    const latestMsg = await getMessage(pubPostsChanId);

    if (message.count > 0) return;

    const check = await getSimilarFooterCount(`${getAccurateDate("dayWord")}_${getAccurateDate("date")}`, pubPostsChanId);

    if (latestMsg && latestMsg?.embeds[0]?.title?.split("_")[2] === assignQCode() && check) return;
    
    let data = await getLETData();

    if (!data) return;

    const shorthand = data.subMatter === "General Education" ? "GenEd" : "ProfEd";
  
    // posting to Facebook page
    const post = await publishFBPost(fbId, `💡 #${shorthand}${getAccurateDate("dayWord")} | ${fancyText(data.item, 0)}\n\n` +
      "Ano pang hinihintay ninyo, preservice teachers? #LETsReview and comment the correct answer! 🚀✨\n\n" +
      `${fancyText("Note:", 2)} ${fancyText("The correct answer will be revealed after one (1) hour.", 1)}`, data.photo);
  
    data.postId = post;
    
    await publishFBComment(fbId, data.postId, fancyText("How to answer?", 0) +
      "\n\n❎ A\n❎ c\n❎ A.\n❎ JamesPogi _ A\n✅ JamesPogi_A\n✅ JamesPogi_a");
  
    // auditing logs to Discord
    // GREEN >> posted, answer not revealed
    // RED >> posted and answer is revealed
    await sendMessage(pubPostsChanId, {
      embeds: [
        {
          title: `GREEN_${data.id}_${assignQCode()}`,
          description: JSON.stringify(data),
          footer: {
            text: `${getAccurateDate("dayWord")}_${getAccurateDate("unix")}`
          }
        }
      ]
    });
  
};

exports.sendLeaderBoard = async () => {

  const today = getAccurateDate("dayWord");

  if (today !== "Sunday") return;
  if (parseInt(getAccurateDate("militaryTime").split(":")[0]) < 9) return;

  const check = await getSimilarFooterCount(`${today}_${getAccurateDate("date")}`, checkPointChanId);

  if (check) return;

  const image = "https://preview.redd.it/lets-review-checkpoint-v0-e2ns2ie54qye1.png?width=1080&crop=smart&auto=webp&s=f517f70b3f7425f18d183bd2a811dfe8618fccc3";
  const leaderBoard = await this.updateLeaderBoard();

  const post = await publishFBPost(fbId, `${fancyText("It's ", 0)} 🏆 #CheckpointSunday 🏆${fancyText("!", 0)}\n\n` +
  "You know what that means, right??? It's time to reveal the rankings for this week!! 🎉✨\n\n" +
  `Kaya naman, #LETsReveal ${fancyText("the leader board:", 0)}\n\n` +
  `${leaderBoard?.length <= 0 ? fancyText("Ay, wala pa pala... 😭😭😭", 1) : leaderBoard
  .map((user, i) => { return `${fancyText(`[${i + 1 === 1 ? "🥇 1ST" : i + 1 === 2 ? "🥈 2ND" : i + 1 === 3 ? "🥉 3RD" : `🏅 ${i + 1}TH`}]`, 0)} ${fancyText(user.username, 2)} ${fancyText(`(${user.score} pts.)`, 1)}` })
  .join("\n")}` + "\n\nCongratulations, ebriwan, at kita-kits ulit bukas! 👋", image
  );
  
  await sendMessage(checkPointChanId, {
    embeds: [
      {
        description: JSON.stringify(post),
        footer: {
          text: `${getAccurateDate("dayWord")}_${getAccurateDate("date")}`
        }
      }
    ]
  });

}
  
exports.revealLETAnswer = async () => {
  
    let correctAnsArray = [];
    const message = await getMessageWithTitle("GREEN", pubPostsChanId);
  
    if (message.count === 0) return;
  
    const embed = message.data.embeds[0];
    const data = JSON.parse(embed.description);
    const today = getAccurateDate("unix");
    const targetDate = parseInt(embed.footer.text.split("_")[1]) + answerDuration * 60; // seconds
  
    if (today < targetDate) return;
  
    const comments = await getFBComments(fbId, data.postId);
  
    await publishFBComment(fbId, data.postId, 
      `Time's up! ⏰ The correct answer is: ${fancyText(data.answer, 0)}! ✨\n\n` +
      "Bakit? 🤔 Here\'s why:\n\n" +
      fancyText(data.rationale, 0) + " 😲");
    
    // sort correct answers
    comments.forEach(async (comment, i) => {

        if (!comment.message.includes("_")) return;

        const [ username, answer ] = comment.message.split("_");
        comment.username = username;

        if (data.answer.toLowerCase().split(".")[0] !== answer.toLowerCase()) return await publishFBComment(fbId, data.postId, "❎ Sorry, baks... mali ka!", comment.id.split("_")[1]);
            
        correctAnsArray.push(comment); 
  
    });

    console.log(correctAnsArray)

    // rank comments via timeliness
    uniqByKeepFirst(correctAnsArray, c => c.username).forEach(async (comment, i) => {

        let reply = "";
        let pointsAcquired;
        let existingUser = await model.findOne({ username: comment.username });

        switch (i) {

            case 0: 
                // TO DO: add 5 pts. to the DB for leaderboard
                reply = `🥇 Sumakses ka! Dahil diyan, may ${fancyText("5 points", 0)} ka!`;
                pointsAcquired = 5;
                break;
            case 1:
                // TO DO: add 3 pts. to the DB for leaderboard
                reply = `🥈 Ang yabang, ah? Sige, \'eto na ang ${fancyText("3 points", 0)}!`;
                pointsAcquired = 3;
                break;
            case 2:
                // TO DO: add 2 pts. to the DB for leaderboard
                reply = `🥉 Uy, si lodi! May ${fancyText("2 points", 0)} ka sa'kin!`;
                pointsAcquired = 2;
                break;
            default:
                // TO DO: add 1 pts. to the DB for leaderboard
                reply = `✅ Tumpak! May ${fancyText("1 point", 0)} ka!`;
                pointsAcquired = 1;

        };

        await publishFBComment(fbId, data.postId, reply, comment.id.split("_")[1]);

        if (!existingUser) await model.create({
          username: comment.username,
          score: pointsAcquired
        });
        else await model.updateOne(
          { username: comment.username },
          { $set: { score: existingUser?.score + pointsAcquired } }
        );

    });

    await sendMessage(pubPostsChanId, {
      embeds: [
        {
          title: `RED_${embed.title.split("_")[1]}_${embed.title.split("_")[2]}`,
          description: JSON.stringify(data),
          footer: {
            text: embed.footer.text
          }
        }
      ]
    });
  
    await deleteMessage(pubPostsChanId, message.data.id);
  
  };

exports.updateLeaderBoard = async (top = 10) => {

  const allUsers = await model.find().sort({ score: -1 });
  const top10 = allUsers?.slice(0, 10);
  let leaderBoard = await getMessage(leaderBoardChanId);
  let content = allUsers.length <= 0 ? "**No data available.**" : top10
    .map((user, i) => { return `**#${i + 1}:** ***${user.username}*** *(${user.score} pts.)*`})
    .join("\n");
  content += `\n\nUpdated last ${getAccurateDate("date")} at ${getAccurateDate("hour")}`;

  if (leaderBoard?.content === content) return allUsers.slice(0, top);
  
  if (!leaderBoard) await sendMessage(leaderBoardChanId, content);
  else await editMessageContent(leaderBoardChanId, leaderBoard.id, content);

  return allUsers.slice(0, top);

};

exports.extraQuestion = async () => {

  const chance = getRandomInt(1, 100);
  const today = getAccurateDate("dayWord");
  
  if (getAccurateDate("dayWord") !== "Sunday") return;
  if (getAccurateDate("militaryTime").split(":")[0] !== "11") return;

  console.log("Chance for Extra Question: ", chance);

  if (![15, 17].includes(chance)) return;

  const message = await getMessageWithTitle("GREEN", pubPostsChanId);
  
  if (message.count === 0) return;

  const checkIfPosted = (await getMessage(pubPostsChanId)).embeds[0].footer.text.includes(today);

  if (checkIfPosted) return;

  const data = await this.getLETData(false, false, true);

  if (!data) return;

  const post = await publishFBPost(fbId, `💥 #ExtraExtra | Today is a special day, dahil may bagong question tayong sasagutan kahit Sunday! 😲 Here's the question:\n\n` +
    `${fancyText(data.item, 0)}\n\nAno pang hinihintay ninyo, preservice teachers? #LETsReview and comment the correct answer! 🚀✨\n\n` +
    `${fancyText("Note:", 2)} ${fancyText("The correct answer will be revealed after one (1) hour.", 1)}`, 
    "https://preview.redd.it/lets-review-online-assets-ver-2-0-v0-j1mpl5lj9eue1.png?width=1080&crop=smart&auto=webp&s=1618a9fc476462405998acfba9df2d4de8968dab"
  );
  
  data.postId = post;
    
  await publishFBComment(fbId, data.postId, fancyText("How to answer?", 0) +
    "\n\n❎ A\n❎ c\n❎ A.\n❎ JamesPogi _ A\n✅ JamesPogi_A\n✅ JamesPogi_a");
  
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

exports.questionScheduler = async () => {

  const { 
    getLETData, 
    sendLETData, 
    sendLeaderBoard, 
    revealLETAnswer, 
    updateLeaderBoard,
    extraQuestion
  } = this;

  let hour = getAccurateDate("militaryTime").split(":")[0];
  const activePosts = await getMessageWithTitle("GREEN", pubPostsChanId);
  const questionsLeft = await getLETData(true);
  const msgs = await getAllMsgs(pubPostsChanId);
  const questionsTotal = await getLETData(true, true);


  console.log("Questions left to be posted :", getAccurateDate("dayWord") === "Sunday" ? "No questions for today" : questionsLeft?.length + " / " + questionsTotal?.length);
  console.log("Active FB posts:", activePosts.count);
  console.log("Hour:", hour)
  if (questionsLeft?.length === 5 && activePosts.count === 0) questionsTotal
    .forEach(async q => {
      const check = msgs.filter(m => m.embeds[0].title.split("_")[1] === q.id).first()?.id;
      if (!check) return;
      await deleteMessage(pubPostsChanId, check);
    });

  switch (hour) {
 
    case "9": // 9 AM 
    case "11": // 11 AM
    case "13": // 1 PM
    case "15": // 3 PM
    case "17": // 5 PM
      await sendLETData(); break;

  };

  await revealLETAnswer();
  await sendLeaderBoard();
  await updateLeaderBoard()
  await extraQuestion();

};