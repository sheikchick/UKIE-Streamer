window.onload = init;
rotateSpeed = 5000;

p1Pronouns = ""
p2Pronouns = ""

isDoubles = false

//used for syncing pronouns display
rotateState = false;

function init() {
	async function mainLoop() {
		const info = await getGhostStreamerInfo();        //GhostStreamer (general)
		//const info = await getSMInfo();                   //sm-stream (cleo)
		//const info = await getPSInfo();                   //PhoenixSmash (shais)

		updateInfo(info);
        fitPlayerTags(40, 220, 55);
	}
	mainLoop();
	rotateElements();
	setInterval(() => { mainLoop(); }, 500); //update interval
}
/**
 * 
 * @param {*} info Expecting of the form shown below
 * {
		player1: {
			tag, {STRING}
			pronouns, {STRING}
			score, {INT}
			teamColour {STRING}(red, blue, green)
		},
		player2: {
			tag, {STRING}
			pronouns, {STRING}
			score, {INT}
			teamColour {STRING}(red, blue, green)
		},
		isDoubles, {BOOLEAN}
		bestOf, {INT}
		round {STRING}
	}
 */
function updateInfo(info) {
	isDoubles = info.isDoubles;
    $("#player1-tag").text(info.player1.tag);
    $("#player2-tag").text(info.player2.tag);
	p1Pronouns = info.player1.pronouns;
    p2Pronouns = info.player2.pronouns;
	$("#player1-flag").attr("src", `static/flags/${info.player1.country || "europe"}.png`);
	$("#player2-flag").attr("src", `static/flags/${info.player2.country || "europe"}.png`);
    $("#player1-score").text(info.player1.score);
    $("#player2-score").text(info.player2.score);
	$("#round").text(info.round);
	$("#bestof").text(info.bestOf);
	if(info.isDoubles) {
		fadeBetweenSrc(document.getElementById("p1bg"), document.getElementById("p1bf"), `static/img/background/left/${info.player1.teamColour}.png`)
		fadeBetweenSrc(document.getElementById("p2bg"), document.getElementById("p2bf"), `static/img/background/right/${info.player2.teamColour}.png`)
		$(".background.p1").css({"-webkit-transform":"translate(-180px,100px) scale(.8)"})
		$("#left-side").css({"-webkit-transform":"translate(-30px,28px) scale(.8)"})
		$(".background.p2").css({"-webkit-transform":"translate(180px,100px) scale(.8)"})
		$("#right-side").css({"-webkit-transform":"translate(30px,28px) scale(.8)"})
	} else {
		fadeBetweenSrc(document.getElementById("p1bg"), document.getElementById("p1bf"), `static/img/background/left/red.png`)
		fadeBetweenSrc(document.getElementById("p2bg"), document.getElementById("p2bf"), `static/img/background/right/blue.png`)
		$(".side").css("-webkit-transform", "scale(1)")
		$(".background").css("-webkit-transform", "scale(1)")
	}

}

function rotateElements() {
	if(rotateState) {
		if(p1Pronouns !== "") {
			$(`#player1-pronouns`).text(p1Pronouns)
			$(`#player1-pronouns`).addClass("visible")
			$(`#player1-pronouns`).removeClass("hidden")
		}
		if(p2Pronouns !== "") {
			$(`#player2-pronouns`).text(p2Pronouns)
			$(`#player2-pronouns`).addClass("visible")
			$(`#player2-pronouns`).removeClass("hidden")
		}
	} else {
		$(`#player1-pronouns`).text(isDoubles ? "Long Live Doubles" : "Long Live Netplay")
		$(`#player1-pronouns`).addClass("visible")
		$(`#player1-pronouns`).removeClass("hidden")
		$(`#player2-pronouns`).text(isDoubles ? "Last Monday every Month" : "Wednesdays at 7pm")
		$(`#player2-pronouns`).addClass("visible")
		$(`#player2-pronouns`).removeClass("hidden")
	}
	setTimeout(() => {
		if(p1Pronouns !== "") {
			$(`#player1-pronouns`).addClass("hidden")
			$(`#player1-pronouns`).removeClass("visible")
		}
		if(p2Pronouns !== "") {
			$(`#player2-pronouns`).addClass("hidden")
			$(`#player2-pronouns`).removeClass("visible")
		}
		rotateState = !rotateState;
	}, rotateSpeed-700)
	setTimeout(`rotateElements()`, rotateSpeed);
}