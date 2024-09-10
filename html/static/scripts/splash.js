window.onload = init;
rotateSpeed = 8000;

p1Name = ""
p2Name = ""
p1Twitter = ""
p2Twitter = ""

const twitterRegex = "/^[a-zA-Z0-9_]{1,15}$/"

//used for syncing pronouns display
rotateState = false;

function init() {
	async function mainLoop() {
		const info = await getGhostStreamerInfo();        //GhostStreamer (general)
		//const info = await getSMInfo();                   //sm-stream (cleo)
		//const info = await getPSInfo();                   //PhoenixSmash (shais)

		updateInfo(info);
	}
	mainLoop();
	$(`#player1-tag`).remove("hidden")
	$(`#player2-tag`).addClass("hidden")
	setTimeout(() => {
		$(`#player1-pronouns`).removeClass("hidden")
		$(`#player2-pronouns`).removeClass("hidden")
		$(`#player1-pronouns`).addClass("visible")
		$(`#player2-pronouns`).addClass("visible")
		rotateElements();
	}, 700)
	setInterval(() => { mainLoop(); }, 500); //update interval
}

function updateInfo(info) {
    p1Name = info.caster1.tag;
    p2Name = info.caster2.tag;
	p1Twitter = "@" + (info.caster1.twitter.replace("@",""));
	p2Twitter = "@" + (info.caster2.twitter.replace("@",""));
	$("#player1-pronouns").text(info.caster1.pronouns);
	$("#player2-pronouns").text(info.caster2.pronouns);
	$("#round").text(info.round);
}

function rotateElements() {
	console.log("state:" + rotateState + " twitter:" + (p1Twitter !== ""))
	if(rotateState) {
		if(p1Twitter !== "@") {
			$(`#player1-tag`).css("font-size", "40px")
			$(`#player1-tag`).text(p1Twitter)
			$(`#player1-tag`).addClass("visible")
			$(`#player1-tag`).removeClass("hidden")
		}
		if(p2Twitter !== "@") {
			$(`#player2-tag`).css("font-size", "40px")
			$(`#player2-tag`).text(p2Twitter)
			$(`#player2-tag`).addClass("visible")
			$(`#player2-tag`).removeClass("hidden")
		}
	} else {
		$(`#player1-tag`).css("font-size", "40px")
		$(`#player1-tag`).text(p1Name)
		$(`#player1-tag`).addClass("visible")
		$(`#player1-tag`).removeClass("hidden")
		$(`#player2-tag`).css("font-size", "40px")
		$(`#player2-tag`).text(p2Name)
		$(`#player2-tag`).addClass("visible")
		$(`#player2-tag`).removeClass("hidden")
	}
	setTimeout(() => {
		if(p1Twitter !== "@") {
			$(`#player1-tag`).addClass("hidden")
			$(`#player1-tag`).removeClass("visible")
		}
		if(p2Twitter !== "@") {
			$(`#player2-tag`).addClass("hidden")
			$(`#player2-tag`).removeClass("visible")
		}
		rotateState = !rotateState;
	}, rotateSpeed-700)
	setTimeout(`rotateElements()`, rotateSpeed);
}