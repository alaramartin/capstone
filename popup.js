function addItemToList(item) {
    var list = document.getElementById("list-of-limits");
    var newItem = document.createElement("li");
    newItem.innerHTML = item;
    list.appendChild(newItem);
}

async function saveLimitsList(list) {
    await chrome.storage.local.set({ "limits" : list });
}

async function loadLimitsList() {
    const result = await chrome.storage.local.get("limits");
    if (result.limits == undefined) return "n/a";
    console.log("loadlist", result.limits);
    return result.limits;
}

let lims = await loadLimitsList();
displayList();
let resetButton = document.getElementById("reset");

// shows the list of limits on the popup alphabetically
// no duplicates, if there is a duplicate key it updates the value
async function displayList() {
    document.getElementById("list-of-limits").innerHTML = "";
    lims = await loadLimitsList();
    for (const [key, value] of Object.entries(lims)) {
        addItemToList("Website: " + key + ", time limit: " +  value);
    }
}

// get the time limit user input and save to list `lims`
// TODO: make the input require domain name format, or make it more versatile
const inputElement = document.getElementById("userlimit");
inputElement.addEventListener("submit", async function(event) {
    event.preventDefault(); // stop the extension from reloading
    var website = document.getElementById("timelimurl").value;
    var timeLim = document.getElementById("timelimmin").value;
    lims[website] = timeLim;
    await saveLimitsList(lims);
    displayList();
    // reset the input fields after submitting
    document.getElementById("timelimurl").value = "";
    document.getElementById("timelimmin").value = "";
});

// deletes all saved limits
resetButton.addEventListener("click", function() {
    document.getElementById("list-of-limits").innerHTML = "";
    lims = {};
    saveLimitsList(lims);
});










// clicker counter
// function save(value) {
//     chrome.storage.local.set({ "key" : value }, function(){
//         console.log("key set to ",  value );
//     });
// }

// async function load() {
//     const result = await chrome.storage.local.get("key");
//     if (result.key == undefined) return 0;
//     console.log(result.key);
//     return parseInt(result.key);
// }

// let count = await load();
// disp.innerHTML = count;
// let btn = document.getElementById("btn");
// let btn1 = document.getElementById("btn1");

// btn.addEventListener ("click", function () {
//     console.log(count);
//     count++;
//     disp.innerHTML = count;
//     console.log(disp.innerHTML);
//     save(parseInt(disp.innerHTML));
// });

// btn1.addEventListener ("click", function () {
//     count = 0;
//     disp.innerHTML = count;
//     save(parseInt(disp.innerHTML));
// });