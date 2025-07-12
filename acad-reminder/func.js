const axios = require("axios");
const { dc } = require("./../src/assets/func/clients");
const { 
    log,
    getAccurateDate 
} = require("./../src/assets/func/misc");
const {
    GSHEET_KEY: key,
    GSHEET_GASID: gasSID,
    GSHEET_STEMID: stemSID,
    DISCORD_ARC_CHANNELID: classesChanId,
    DISCORD_ARB_CHANNELID: bdayChanId,
} = process.env;

exports.getBdayData = async (id) => {

    let data = (await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Student Information?key=${key}`)).data.values;
    const section = `Grade ${data[3][2]}`;
    const filteredData = [...data.slice(7, 37), ...data.slice(38, 68)].filter(x => x.length > 1 && x[2]);

    data = filteredData.map(item => {
        return {
            name: item[1],
            section: section,
            bday: item[2]
        };
    });

    const bdayCelebrants = data.filter(s => s.bday?.startsWith(getAccurateDate("m/d/y").split("/").slice(0, 2).join("/")));

    return bdayCelebrants;

};

exports.sendBdayReminder = async () => {
    
    const { getBdayData } = this;
    let bdayCelebrants = [];
    const gas = await getBdayData(gasSID);
    const stem = await getBdayData(stemSID);

    bdayCelebrants = [...gas, ...stem];
    const today = getAccurateDate("date");
    const pluralization = bdayCelebrants.length > 1 ? "s" : "";

    console.log(bdayCelebrants)

    if (bdayCelebrants.length <= 0) return log.success(
        "Eclaro Academy, Inc.",
        "There are no birthday celebrants for today."
    );

    dc.channels.fetch(bdayChanId)
        .then(channel => channel.send({
            embeds: [
                {
                    title: `Birthday Celebrant${pluralization} for ${today}`,
                    description: bdayCelebrants.map((b, i) => `${i + 1}. [${b.section}] ${b.name}`).join("\n"),
                    footer: {
                        text: today
                    }
                }
            ]
        }));
    
    log.success(
        "Eclaro Academy, Inc.",
        `There are ${bdayCelebrants.length} birthday celebrant${pluralization} today, ${today}!`
    );

};