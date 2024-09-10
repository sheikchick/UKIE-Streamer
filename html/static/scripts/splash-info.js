window.onload = init;

var obs = new OBSWebSocket();

p1Name = ""
p2Name = ""
p1Twitter = ""
p2Twitter = ""

const twitterRegex = "/^[a-zA-Z0-9_]{1,15}$/"

function init() {
	async function mainLoop() {
		const info = await getGhostStreamerInfo();        //GhostStreamer (general)
		//const info = await getSMInfo();                   //sm-stream (cleo)
		//const info = await getPSInfo();                   //PhoenixSmash (shais)

		$("#info").text(`${info.player1.tag} ${info.player1.score} - ${info.player2.score} ${info.player2.tag}`);
		$("#round").text(`${info.round}`);
	}
	mainLoop();
	setInterval(() => { mainLoop(); }, 500); //update interval
	obsConnect();
}

function obsConnect() {
	obsUrl = "ws://127.0.0.1:4455";
	obsPassword = "mEqwqfQrpMYV2fEt"

	obs.connect(obsUrl, obsPassword)
	.then(() => {
		console.log("OBS connected")
		obs.call('GetSceneList')
		.then(function (value) {
			console.log(value)
		})
	})
}

obs.on('CurrentProgramSceneChanged', (event) => {
	if(event.sceneName === "Casters") {
		showInfo()
	}
})

function showInfo() {
	setTimeout(() => {
		$(".setdata").addClass("visible")
		$(`.setdata`).removeClass("hidden")
	}, 700)
	setTimeout(() => {
		$(".setdata").addClass("hidden")
		$(`.setdata`).removeClass("visible")
	}, 15000)
}