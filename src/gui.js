window.onload = init;
window.onerror = logError;
const rootPath = process.env.DEV_ENV ? 
    path.join(__dirname, '..') :
    (process.platform == 'win32' ? 
        process.env.PORTABLE_EXECUTABLE_DIR :
        path.dirname(process.env.APPIMAGE)
    );
const mainPath = path.join(rootPath, 'resources');
const textPath = path.join(rootPath, 'resources', 'Texts');
const charPath = path.join(rootPath, 'resources', 'Characters');
const playerPath = path.join(rootPath, 'resources', 'Players');

const apiKey = getJson("StartGG").apiKey || ""

const Jimp = require("jimp");

const OBSWebSocket = require('obs-websocket-js').default;
const obs = new OBSWebSocket()

obs.on('ConnectionOpened', () => {
    console.log('Connected to OBS WebSocket');

    obsConnected = true;

    document.getElementById("sceneGameStart").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneGameStartDelay").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneGameEnd").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneGameEndDelay").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneSetEnd").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneSetEndDelay").disabled = !autoSwitchScenes.checked;

    document.getElementById("connectOBSStatus").textContent = "Connected";
});

obs.on('ConnectionClosed', () => {

    obsConnected = false;

    document.getElementById("sceneGameStart").disabled = true;
    document.getElementById("sceneGameStartDelay").disabled = true;
    document.getElementById("sceneGameEnd").disabled = true;
    document.getElementById("sceneGameEndDelay").disabled = true;
    document.getElementById("sceneSetEnd").disabled = true;
    document.getElementById("sceneSetEndDelay").disabled = true;

    document.getElementById("connectOBSStatus").textContent = "Disconnected";
});

obs.on('ConnectionError', (err) => {
    obsConnected = false;
    document.getElementById("connectOBSStatus").textContent = "Error: " + err.error;
    console.error('Failed to connect: ' + err);
    logError(`Failed to connect to OBS: ${err}`);
});

const noop = () => { };

const fieldIds = [
    "slippiDirectory",
    "obsURL",
    "obsPort",
    "obsPassword",
    "startGGSlug",
    "p1Name",
    "p1Pronouns",
    "p1Country",
    "p2Name",
    "p2Pronouns",
    "p2Country",
    "roundName",
    "tournamentName",
    "cName1",
    "cTwitter1",
    "cPronouns1",
    "cName2",
    "cTwitter2",
    "cPronouns2",
    "nextP1",
    "nextP2",
    "nextRound",
    "sceneGameStart",
    "sceneGameStartDelay",
    "sceneGameEnd",
    "sceneGameEndDelay",
    "sceneSetEnd",
    "sceneSetEndDelay"
]

const checkboxIds = [
    "forceWLToggle",
    "makeUppercase",
    "addSpace",
    "showDoubles",
    "autoSwitchScenes"
]

function saveFieldValuesToStorage() {
    for (const id of fieldIds) {
        const field = document.getElementById(id);
        if (field) {
            localStorage.setItem(id, field.value);
        }
    }

    for (const id of checkboxIds) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            localStorage.setItem(id, checkbox.checked);
        }
    }
}

function restoreFieldValuesFromStorage() {
    for (const id of fieldIds) {
        const field = document.getElementById(id);
        if (field) {
            field.value = localStorage.getItem(id);
            if(id === "slippiDirectory") {
                setDirectory(field.value)
            }
            if (field.oninput) {
                field.oninput(field);
            }
        }
    }

    for (const id of checkboxIds) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = localStorage.getItem(id) === 'true';
            if (checkbox.onclick) {
                checkbox.onclick(checkbox);
            }
        }
    }

}

//yes we all like global variables
let charP1 = "Random";
let charP2 = "Random";
let skinP1 = "";
let skinP2 = "";
let portP1 = 1;
let portP2 = 2;
let teamP1 = 0;
let teamP2 = 0;
let colorP1, colorP2;
let currentP1WL = "Nada";
let currentP2WL = "Nada";
let currentBestOf = "Best of 3";
let isDoubles = false;

let p1P1Name = ""
let p1P2Name = ""
let p1DubsSwapped = false

let p2P1Name = ""
let p2P2Name = ""
let p2DubsSwapped = false

let movedSettings = false;
let charP1Active = false;

let scoreP1 = 0;
let scoreP2 = 0;

let setHistory = '? - ?';

const viewport = document.getElementById('viewport');

const obsURLInp = document.getElementById('obsURL');
const obsPortInp = document.getElementById('obsPort');
const obsPasswordInp = document.getElementById('obsPassword');

const p1NameInp = document.getElementById('p1Name');
const p1PronounsInp = document.getElementById('p1Pronouns');

const p2NameInp = document.getElementById('p2Name');
const p2PronounsInp = document.getElementById('p2Pronouns');

const charImgP1 = document.getElementById('p1CharImg');
const charImgP2 = document.getElementById('p2CharImg');

const p1Score = document.getElementById('p1Score');
p1Score.oninput = () => scoreP1 = p1Score.value;
const p2Score = document.getElementById('p2Score');
p2Score.oninput = () => scoreP2 = p2Score.value;

const p1W = document.getElementById('p1W');
const p1L = document.getElementById('p1L');
const p2W = document.getElementById('p2W');
const p2L = document.getElementById('p2L');

const roundInp = document.getElementById('roundName');
roundInp.onchange = () => {
    localStorage.setItem('roundName', roundInp.value);
}

const forceWL = document.getElementById('forceWLToggle');
const makeUppercase = document.getElementById('makeUppercase');
const addSpace = document.getElementById('addSpace');

const autoSwitchScenes = document.getElementById('autoSwitchScenes');
const sceneGameStartInp = document.getElementById('sceneGameStart');
const sceneGameStartDelayInp = document.getElementById('sceneGameStartDelay');

const sceneGameEndInp = document.getElementById('sceneGameEnd');
const sceneGameEndDelayInp = document.getElementById('sceneGameEndDelay');

const sceneSetEndInp = document.getElementById('sceneSetEnd');
const sceneSetEndDelayInp = document.getElementById('sceneSetEndDelay');

let player1Data;
let player2Data;

let crewsStocksPlayer;
let crewsStocksLeft = 0;
let crewsNextRound;

let setStartTime;
let setOfficiallyStarted;
let obsRecordingPath = '';

let portPrioSwapped = false;

let obsConnected = false;
let sceneSwitchTimeout;

function init() {
    onGameStarted(updatePlayers)
    onGameFinished(updateScore)

    //first, add listeners for the bottom bar buttons
    document.getElementById('updateRegion').addEventListener("click", writeScoreboard);
    document.getElementById('settingsRegion').addEventListener("click", moveViewport);

    //if the viewport is moved, click anywhere on the center to go back
    document.getElementById('goBack').addEventListener("click", goBack);


    /* OVERLAY */

    //set initial values for the character selectors
    document.getElementById('p1CharSelector').setAttribute('src', charPath + '/CSS/Random.png');
    document.getElementById('p2CharSelector').setAttribute('src', charPath + '/CSS/Random.png');
    //if clicking them, show the character roster
    document.getElementById('p1CharSelector').addEventListener("click", openChars);
    document.getElementById('p2CharSelector').addEventListener("click", openChars);

    //create the character roster
    createCharRoster();
    //if clicking the entirety of the char roster div, hide it
    document.getElementById('charRoster').addEventListener("click", hideChars);

    //update the character image (to random)
    charImgChange(charImgP1, "Random", colorP1);
    charImgChange(charImgP2, "Random", colorP2);

    //check whenever an image isnt found so we replace it with a "?"
    document.getElementById('p1CharImg').addEventListener("error", () => {
        document.getElementById('p1CharImg').setAttribute('src', charPath + '/Portraits/Random.png');
    });
    document.getElementById('p2CharImg').addEventListener("error", () => {
        document.getElementById('p2CharImg').setAttribute('src', charPath + '/Portraits/Random.png');
    });

    p1W.addEventListener("click", setWLP1);
    p1L.addEventListener("click", setWLP1);
    p2W.addEventListener("click", setWLP2);
    p2L.addEventListener("click", setWLP2);

    //check whenever the player's name has a skin
    p1NameInp.addEventListener("input", resizeInput);
    p2NameInp.addEventListener("input", resizeInput);

    //resize the box whenever the user types
    p1PronounsInp.addEventListener("input", resizeInput);
    p2PronounsInp.addEventListener("input", resizeInput);


    //set click listeners to change the "best of" status
    document.getElementById("bo3Div").addEventListener("click", changeBestOf);
    document.getElementById("bo5Div").addEventListener("click", changeBestOf);
    document.getElementById("boCrews").addEventListener("click", changeBestOf);
    document.getElementById("boEndless").addEventListener("click", changeBestOf);
    //set initial value
    document.getElementById("bo3Div").style.color = "linear-gradient(to top, #575757, #00000000)";
    document.getElementById("bo5Div").style.backgroundImage = "var(--text2)";
    document.getElementById("boCrews").style.backgroundImage = "var(--text2)";
    document.getElementById("boEndless").style.backgroundImage = "var(--text2)";


    //check if the round is grand finals
    roundInp.addEventListener("input", checkRound);


    //add a listener to the swap button
    document.getElementById('swapButton').addEventListener("click", swap);
    //add a listener to the clear button
    document.getElementById('clearButton').addEventListener("click", clearPlayers);


    /* SETTINGS */

    //set a listener for the forceWL check
    forceWL.addEventListener("click", forceWLtoggles);

    /* KEYBOARD SHORTCUTS */

    Mousetrap.bind('enter', () => {
        writeScoreboard();
        document.getElementById('botBar').style.backgroundColor = "var(--bg3)";
    }, 'keydown');
    Mousetrap.bind('enter', () => {
        document.getElementById('botBar').style.backgroundColor = "var(--bg5)";
    }, 'keyup');

    Mousetrap.bind('esc', () => {
        if (movedSettings) { //if settings are open, close them
            goBack();
        } else if (document.getElementById('charRoster').style.opacity == 1) {
            hideChars(); //if charRoster is visible, hide it
        } else {
            clearPlayers();
        }
    });

    Mousetrap.bind('f1', () => { giveWinP1() });
    Mousetrap.bind('f2', () => { giveWinP2() });
    Mousetrap.bind('f9', () => { createReplay(true) });
}

function setRecordingPath(path) {
    obsRecordingPath = path;
    document.getElementById("replayButton").disabled = !obsRecordingPath;
    document.getElementById("thumbnailButton").disabled = !obsRecordingPath;
    document.getElementById("shortButton").disabled = !obsRecordingPath;
}


function moveViewport() {
    if (!movedSettings) {
        viewport.style.right = "40%";
        document.getElementById('overlay').style.opacity = "25%";
        document.getElementById('goBack').style.display = "block"
        movedSettings = true;
    }
}

function goBack() {
    viewport.style.right = "0%";
    document.getElementById('overlay').style.opacity = "100%";
    document.getElementById('goBack').style.display = "none";
    movedSettings = false;
}


//called whenever we need to read a json file
function getJson(fileName) {
    try {
        fileDir = path.join(mainPath, `${fileName}.json`)
        let json = fs.readFileSync(fileDir);
        return JSON.parse(json);
    } catch (error) {
        console.error(error)
        return undefined;
    }
}

function getTextJson(fileName) {
    try {
        let settingsRaw = fs.readFileSync(textPath + "/" + fileName + ".json");
        return JSON.parse(settingsRaw);
    } catch (error) {
        console.error(error)
        return undefined;
    }
}

function updateColor(e, n, c) {
    let pNum; //you've seen this one enough already, right?
    if (!n) {
        if (this.parentElement.parentElement == document.getElementById("p1Color")) {
            pNum = 1;
        } else {
            pNum = 2;
        }
    } else {
        pNum = n;
    }

    let colorList = getTextJson("InterfaceInfo");
    let clickedColor = c ? colorList.colorSlots["color" + (c - 1)].name : this.textContent;

    //search for the color we just clicked
    for (let i = 0; i < Object.keys(colorList.colorSlots).length; i++) {
        if (colorList.colorSlots["color" + i].name == clickedColor) {
            let colorRectangle, colorGrad;

            colorGrad = document.getElementById("player" + pNum);

            //change the variable that will be read when clicking the update button
            if (pNum == 1) {
                colorP1 = colorList.colorSlots["color" + i].name;
            } else {
                colorP2 = colorList.colorSlots["color" + i].name;
            }

            //then change both the color rectangle and the background gradient
            colorGrad.style.backgroundImage = "linear-gradient(to bottom left, " + colorList.colorSlots["color" + i].hex + "50, #00000000, #00000000)";

            //also, if random is up, change its color
            if (pNum == 1) {
                if (charP1 == "Random") {
                    document.getElementById('p1CharImg').setAttribute('src', charPath + '/Portraits/Random.png');
                }
            } else {
                if (charP2 == "Random") {
                    document.getElementById('p2CharImg').setAttribute('src', charPath + '/Portraits/Random.png');
                }
            }

        }
    }

    //remove focus from the menu so it hides on click
    if (!n) {
        this.parentElement.parentElement.blur();
    }
}


//change the image path depending on the character and skin
function charImgChange(charImg, charName, skinName = "Default") {
    if (charName == "Random") {
        charImg.setAttribute('src', charPath + '/Portraits/Random.png');
    } else {
        charImg.setAttribute('src', charPath + '/Portraits/' + charName + '/' + skinName + '.png');
    }
}


function createCharRoster() {
    //checks the character list which we use to order stuff
    const guiSettings = getTextJson("InterfaceInfo");

    //first row
    for (let i = 0; i < 9; i++) {
        let newImg = document.createElement('img');
        newImg.className = "charInRoster";
        newImg.setAttribute('src', charPath + '/CSS/' + guiSettings.charactersBase[i] + '.png');

        newImg.id = guiSettings.charactersBase[i]; //we will read this value later
        newImg.addEventListener("click", changeCharacter);

        document.getElementById("rosterLine1").appendChild(newImg);
    }
    //second row
    for (let i = 9; i < 19; i++) {
        let newImg = document.createElement('img');
        newImg.className = "charInRoster";

        newImg.id = guiSettings.charactersBase[i];
        newImg.addEventListener("click", changeCharacter);

        newImg.setAttribute('src', charPath + '/CSS/' + guiSettings.charactersBase[i] + '.png');
        document.getElementById("rosterLine2").appendChild(newImg);
    }
    //third row
    for (let i = 19; i < 26; i++) {
        let newImg = document.createElement('img');
        newImg.className = "charInRoster";

        newImg.id = guiSettings.charactersBase[i];
        newImg.addEventListener("click", changeCharacter);

        newImg.setAttribute('src', charPath + '/CSS/' + guiSettings.charactersBase[i] + '.png');
        document.getElementById("rosterLine3").appendChild(newImg);
    }
}

//whenever we click on the character change button
function openChars() {
    charP1Active = false; //simple check to know if this is P1 or P2, used on other functions
    if (this == document.getElementById('p1CharSelector')) {
        charP1Active = true;
    }

    document.getElementById('charRoster').style.display = "flex"; //show the thing
    setTimeout(() => { //right after, change opacity and scale
        document.getElementById('charRoster').style.opacity = 1;
        document.getElementById('charRoster').style.transform = "scale(1)";
    }, 0);
}
//to hide the character grid
function hideChars() {
    document.getElementById('charRoster').style.opacity = 0;
    document.getElementById('charRoster').style.transform = "scale(1.2)";
    setTimeout(() => {
        document.getElementById('charRoster').style.display = "none";
    }, 200);
}

//called whenever clicking an image in the character roster
function changeCharacter() {
    if (charP1Active) {
        charP1 = this.id;
        skinP1 = "Default";
        document.getElementById('p1CharSelector').setAttribute('src', charPath + '/CSS/' + charP1 + '.png');
        charImgChange(charImgP1, charP1);
        addSkinIcons(1);
    } else {
        charP2 = this.id;
        skinP2 = "Default";
        document.getElementById('p2CharSelector').setAttribute('src', charPath + '/CSS/' + charP2 + '.png');
        charImgChange(charImgP2, charP2);
        addSkinIcons(2);
    }
}
//same as above but for the swap button
function changeCharacterManual(char, pNum) {
    document.getElementById('p' + pNum + 'CharSelector').setAttribute('src', charPath + '/CSS/' + char + '.png');
    if (pNum == 1) {
        charP1 = char;
        skinP1 = "Default";
        charImgChange(charImgP1, char);
        addSkinIcons(1);
    } else {
        charP2 = char;
        skinP2 = "Default";
        charImgChange(charImgP2, char);
        addSkinIcons(2);
    }
}
//also called when we click those images
function addSkinIcons(pNum) {
    document.getElementById('skinListP' + pNum).innerHTML = ''; //clear everything before adding
    let charInfo;
    if (pNum == 1) { //ahh the classic 'which character am i' check
        charInfo = getTextJson("Character Info/" + charP1);
    } else {
        charInfo = getTextJson("Character Info/" + charP2);
    }


    if (charInfo != undefined) { //if character doesnt have a list (for example: Random), skip this
        //add an image for every skin on the list
        for (let i = 0; i < charInfo.skinList.length; i++) {
            let newImg = document.createElement('img');
            newImg.className = "skinIcon";
            newImg.id = charInfo.skinList[i];
            newImg.title = charInfo.skinList[i];

            if (pNum == 1) {
                newImg.setAttribute('src', charPath + '/Stock Icons/' + charP1 + '/' + charInfo.skinList[i] + '.png');
                newImg.addEventListener("click", changeSkinP1);
            } else {
                newImg.setAttribute('src', charPath + '/Stock Icons/' + charP2 + '/' + charInfo.skinList[i] + '.png');
                newImg.addEventListener("click", changeSkinP2);
            }

            document.getElementById('skinListP' + pNum).appendChild(newImg);
        }

        document.getElementById('skinSelectorP1').style.height = "30px";
        document.getElementById('skinListP1').style.marginTop = "-1px";
        document.getElementById('skinListP1Sheik').innerHTML = '';

        document.getElementById('skinSelectorP2').style.height = "30px";
        document.getElementById('skinListP2').style.marginTop = "-1px";
        document.getElementById('skinListP2Sheik').innerHTML = '';
    }

    //if the list only has 1 skin or none, hide the skin list
    if (document.getElementById('skinListP' + pNum).children.length <= 1) {
        document.getElementById('skinSelectorP' + pNum).style.opacity = 0;
    } else {
        document.getElementById('skinSelectorP' + pNum).style.opacity = 1;
    }
}
//whenever clicking on the skin images
function changeSkinP1() {
    skinP1 = this.id;
    charImgChange(charImgP1, charP1, skinP1);
}
function changeSkinP2() {
    skinP2 = this.id;
    charImgChange(charImgP2, charP2, skinP2);
}

//returns how much score does a player have
function checkScore(el) {
    return el.value;
}

//gives a victory to player 1 
function giveWinP1() {
    scoreP1 = checkScore(p1Score);
    scoreP1 = parseInt(scoreP1) + 1;
    setScore(scoreP1, p1Score);
}

//same with P2
function giveWinP2() {
    scoreP2 = checkScore(p2Score);
    scoreP2 = parseInt(scoreP2) + 1;
    setScore(scoreP2, p2Score);
}


function setWLP1() {
    if (this == p1W) {
        currentP1WL = "W";
        this.style.color = "var(--text1)";
        p1L.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p1L.style.backgroundImage = "var(--bg4)";
    } else {
        currentP1WL = "L";
        this.style.color = "var(--text1)";
        p1W.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p1W.style.backgroundImage = "var(--bg4)";
    }
}
function setWLP2() {
    if (this == p2W) {
        currentP2WL = "W";
        this.style.color = "var(--text1)";
        p2L.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p2L.style.backgroundImage = "var(--bg4)";
    } else {
        currentP2WL = "L";
        this.style.color = "var(--text1)";
        p2W.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p2W.style.backgroundImage = "var(--bg4)";
    }
}
function deactivateWL() {
    currentP1WL = "Nada";
    currentP2WL = "Nada";
    document.getElementById;

    pWLs = document.getElementsByClassName("wlBox");
    for (let i = 0; i < pWLs.length; i++) {
        pWLs[i].style.color = "var(--text2)";
        pWLs[i].style.backgroundImage = "var(--bg4)";
    }
}


//same code as above but just for the player tag
function resizeInput() {
    changeInputWidth(this);
}

//changes the width of an input box depending on the text
function changeInputWidth(input) {
    input.style.width = getTextWidth(input.value,
        window.getComputedStyle(input).fontSize + " " +
        window.getComputedStyle(input).fontFamily
    ) + 12 + "px";
}


//used to get the exact width of a text considering the font used
function getTextWidth(text, font) {
    let canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);
    return metrics.width;
}


//used when clicking on the "Best of" buttons
function changeBestOf() {
    let theOtherBestOf1; //we always gotta know
    let theOtherBestOf2; //we always gotta know
    let theOtherBestOf3; //we always gotta know
    if (this == document.getElementById("bo5Div")) {
        currentBestOf = "Best of 5";
        theOtherBestOf1 = document.getElementById("bo3Div");
        theOtherBestOf2 = document.getElementById("boCrews");
        theOtherBestOf3 = document.getElementById("boEndless");
        const winText = document.getElementsByClassName("winText");
        for (let i = 0; i < winText.length; i++) {
            winText[i].innerHTML = "Games";
        }
    } else if (this == document.getElementById("bo3Div")) {
        currentBestOf = "Best of 3";
        theOtherBestOf1 = document.getElementById("bo5Div");
        theOtherBestOf2 = document.getElementById("boCrews");
        theOtherBestOf3 = document.getElementById("boEndless");
        const winText = document.getElementsByClassName("winText");
        for (let i = 0; i < winText.length; i++) {
            winText[i].innerHTML = "Games";
        }
    } else if (this == document.getElementById("boCrews")) {
        currentBestOf = "Crews";
        theOtherBestOf1 = document.getElementById("bo3Div");
        theOtherBestOf2 = document.getElementById("bo5Div");
        theOtherBestOf3 = document.getElementById("boEndless");
        roundInp.value = "Game 1";
        crewsNextRound = null;
        crewsStocksPlayer = null;
        crewsStocksLeft = 0;
        const winText = document.getElementsByClassName("winText");
        for (let i = 0; i < winText.length; i++) {
            winText[i].innerHTML = "Stocks";
        }
    } else if (this == document.getElementById("boEndless")) {
        currentBestOf = "Endless";
        theOtherBestOf1 = document.getElementById("bo3Div");
        theOtherBestOf2 = document.getElementById("bo5Div");
        theOtherBestOf3 = document.getElementById("boCrews");
        const winText = document.getElementsByClassName("winText");
        for (let i = 0; i < winText.length; i++) {
            winText[i].innerHTML = "Games";
        }
    }

    //change the color and background of the buttons
    this.style.color = "var(--text1)";
    this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
    theOtherBestOf1.style.color = "var(--text2)";
    theOtherBestOf1.style.backgroundImage = "var(--bg4)";
    theOtherBestOf2.style.color = "var(--text2)";
    theOtherBestOf2.style.backgroundImage = "var(--bg4)";
    theOtherBestOf3.style.color = "var(--text2)";
    theOtherBestOf3.style.backgroundImage = "var(--bg4)";
}


function checkRound() {
    if (!forceWL.checked) {
        const wlButtons = document.getElementsByClassName("wlButtons");

        if (roundInp.value.toLocaleUpperCase().includes("Grand".toLocaleUpperCase())) {
            for (let i = 0; i < wlButtons.length; i++) {
                wlButtons[i].style.display = "inline";
            }
        } else {
            for (let i = 0; i < wlButtons.length; i++) {
                wlButtons[i].style.display = "none";
                deactivateWL();
            }
        }
    }
}


function swap() {
    let tempP1Name = p1NameInp.value;
    let tempP1Pron = p1PronounsInp.value;
    let tempP2Name = p2NameInp.value;
    let tempP2Pron = p2PronounsInp.value;

    p1NameInp.value = tempP2Name;
    p1PronounsInp.value = tempP2Pron;
    p2NameInp.value = tempP1Name;
    p2PronounsInp.value = tempP1Pron;

    changeInputWidth(p1NameInp);
    changeInputWidth(p1PronounsInp);
    changeInputWidth(p2NameInp);
    changeInputWidth(p2PronounsInp);
}

function clearPlayers() {
    //clear player texts
    p1PronounsInp.value = "";
    p1NameInp.value = "";
    p2PronounsInp.value = "";
    p2NameInp.value = "";
    changeInputWidth(p1PronounsInp);
    changeInputWidth(p1NameInp);
    changeInputWidth(p2PronounsInp);
    changeInputWidth(p2NameInp);

    //reset characters to random
    document.getElementById('p1CharSelector').setAttribute('src', charPath + '/CSS/Random.png');
    charP1 = "Random";
    skinP1 = "";
    charImgChange(charImgP1, charP1);
    document.getElementById('skinListP1').innerHTML = '';
    document.getElementById('skinListP1Sheik').innerHTML = '';
    document.getElementById('skinSelectorP1').style.opacity = 0;

    document.getElementById('p2CharSelector').setAttribute('src', charPath + '/CSS/Random.png');
    charP2 = "Random";
    skinP2 = "";
    charImgChange(charImgP2, charP2);
    document.getElementById('skinListP2').innerHTML = '';
    document.getElementById('skinListP2Sheik').innerHTML = '';
    document.getElementById('skinSelectorP2').style.opacity = 0;

    //clear player scores
    let checks = document.getElementsByClassName("scoreCheck");
    for (let i = 0; i < checks.length; i++) {
        checks[i].checked = false;
    }
}

function setScore(score, el) {
    el.value = score;
}


function forceWLtoggles() {
    const wlButtons = document.getElementsByClassName("wlButtons");

    if (forceWL.checked) {
        for (let i = 0; i < wlButtons.length; i++) {
            wlButtons[i].style.display = "inline";
        }
    } else {
        for (let i = 0; i < wlButtons.length; i++) {
            wlButtons[i].style.display = "none";
            deactivateWL();
        }
    }
}


//time to write it down
function writeScoreboard() {
    let scoreboardJson = {
        p1Name: p1NameInp.value,
        p1Pronouns: p1PronounsInp.value,
        p1Character: charP1,
        p1Skin: skinP1,
        p1Country: document.getElementById('p1Country').value,
        p1Score: checkScore(p1Score),
        p1WL: currentP1WL,
        p1Team: teamP1,
        p2Name: p2NameInp.value,
        p2Pronouns: p2PronounsInp.value,
        p2Character: charP2,
        p2Skin: skinP2,
        p2Country: document.getElementById('p2Country').value,
        p2Score: checkScore(p2Score),
        p2WL: currentP2WL,
        p2Team: teamP2,
        round: roundInp.value,
        bestOf: currentBestOf,
        isDoubles: isDoubles,
        tournamentName: document.getElementById('tournamentName').value,
        caster1Name: document.getElementById('cName1').value,
        caster1Twitter: document.getElementById('cTwitter1').value,
        caster1Pronouns: document.getElementById('cPronouns1').value,
        caster2Name: document.getElementById('cName2').value,
        caster2Twitter: document.getElementById('cTwitter2').value,
        caster2Pronouns: document.getElementById('cPronouns2').value,
        showDoubles: document.getElementById('showDoubles').checked
    };

    let data = JSON.stringify(scoreboardJson, null, 2);
    fs.writeFile(textPath + "/ScoreboardInfo.json", data, noop);

    const texts = {
        p1Name: p1NameInp.value,
        p2Name: p2NameInp.value,
        p1Pronouns: p1PronounsInp.value,
        p2Pronouns: p2PronounsInp.value,
        p1Country: document.getElementById('p1Country').value,
        p2Country: document.getElementById('p2Country').value,
        round: roundInp.value,
        tournamentName: document.getElementById('tournamentName').value,
        caster1Name: document.getElementById('cName1').value,
        caster1Twitter: document.getElementById('cTwitter1').value,
        caster1Pronouns: document.getElementById('cPronouns1').value,
        caster2Name: document.getElementById('cName2').value,
        caster2Twitter: document.getElementById('cTwitter2').value,
        caster2Pronouns: document.getElementById('cPronouns2').value,
        scoreP1: scoreP1.toString(),
        scoreP2: scoreP2.toString(),
        setHistory,
        currentBestOf
    }

    if (makeUppercase.checked || addSpace.checked) {
        for (let [key, value] of Object.entries(texts)) {
            value = makeUppercase.checked ? value.toUpperCase() : value;
            value = addSpace.checked ? value + " " : value;
            texts[key] = value;
        }
    }

    setDirectory(document.getElementById('slippiDirectory').value)


    //simple .txt files
    fs.writeFile(textPath + "/Simple Texts/Player 1.txt", texts.p1Name, noop);
    fs.writeFile(textPath + "/Simple Texts/Player 2.txt", texts.p2Name, noop);

    fs.writeFile(textPath + "/Simple Texts/Player 1 Pronouns.txt", texts.p1Pronouns, noop);
    fs.writeFile(textPath + "/Simple Texts/Player 2 Pronouns.txt", texts.p2Pronouns, noop);

    fs.writeFile(textPath + "/Simple Texts/Player 1 Country.txt", texts.p1Country, noop);
    fs.writeFile(textPath + "/Simple Texts/Player 2 Country.txt", texts.p2Country, noop);

    fs.writeFile(textPath + "/Simple Texts/Round.txt", texts.round, noop);
    fs.writeFile(textPath + "/Simple Texts/Tournament Name.txt", texts.tournamentName, noop);

    fs.writeFile(textPath + "/Simple Texts/BestOf.txt", texts.currentBestOf, noop);

    fs.writeFile(textPath + "/Simple Texts/Caster 1 Name.txt", texts.caster1Name, noop);
    fs.writeFile(textPath + "/Simple Texts/Caster 1 Twitter.txt", texts.caster1Twitter, noop);
    fs.writeFile(textPath + "/Simple Texts/Caster 1 Pronouns.txt", texts.caster1Pronouns, noop);

    fs.writeFile(textPath + "/Simple Texts/Caster 2 Name.txt", texts.caster2Name, noop);
    fs.writeFile(textPath + "/Simple Texts/Caster 2 Twitter.txt", texts.caster2Twitter, noop);
    fs.writeFile(textPath + "/Simple Texts/Caster 2 Pronouns.txt", texts.caster2Pronouns, noop);

    fs.writeFile(textPath + "/Simple Texts/Player 1 Score.txt", texts.scoreP1, noop);
    fs.writeFile(textPath + "/Simple Texts/Player 2 Score.txt", texts.scoreP2, noop);

    fs.copyFile(`${charPath}/Stock Icons/${charP1}/${skinP1}.png`, `${playerPath}/characterP1_icon.png`, () => {
        fs.utimesSync(`${playerPath}/characterP1_icon.png`, new Date(), new Date());
    });

    fs.copyFile(`${charPath}/Stock Icons/${charP2}/${skinP2}.png`, `${playerPath}/characterP2_icon.png`, () => {
        fs.utimesSync(`${playerPath}/characterP2_icon.png`, new Date(), new Date());
    });

    fs.copyFile(`${charPath}/Portraits/${charP1}/${skinP1}.png`, `${playerPath}/characterP1.png`, () => {
        fs.utimesSync(`${playerPath}/characterP1.png`, new Date(), new Date());
    });

    fs.copyFile(`${charPath}/Portraits/${charP2}/${skinP2}.png`, `${playerPath}/characterP2.png`, () => {
        fs.utimesSync(`${playerPath}/characterP2.png`, new Date(), new Date());
    });

    fs.copyFile(`${playerPath}/port${portP1}.png`, `${playerPath}/portP1.png`, () => {
        fs.utimesSync(`${playerPath}/portP1.png`, new Date(), new Date());
    });

    fs.copyFile(`${playerPath}/port${portP2}.png`, `${playerPath}/portP2.png`, () => {
        fs.utimesSync(`${playerPath}/portP2.png`, new Date(), new Date());
    });

    saveFieldValuesToStorage();
}

function updatePlayers(game) {
    handleSceneSwitch(sceneGameStartInp.value.split(','), sceneGameStartDelayInp.value.split(','));

    if (currentBestOf.toLowerCase() == "crews" && crewsNextRound != null) {
        roundInp.value = crewsNextRound;
        crewsNextRound = null;
    }

    if(game.players.length === 2) {
        isDoubles = false;
        document.querySelectorAll(".pDubsSwap").forEach((e) => {
            e.style.display = "none";
        })
        //singles
        player1Data = game.players[0];
        player2Data = game.players[1];
        document.getElementById("p1P1Tag").textContent = `Port 1 - ${game.data.settings.players[0].connectCode}`
        document.getElementById("p2P1Tag").textContent = `Port 2 - ${game.data.settings.players[1].connectCode}`
        teamP1 = 0;
        teamP2 = 0;

        updateColor(null, 1, player1Data.port);
        updateColor(null, 2, player2Data.port);
    } else {
        isDoubles = true;
        document.querySelectorAll(".pDubsSwap").forEach((e) => {
            e.style.display = "flex";
        })
        //doubles
        player1Data = game.players[0];
        teamP1 = game.data.settings.players[0].teamId;
        document.getElementById("p1P1Tag").textContent = `Port 1 - ${game.data.settings.players[0].connectCode}`
        //as a backup
        player2Data = game.players[1];
        teamP2 = game.data.settings.players[1].teamId;
        p2p2set = false;
        for(x = game.players.length-1; x >= 1; x--) {
            if(game.data.settings.players[x].teamId != teamP1) {
                player2Data = game.players[x];
                teamP2 = game.data.settings.players[x].teamId;
                if(p2p2set) {
                    document.getElementById("p2P2Tag").textContent = `Port ${x} - ${game.data.settings.players[x].connectCode}`
                } else {
                    document.getElementById("p2P2Tag").textContent = `Port ${x} - ${game.data.settings.players[x].connectCode}`
                    p2p2set = true;
                }

            } else {
                document.getElementById("p1P2Tag").textContent = `Port ${x} - ${game.data.settings.players[x].connectCode}`
            }
        }
        updateColor(null, 1, resolvePort(teamP1));
        updateColor(null, 2, resolvePort(teamP2));
    }

    if (portPrioSwapped) {
        [player1Data, player2Data] = [player2Data, player1Data];
    }

    charP1 = player1Data.characterName;
    skinP1 = player1Data.characterColor;
    portP1 = player1Data.port;

    charP2 = player2Data.characterName;
    skinP2 = player2Data.characterColor;
    portP2 = player2Data.port;

    charImgChange(charImgP1, player1Data.characterName, player1Data.characterColor);
    charImgChange(charImgP2, player2Data.characterName, player2Data.characterColor);

    if (!setStartTime || !setOfficiallyStarted) {
        setStartTime = new Date();
    }

    console.log("Updating players")

    writeScoreboard();
}

function resolvePort(id) {
    switch(id) {
        case 0:
            return 1;
        case 1:
            return 2;
        case 2:
            return 4;
        default:
            return 1;
    }
}

function updateScore(game) {
    setOfficiallyStarted = true;

    player1Data = game.players[0];
    player2Data = game.players[1];

    if (portPrioSwapped) {
        [player1Data, player2Data] = [player2Data, player1Data];
    }

    if (currentBestOf.toLowerCase() == "crews") {
        let stocksP1 = game.data.stats.stocks.filter(stock => stock.playerIndex == player1Data.port - 1 && stock.endFrame != null).length;
        let stocksP2 = game.data.stats.stocks.filter(stock => stock.playerIndex == player2Data.port - 1 && stock.endFrame != null).length;

        scoreP1 = parseInt(scoreP1) - stocksP1;
        if (crewsStocksPlayer == 1) {
            scoreP1 += crewsStocksLeft
        }
        p1Score.value = scoreP1;

        scoreP2 = parseInt(scoreP2) - stocksP2;
        if (crewsStocksPlayer == 2) {
            scoreP2 += crewsStocksLeft
        }
        p2Score.value = scoreP2;

        if (player1Data.gameResult == "winner") {
            crewsStocksPlayer = 1;
            crewsStocksLeft = stocksP1;
        } else if (player2Data.gameResult == "winner") {
            crewsStocksPlayer = 2;
            crewsStocksLeft = stocksP2;
        }

        const round = roundInp.value;

        if (round.toLowerCase().startsWith('game')) {
            try {
                crewsNextRound = "Game " + (parseInt(round.split(' ')[1]) + 1);
            } catch (e) {
                //ignore
            }
        }
    } else {
        try {
            if(game.data.winner[0].playerIndex === 0 ) {
                giveWinP1()
            } else {
                giveWinP2()
            }
        } catch (error) {
            console.error("Error determining winner")
            console.error(error)
        }

    }

    // Check if set has ended
    if (currentBestOf == "Best of 3") {
        if (scoreP1 >= 2 || scoreP2 >= 2) {
            onSetEnds()
        }
    } else if (currentBestOf == "Best of 5") {
        if (scoreP1 >= 3 || scoreP2 >= 3) {
            onSetEnds()
        }
    } else if (currentBestOf == "Crews") {
        if (scoreP1 <= 0 || scoreP2 <= 0) {
            onSetEnds()
        }
    }

    if (!setOfficiallyStarted) {
        // Set ended
        handleSceneSwitch(sceneSetEndInp.value.split(','), sceneSetEndDelayInp.value.split(','));
    } else {
        handleSceneSwitch(sceneGameEndInp.value.split(','), sceneGameEndDelayInp.value.split(','));
    }

    writeScoreboard();

}

function newSet(press) {
    setOfficiallyStarted = false;

    videoData = null

    if (press) {
        p1Score.value = 0;
        p2Score.value = 0;

        scoreP1 = p1Score.value;
        scoreP2 = p2Score.value;
    } else {
        setTimeout(() => {
            p1Score.value = 0;
            p2Score.value = 0;

            scoreP1 = p1Score.value;
            scoreP2 = p2Score.value;
        }, 5 * 1000);
    }
}

function onSetEnds() {
    newSet();
}

async function handleSceneSwitch(scenes, delays) {
    try {
        if (!obsConnected) {
            return;
        }

        if (!autoSwitchScenes.checked) {
            return;
        }

        if (sceneSwitchTimeout) {
            clearTimeout(sceneSwitchTimeout);
            sceneSwitchTimeout = null;
        }

        if (scenes.length == 0 || scenes[0] == '') {
            return;
        }

        const scene = scenes[0].trim();
        const delay = delays[0];

        if (delay == null || delay == '') {
            obs.call('SetCurrentProgramScene', { 'sceneName': scene })
            handleSceneSwitch(scenes.slice(1), delays.slice(1));
        } else {
            const delayFloat = parseFloat(delay);

            if (isNaN(delayFloat)) {
                obs.call('SetCurrentProgramScene', { 'sceneName': scene })
                handleSceneSwitch(scenes.slice(1), delays.slice(1));
                return;
            }

            sceneSwitchTimeout = setTimeout(() => {
                obs.call('SetCurrentProgramScene', { 'sceneName': scene })
                handleSceneSwitch(scenes.slice(1), delays.slice(1));
            }, delayFloat * 1000);
        }
    } catch (error) {
        console.error(`Error switching scenes: ${error.message}`);
        logError(`Error switching scenes: ${error.message}`);
    }
}

async function onAutoSceneSwitchCheck() {
    if (!obsConnected) {
        return;
    }
    document.getElementById("sceneGameStart").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneGameStartDelay").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneGameEnd").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneGameEndDelay").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneSetEnd").disabled = !autoSwitchScenes.checked;
    document.getElementById("sceneSetEndDelay").disabled = !autoSwitchScenes.checked;
}

async function connectToOBS() {
    if (obsPasswordInp.value == null || obsPasswordInp.value == '') {
        obs.connect(`ws://${obsURLInp.value || '127.0.0.01'}:${obsPortInp.value || '4455'}`);
    } else {
        obs.connect(`ws://${obsURLInp.value || '127.0.0.01'}:${obsPortInp.value || '4455'}`, obsPasswordInp.value);
    }
}

restoreFieldValuesFromStorage();

function loadStartGG() {
	tournamentSlug = document.getElementById("startGGSlug").value
	fetch('https://api.start.gg/gql/alpha', {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + apiKey,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
            query StreamQueueOnTournament($tourneySlug: String!) {
                tournament(slug: $tourneySlug) {
                    id
                    name
                    streamQueue {
                        stream {
                            streamSource
                            streamName
                        }
                        sets {
                            id
                            fullRoundText
                            slots {
                                entrant {
                                    name
                                    participants {
                                        gamerTag
                                        contactInfo {
                                            country
                                        }
                                        user {
                                            genderPronoun
                                        }
                                    }
                                }
                                standing{
                                    stats{
                                        score{
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
			`,
			variables: {
				tourneySlug: tournamentSlug
			},
		}),
	})
		.then((res) => res.json())
		.then((result) => {
            console.log(result)
            p1 = result.data.tournament.streamQueue[0].sets[0].slots[0].entrant;
            p2 = result.data.tournament.streamQueue[0].sets[0].slots[1].entrant;
            let p1suffix = ""
            let p2suffix = ""
            if(result.data.tournament.streamQueue[0].sets[0].fullRoundText == "Grand Final") {
                p2suffix = " (L)"
            } else if (result.data.tournament.streamQueue[0].sets[0].fullRoundText == "Grand Final Reset") {
                p1suffix = " (L)"
                p2suffix = " (L)"
            }
            if(p1.participants.length >= 2) {
                document.getElementById("p1Pronouns").value = ""
                document.getElementById("p2Pronouns").value = ""
                p1DubsSwapped = false
                p1P1Name = p1.participants[0].gamerTag
                p1P2Name = p1.participants[1].gamerTag
                document.getElementById("p1Name").value = `${p1P2Name} / ${p1P1Name}`
                p2DubsSwapped = false
                p2P1Name = p2.participants[0].gamerTag
                p2P2Name = p2.participants[1].gamerTag
                document.getElementById("p2Name").value = `${p2P2Name} / ${p2P1Name}`
            } else {
                document.getElementById("p1Name").value = p1.participants[0].gamerTag === "" ? p1.name + p1suffix : p1.participants[0].gamerTag + p1suffix;
                document.getElementById("p1Pronouns").value = p1.participants[0].user === null ? "" : p1.participants[0].user.genderPronoun;
                document.getElementById("p2Name").value = p2.participants[0].gamerTag === "" ? p2.name + p2suffix : p2.participants[0].gamerTag + p2suffix;
                document.getElementById("p2Pronouns").value = p2.participants[0].user === null ? "" : p2.participants[0].user.genderPronoun;
            }
            document.getElementById("p1Country").value = getCountry(p1.participants[0].contactInfo.country)
            document.getElementById("p2Country").value = getCountry(p2.participants[0].contactInfo.country)
            document.getElementById("p1Score").value = result.data.tournament.streamQueue[0].sets[0].slots[0].standing?.stats.score.value || 0;
            document.getElementById("p2Score").value = result.data.tournament.streamQueue[0].sets[0].slots[1].standing?.stats.score.value || 0;
            document.getElementById("tournamentName").value = result.data.tournament.name;
            document.getElementById("roundName").value = result.data.tournament.streamQueue[0].sets[0].fullRoundText;
		});
}

function getCountry(country) {
    if (!country) {
        console.log("Empty!")
        return("Earth")
    }
    console.log(country)
    switch(country) {
        case "Scotland":
        case "England":
        case "Wales":
        case "Ireland":
        case "Europe":
        case "Austria":
        case "Belgium":
        case "Switzerland":
        case "Germany":
        case "Denmark":
        case "Spain":
        case "Finland":
        case "France":
        case "Netherlands":
        case "Norway":
        case "Portugal":
        case "Sweden":
        case "Canada":
            return(country)
        case "United States":
             return("USA")
        case "United Kingdom":
            return("UK")
        case "Russia":
        case "Italy":
        case "Poland":
        case "Ukraine":
        case "Czechia":
        case "Czech Republic":
        case "Greece":
        case "Hungary":
        case "Belarus":
        case "Bulgaria":
        case "Serbia":
        case "Slovakia":
        case "Croatia":
        case "Bosnia and Herzegovina":
        case "Moldova":
        case "Lithuania":
        case "Albania":
        case "Slovenia":
        case "Latvia":
        case "North Macedonia":
        case "Estonia":
        case "Luxembourg":
        case "Montenegro":
        case "Malta":
        case "Iceland":
        case "Andorra":
        case "Liechtenstein":
        case "Monaco":
        case "San Marino":
            return("Europe")
        default:
            return("Earth")
    }
}

function swapDubs(id) {
    if(id === 1) {
        if(p1DubsSwapped) {
            document.getElementById("p1Name").value = `${p1P2Name} / ${p1P1Name}`
        } else {
            document.getElementById("p1Name").value = `${p1P1Name} / ${p1P2Name}`
        }
        p1DubsSwapped = !p1DubsSwapped
    } else {
        if(p2DubsSwapped) {
            document.getElementById("p2Name").value = `${p2P2Name} / ${p2P1Name}`
        } else {
            document.getElementById("p2Name").value = `${p2P1Name} / ${p2P2Name}`
        }
        p2DubsSwapped = !p2DubsSwapped
    }
}