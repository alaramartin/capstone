// time limiting functionality
// block websites by domain name

// get the limits lists from popup.js (probably don't need saveLimits)
import { saveLimitsList, loadLimitsList } from "./popup.js";

// save the list of alarms (same idea as popup.js savelist)
async function saveTimeList(list) {
  await chrome.storage.local.set({ "timespent" : list });
}

// load the list of alarms (same idea as popup.js loadlist)
async function loadTimeList() {
  const result = await chrome.storage.local.get("timespent");
  if (result.allData == undefined) return "n/a";
  console.log("loadlist", result.allData);
  return result.allData;
}

// key-value pair of {website url : time spent on that website}
let screenTime = await loadTimeList();
let lims = await loadLimitsList();



// returns url of current tab
// TODO: only return domain name like instagram.com and not https://instagram.com/w8983432
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

chrome.alarms.onAlarm.addListener((alarm) => {
  // do something for alarm
});


let currentTab = null;
let timeSpent = 0;

async function updateTime(website, time) {
  screenTime = await loadTimeList();
  if (website in screenTime) {
    screenTime[website] += time;
  }
  else {
    screenTime[website] = time;
  }
  await saveTimeList(screenTime);
}

// TODO: actually redo this, don't need to implement alarms yet
// FIRST TODO: save time spent on each website. after time spent is properly recorded, can implement alarms
// TODO: use chrome.tabs.onUpdated so that same tab, new page still counts as switching websites

// TODO: change it so that when the tab is activated or updated, it calculates the time of the previous tab and then starts timer for new
  chrome.tabs.onActivated.addListener(async function() {
    
    // TODO: record the start time, then once go away from the tab, stop recording, calculate time spent, and update screenTime
    var startTime = Date.now();
    timeSpent += (Date.now() - startTime) / 1000;
  });