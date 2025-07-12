const { getAccurateDate } = require("./../src/assets/func/misc");
const { getSimilarFooterCount } = require("./../src/assets/func/dc");
const { sendBdayReminder } = require("./func");
const { DISCORD_ARB_CHANNELID: bdayChanId } = process.env;
require("dotenv").config();

exports.indexAR = async () => {
    let time = getAccurateDate("militaryTime");
    const hour = parseInt(time.split(":")[0]);

    const bdayChecker = await getSimilarFooterCount(getAccurateDate("date"), bdayChanId);

    if (hour >= 6 && hour <= 22 && !bdayChecker) await sendBdayReminder();

};