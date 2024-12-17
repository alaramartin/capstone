let disp = document.getElementById("display");
let lim = document.getElementById("lim");

let lims = {};

function saveList(list) {
    chrome.storage.local.set({"allData": list }, function() {
        console.log("list set to ", list);
    });
}

async function loadList() {
    const result = await chrome.storage.local.get("allData");
    if (result.allData == undefined) return "n/a";
    console.log("loadlist", result.allData);
    return result.allData;
}

function save(value) {
    chrome.storage.local.set({ "key": value }, function(){
        console.log("key set to ",  value );
    });
}

async function load() {
    const result = await chrome.storage.local.get("key");
    if (result.key == undefined) return 0;
    console.log(result.key);
    return parseInt(result.key);
}

let count = await load();
disp.innerHTML = count;
let limit = await loadList();
lim.innerHTML = limit.website1;
let btn = document.getElementById("btn");
let btn1 = document.getElementById("btn1");
let btn2 = document.getElementById("btn2");


btn.addEventListener ("click", function () {
    console.log(count);
    count++;
    disp.innerHTML = count;
    console.log(disp.innerHTML);
    save(parseInt(disp.innerHTML));
});

btn1.addEventListener ("click", function () {
    count = 0;
    disp.innerHTML = count;
    save(parseInt(disp.innerHTML));
});

btn2.addEventListener ("click", function() {
    lims.website1 = disp.innerHTML;
    saveList(lims);
    count = 0;
    disp.innerHTML = count;
    save(parseInt(disp.innerHTML));
    lim.innerHTML = lims.website1;
});






//form ???????????????????????

// const form = document.querySelector("#userlimit");

// async function sendData() {
//     const formData = new FormData(form);
// }

