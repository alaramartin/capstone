function addItemToList(item, list) {
    var newItem = document.createElement("li");
    newItem.innerHTML = item;
    list.appendChild(newItem);
}

async function saveLimitsList(list) {
    await chrome.storage.local.set({ "limits" : list });
}

async function loadLimitsList() {
    const result = await chrome.storage.local.get("limits");
    if (result.limits == undefined) return {};
    console.log("loadlimlist", result.limits);
    return result.limits;
}

async function loadTimeList() {
    chrome.runtime.sendMessage({ action: "getScreenTime" }, (response) => {
    if (response && response.data) {
        console.log("Received screen time data ", JSON.stringify(response.data));
        displayTimeList(response.data);
    } else {
        console.log("No screen time data received.");
    }
    });
}

let lims = {};
async function init() {
    lims = await loadLimitsList();
    displayList();
    // let usage = await loadTimeList();
    // displayTimeList(usage);
    loadTimeList();
}
init();


// shows the list of limits on the popup alphabetically
// no duplicates, if there is a duplicate key it updates the value
async function displayList() {
    let limsList = document.getElementById("list-of-limits");
    limsList.innerHTML = "";
    lims = await loadLimitsList();
    for (const [key, value] of Object.entries(lims)) {
        addItemToList("Website: " + key + ", time limit: " +  value, limsList);
    }
}

function displayTimeList(screenTime) {
    let timeList = document.getElementById("list-of-screen-time");
    timeList.innerHTML = "";
    for (const [key, value] of Object.entries(screenTime)) {
        var hours = Math.floor(value/(60*60));
        var minutes = Math.floor((value - hours*60*60)/60);
        var seconds = (value - hours*60*60 - minutes*60).toFixed(2);
        addItemToList(`Website: ${key}, usage: ${hours} hours, ${minutes} minutes, ${seconds} seconds`, timeList);
    }
}

// get the time limit user input (convert to seconds) and save to list `lims`
// TODO: make the input require domain name format AND reject empty input ""
const inputElement = document.getElementById("userlimit");
inputElement.addEventListener("submit", async function(event) {
    event.preventDefault(); // stop the extension from reloading
    var website = document.getElementById("timelimurl").value;
    var timeLim = parseInt(document.getElementById("timelimh").value) * 60 * 60 + parseInt(document.getElementById("timelimmin").value) * 60 + parseInt(document.getElementById("timelimsec").value);
    lims[website] = timeLim;
    await saveLimitsList(lims);
    displayList();
    // reset the input fields after submitting
    document.getElementById("timelimurl").value = "";
    document.getElementById("timelimh").value = "";
    document.getElementById("timelimmin").value = "";
    document.getElementById("timelimsec").value = "";
    console.log("hi");
});

// deletes all saved limits
let resetButton = document.getElementById("reset");
resetButton.addEventListener("click", function() {
    document.getElementById("list-of-limits").innerHTML = "";
    lims = {};
    saveLimitsList(lims);
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "list-of-screen-time") {
        console.log("Popup received update:", JSON.stringify(message.data));
        displayTimeList(message.data);
    }
});

// update the popup with new usage every 0.1 minute WHILE on the website
// loadtimelist is being called every 6 seconds, but popup doesn't change?
// OH it's because screenTime in background.js doesn't actually get updated until the tab is changed...
// ^^ even considering that, i still don't know why it doesn't update when changing tab after more than 30 seconds. maybe timeout issue
// ^^ probbaly fixed by setinterval, if background does something every millisecond it won't time out

// (allat above) bad practice. chrome.alarms might be the solution to update every second
// setInterval(loadTimeList, 6000)

// TODO: MAKE SCREENTIME UPDATE CONTINUOUSLY using setInterval(updatetime) with no delay parameter to default to 0 ms
// or could do every millisecond <- but what if tab is changed during that millisecond


// it works when spending less than 30 seconds on the site:
//    doesn't update automatically, but updates when switch the tab
// but when spend more than 30 seconds on the popup, doesn't update automatically and also doesn't update when switch the tab