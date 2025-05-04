const colors = require('colors/safe');
const axios = require("axios");
const mongo = require("mongoose");
const { 
  MONGO_URL: url,
} = process.env;
const { readdirSync } = require("fs");

exports.log = { 

    error (provider, message, err = undefined) {
  
      console.log(colors.red.bold(`[${provider}]: `) + colors.red(`${message}\n${err}`));
  
    },
  
    success (provider, message) {
  
      console.log(colors.green.bold(`[${provider}]: `) + colors.green(`${message}`));
  
    }
  
};

exports.readDirGetJS = (path, func = () => {}) => {

  readdirSync(path).filter((e) => e.endsWith(".js")).forEach(func);

};

exports.getRandomInt = (min, max) => {
  
  return Math.floor(Math.random() * (max - min)) + min;
  
};

exports.changeTimezone = (date, ianatz = "Asia/Manila") => {

  var invdate = new Date(date.toLocaleString('en-US', {
      timeZone: ianatz
    }));

  var diff = date.getTime() - invdate.getTime();

  return new Date(date.getTime() - diff); 

};

exports.toMilitaryTime = (string) => {

  let hours, minutes;
  const [time, modifier] = string.split(' ');

  if (Array.isArray(time.split(","))) {

    let [h, m] = time.split(',').slice(0, 2);
    hours = h;
    minutes = m;

  } else {

    hours = time;
    minutes = "00";

  };

  if (hours === "12" && modifier === 'PM') hours = "12";
  else if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
  else if (hours === '12' && modifier === "AM") hours = '00';

  return `${hours}:${minutes}`;

};

exports.getAccurateDate = (element, date = Date.now()) => {

  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Asia/Manila',
  });
  const monthEnum = {
    "January": 0,
    "February": 1,
    "March": 2,
    "April": 3,
    "May": 4,
    "June": 5,
    "July": 6,
    "August": 7,
    "September": 8,
    "October": 9,
    "November": 10,
    "December": 11
  };
  date = formatter.format(date).split(" ");

  const newDate = new Date(`${date[1]} ${date[2]} ${date[3]} ${this.toMilitaryTime(`${date[5].split(":").slice(0, 2)} ${date[6]}`)}:${date[5].split(":")[2]}`);
  
  let output;

  switch (element) {

    case "whole": output = date.join(" "); break;
    case "dayWord": output = date[0].replace(",", ""); break;
    case "monthWord": output = date[1]; break;
    case "monthNumber": output = monthEnum[date[1]]; break;
    case "dayNumber": output = parseInt(date[2].replace(",", ""), 10); break;
    case "year": output = parseInt(date[3], 10); break;
    case "m/d/y": output = monthEnum[date[1]] + "/" + parseInt(date[2].replace(",", ""), 10) + "/" + parseInt(date[3], 10); break;
    case "m-d-y": output = monthEnum[date[1]] + "-" + parseInt(date[2].replace(",", ""), 10) + "-" + parseInt(date[3], 10); break;
    case "date": output = date[1] + " " + parseInt(date[2].replace(",", ""), 10) + ", " + parseInt(date[3], 10); break;
    case "time": output = date[5] + " " + date[6]; break;
    case "hour": output = date[5].split(":")[0] + " " + date[6]; break;
    case "militaryTime": output = this.toMilitaryTime(`${date[5].split(":").slice(0, 2)} ${date[6]}`); break;
    case "unix": output = Math.floor(newDate.getTime() / 1000) - (60 * 60 * 3); break;
    default: output = date.join(" ");

  };

  return output;

};

exports.getStateOfTheDay = (time = Date.now()) => {

  const {
    toMilitaryTime,
    getAccurateDate
  } = this;
  const militaryTime = toMilitaryTime(getAccurateDate("time", time));
  const rawHour = militaryTime.split(":")[0];
  const hour = parseInt(rawHour, 10);
  let output;

  if (hour < 12 && hour !== 12) output = { en: "morning", tl: "umaga" };
  else if (hour === 12) output = { en: "noon", tl: "tanghali" };
  else if (hour < 18) output = { en: "afternoon", tl: "hapon" };
  else output = { en: "evening", tl: "gabi" };

  console.log(hour === 12, hour, time)

  return output;

};

exports.getWeekNumber = () => {

  const date = new Date();
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const millisecondsSinceFirstDay = date - firstDayOfYear;
  const daysSinceFirstDay = (millisecondsSinceFirstDay + 86400000) / (24 * 60 * 60 * 1000);
  const weekNumber = Math.ceil(daysSinceFirstDay / 7);

  return weekNumber;

};

exports.getDay = (unix, humanized = false) => {

  const daysOftheWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const date = new Date(unix * 1000);
  let day = this.changeTimezone(date).getDay();

  return humanized ? daysOftheWeek[day] : day;

};

exports.weekToUnix = (weekNumber, year) => {

  const firstDayOfYear = new Date(year, 0, 1);
  const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;
  const startOfWeek = firstDayOfYear.getTime() + (weekNumber - 1) * millisecondsInWeek;

  return startOfWeek / 1000;

};

exports.mdyToUnix = (month, day, year) => {

  const date = new Date(year, month, day);

  return Math.floor(date.getTime() / 1000);

};

exports.fancyText = (text, type) => {

  const boldSansCharMap = {"0":"𝟬","1":"𝟭","2":"𝟮","3":"𝟯","4":"𝟰","5":"𝟱","6":"𝟲","7":"𝟳","8":"𝟴","9":"𝟵","a":"𝗮","b":"𝗯","c":"𝗰","d":"𝗱","e":"𝗲","f":"𝗳","g":"𝗴","h":"𝗵","i":"𝗶","j":"𝗷","k":"𝗸","l":"𝗹","m":"𝗺","n":"𝗻","o":"𝗼","p":"𝗽","q":"𝗾","r":"𝗿","s":"𝘀","t":"𝘁","u":"𝘂","v":"𝘃","w":"𝘄","x":"𝘅","y":"𝘆","z":"𝘇","A":"𝗔","B":"𝗕","C":"𝗖","D":"𝗗","E":"𝗘","F":"𝗙","G":"𝗚","H":"𝗛","I":"𝗜","J":"𝗝","K":"𝗞","L":"𝗟","M":"𝗠","N":"𝗡","O":"𝗢","P":"𝗣","Q":"𝗤","R":"𝗥","S":"𝗦","T":"𝗧","U":"𝗨","V":"𝗩","W":"𝗪","X":"𝗫","Y":"𝗬","Z":"𝗭"};
  const italicCharMap = {"0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","a":"𝘢","b":"𝘣","c":"𝘤","d":"𝘥","e":"𝘦","f":"𝘧","g":"𝘨","h":"𝘩","i":"𝘪","j":"𝘫","k":"𝘬","l":"𝘭","m":"𝘮","n":"𝘯","o":"𝘰","p":"𝘱","q":"𝘲","r":"𝘳","s":"𝘴","t":"𝘵","u":"𝘶","v":"𝘷","w":"𝘸","x":"𝘹","y":"𝘺","z":"𝘻","A":"𝘈","B":"𝘉","C":"𝘊","D":"𝘋","E":"𝘌","F":"𝘍","G":"𝘎","H":"𝘏","I":"𝘐","J":"𝘑","K":"𝘒","L":"𝘓","M":"𝘔","N":"𝘕","O":"𝘖","P":"𝘗","Q":"𝘘","R":"𝘙","S":"𝘚","T":"𝘛","U":"𝘜","V":"𝘝","W":"𝘞","X":"𝘟","Y":"𝘠","Z":"𝘡"};
  const boldItalicCharMap = {"0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","a":"𝙖","b":"𝙗","c":"𝙘","d":"𝙙","e":"𝙚","f":"𝙛","g":"𝙜","h":"𝙝","i":"𝙞","j":"𝙟","k":"𝙠","l":"𝙡","m":"𝙢","n":"𝙣","o":"𝙤","p":"𝙥","q":"𝙦","r":"𝙧","s":"𝙨","t":"𝙩","u":"𝙪","v":"𝙫","w":"𝙬","x":"𝙭","y":"𝙮","z":"𝙯","A":"𝘼","B":"𝘽","C":"𝘾","D":"𝘿","E":"𝙀","F":"𝙁","G":"𝙂","H":"𝙃","I":"𝙄","J":"𝙅","K":"𝙆","L":"𝙇","M":"𝙈","N":"𝙉","O":"𝙊","P":"𝙋","Q":"𝙌","R":"𝙍","S":"𝙎","T":"𝙏","U":"𝙐","V":"𝙑","W":"𝙒","X":"𝙓","Y":"𝙔","Z":"𝙕"};
  let chosenType = type === 0 ? boldSansCharMap : type === 1 ? italicCharMap : boldItalicCharMap;
  let output = "";

  text.split("").forEach(char => {
    if (undefined || chosenType[char] === undefined) output += char;
    else output += chosenType[char];
  });

  return output;

};

exports.uniqByKeepFirst = (a, key) => {
  let seen = new Set();
  return a.filter(item => {
      let k = key(item);
      return seen.has(k) ? false : seen.add(k);
  });
};


exports.uniqByKeepLast = (a, key) => {

  return [
      ...new Map(
          a.map(x => [key(x), x])
      ).values()
  ];

};

exports.mongo = {

    async connect () {

      mongo.set('strictQuery', true);
	    mongo.set('autoIndex', false);

	    await mongo.connect(url);
	    mongo.Promise = global.Promise;

    },

    async disconnect () {

        setTimeout(async () => {

            await mongo.disconnect();

        }, 2000);

    }

};