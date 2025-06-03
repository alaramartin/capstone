chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker activated!");
  initialize();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getScreenTime") {
    loadTimeList().then((screenTime) => {
      sendResponse({ data: screenTime });
    });
    // tells Chrome you're responding async
    return true; 
  }

  if (message.action === "blocked-website") {
    console.log("block.js activated");
  }
});



// get the limits list
async function loadLimitsList() {
  const result = await chrome.storage.local.get("limits");
  if (result.limits == undefined) return {};
  console.log("loadlimlist", result.limits);
  return result.limits;
}

// save the list of alarms (same idea as popup.js savelist)
async function saveTimeList(list) {
  await chrome.storage.local.set({ "timespent" : list });
}

// load the list of alarms (same idea as popup.js loadlist)
async function loadTimeList() {
  const result = await chrome.storage.local.get("timespent");
  if (result.timespent == undefined) return {};
  console.log("loadtimelist", result.timespent);
  return result.timespent;
}

let screenTime = {};
let lims = {};
let timeoutId = null;
async function initialize() {
  screenTime = await loadTimeList();
  lims = await loadLimitsList();
  console.log(screenTime, lims);
  timeoutId = null;
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function getTabDomain(tab) {
  // if tab isn't null, return domain name of tab
  if (tab && tab.url) {
    try {
      let urlObj = new URL(tab.url);
      console.log("nothing wrong with url", tab.url);
      return urlObj.hostname;
    }
    catch (e) {
      console.log("something wrong with url", tab.url);
      console.log("error ", e);
    }
  }
  else {
    console.log("tab was null");
  }
}



let currentTab = null;
let timeSpent = 0;
let startTime = null;
// display the list
chrome.runtime.sendMessage({
  action: "list-of-screen-time",
  data: screenTime
});

async function updateTime(website, time) {
  screenTime = await loadTimeList();
  if (website in screenTime) {
    console.log("updating screentime for website ", website, ", with previous time ", screenTime[website]);
    screenTime[website] += time;
  }
  else {
    screenTime[website] = time;
    console.log("adding ", website, "to list with time ", screenTime[website]);
  }
  await saveTimeList(screenTime);
  console.log("Updating time for:", website, "New time:", screenTime[website]);

  // display the list
  chrome.runtime.sendMessage({
    action: "list-of-screen-time",
    data: screenTime
  });
}

// saves time spent on the website when tab switched
chrome.tabs.onActivated.addListener(async function(tabId, changeInfo, tab) {
  console.log("onactivated");

  handleWebsiteChange();
});

// if the tab was updated and the website was changed, just act like the tab was changed
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  console.log("onupdated");

  // check if tab has finished loading/reloading
  if (changeInfo.status === "complete") {
    console.log("changeInfo.url: ", changeInfo.url);
    handleWebsiteChange();
  }
});

async function handleWebsiteChange() {
  screenTime = await loadTimeList();
  lims = await loadLimitsList();
  let oldTab = currentTab;
  currentTab = await getCurrentTab();
  let currentTabHostname = getTabDomain(currentTab);
  let oldTabHostname = getTabDomain(oldTab);
  if (oldTab) {
    console.log("(updated) Tab changed. Old:", oldTabHostname, "New:", currentTabHostname);
  }
  else {
    console.log("(updated) New tab: ", currentTabHostname);
  }

  // update time spent on previous tab if not timed out/exists
  if (startTime != null) {
    timeSpent += (Date.now() - startTime) / 1000;
    await updateTime(oldTabHostname, timeSpent);
  }
  // clear previous timer if not timed out/exists
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  // begin timing new url
  timeSpent = 0;
  startTime = Date.now();

  // set a timeout timer -> call timeout() when the screen time limit runs out IF THERE IS A TIME LIMIT SET
  if (lims[currentTabHostname]) {
    if (!screenTime[currentTabHostname]) {
      screenTime[currentTabHostname] = 0;
    }
    // time left for that website, in milliseconds
    let timeLeft = 1000 * (lims[currentTabHostname] - screenTime[currentTabHostname]);
    console.log("time difference: ", timeLeft);
    // if limit has already been surpassed, immediately block
    if (timeLeft < 0) {
      // default to 10 seconds for testing purposes
      // timeLeft = 10 * 1000;
      console.log("time limit already surpassed");
      await blockSite(currentTab);
      startTime = null;
    }
    // else, if there is still time left, set timout timer
    else {
      // function reference to timeout(), to call after a delay of `timeLeft`
      timeoutId = setTimeout(() => timeout(currentTab), timeLeft);
      console.log("set timeout timer ", timeoutId, " ", currentTabHostname);
    }
    
  }
}

// block the tab once time is up
async function timeout(tab) {
  await blockSite(tab);
  console.log("timed out ", getTabDomain(tab), "!");
  // stop tracking time on the website
  await stopTimer();
}

// if timeout() called, stop recording time, update screenTime with screenTime = timeLimit (which should == timeSpent)
async function stopTimer() {
  console.log("received stop-timer");
  let currentTabHostname = getTabDomain(currentTab);
  timeSpent += (Date.now() - startTime) / 1000;
  // idk if i need this line but just to make sure it doesn't try to update again once tab changes
  startTime = null;
  // check if the timespent is within 0.5 seconds of the time limit (it should be, if timed out)
  if (!(Math.abs(timeSpent - lims[currentTabHostname]) < 0.5)) {
    console.log("there is something wrong with timeout");
  }
  // if timeout is called, clear the timer
  clearTimeout(timeoutId);
  // set timer to null so it doesn't try to clear once tab changes
  timeoutId = null;
  // update time saved
  await updateTime(currentTabHostname, timeSpent);
}

// inject content script to block access to the site
async function blockSite(tab) {
  console.log("website blocked on ", getTabDomain(tab));
  // inject content script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["block.js"]
  });
  // inject content script's css file
  await chrome.scripting.insertCSS({
      target: {
        tabId: tab.id,
      },
      files: ["block.css"]
    });
}


// TODO
// alarm that triggers every 10 seconds to update the popup
chrome.alarms.create({ 
    delayInMinutes: 0.16,
    periodInMinutes: 0.16
});
chrome.alarms.onAlarm.addListener(() => {
  console.log("awake");
  // display the list
  chrome.runtime.sendMessage({
    action: "list-of-screen-time",
    data: screenTime
  });
});