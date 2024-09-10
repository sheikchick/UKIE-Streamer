/**
 * Fade between two sources using a feeder image
 * @param {*} el1 Element to remain permanently visible
 * @param {*} el2 Element positioned on top to be faded in then hidden
 * @param {*} new_src Path to source file to fade to
 */
const fadeBetweenSrc = (el1, el2, new_src) => new Promise((resolve, reject) => {
	if($(el1).attr("src") !== new_src) {
		gsap.set(el2, { attr: { src: new_src } });
		gsap.to(el2, { opacity: 1})
		.then(() => {
			gsap.set(el1, { attr: { src: new_src } })
			gsap.set(el2, { opacity: 0 });
			resolve
		})
	} else {
		reject
	}
});

function swapText(element, new_text) {
	text = $(element).html()
	if (text !== new_text) {
		$(element).html(new_text);
	}
}

function swapSrc(element, new_src) {
	if ($(element).attr('src') !== new_src) {
		$(element).attr('src', new_src);
	}
}

function swapBG(element, new_src) {
	if ($(element).css('background-image') !== "url(" + new_src + ")") {
		$(element).css('background-image', "url(" + new_src + ")");
	}
}

function getName(name) {
	const lRegex = /\s*\(L\)$/;
	return ({ name: name.replace(lRegex, ''), l: lRegex.test(name) });
};

function fitPlayerTags(initialSize, maxWidth, maxHeight) {
	const nameTooBig = (el) => maxHeight === undefined ? el.clientWidth > maxWidth : (el.clientWidth > maxWidth || el.clientHeight > maxHeight);

    const players = [...document.getElementsByClassName('player-tag')];

    players.forEach(function (el) {
        size = initialSize;
		el.style.fontSize = `${initialSize}px`
		while (nameTooBig(el) && size > 0) {
            el.style.fontSize = `${size--}px`;
        }
    });

};

const scoresNumerical = (player, score, firstTo, l) => {
	const scoreEl = document.getElementById(`${player}-score`);
	scoreEl.textContent = score;

	const firstToEl = document.getElementById(`${player}-first-to`);
	if (firstToEl) {
		firstToEl.textContent = firstTo;
	}

	const lEl = document.getElementById(`${player}-l`);
	if (lEl) {
		lEl.className = (l ? 'l' : 'hidden');		//LOSER
	}
};

function scoresGraphical(player, score, firstTo, loser) {
	$(`#${player}-score`).attr("src", `${TALLY}\\${Math.min(score, 3)}.png`)
	if(loser) {
		$(`#${player}-l`).show()
	} else {
		$(`#${player}-l`).hide()
	}
};

const getDoublesPlayers = () => [...document.getElementsByClassName('doubles')];

function getStockIcon(character, side) {
	const EMPTY = 'empty';
	const LEFT = 'left';
	return `static/img/characters/${side || LEFT}/${character || EMPTY}.png`;
}

//YYYY-MM-DD
function getDate() {
	const date = new Date();
	return `${date.getFullYear()}-${String(1 + date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

//DD of MMMM, YYYY
function getLongDate() {
    var date = new Date()
    let day = date.getDate()
    return `${day}${getOrdinal(day)} of ${date.toLocaleString('en-GB', { month : 'long'})}, ${date.getFullYear()}`
}

function replaceWithBreak(element, stringToReplace) {
	var updatedText = element.innerHTML.replace(stringToReplace, '<br />');
	element.innerHTML = updatedText;
}

function getOrdinal(n) {
	let ord = 'th';
	if (n % 10 == 1 && n % 100 != 11) {
		ord = 'st';
	}
	else if (n % 10 == 2 && n % 100 != 12) {
		ord = 'nd';
	}
	else if (n % 10 == 3 && n % 100 != 13) {
		ord = 'rd';
	}
	return ord;
}

function getColour(x) {
	switch(x) {
		case 0:
			return "red"
		case 1:
			return "blue"
		case 2:
			return "green"
		default:
			return "red"
	}
}

/**
 * Get the information from the UKIE Ghost Streamer, and formats it
 * @returns formatted JSON output that can be handled by the overlay
 */
function getGhostStreamerInfo() {
	return new Promise(function (resolve) {
		const oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.open("GET", '../resources/Texts/ScoreboardInfo.json');
		oReq.send();

		//will trigger when file loads
		function reqListener() {
			let info = JSON.parse(oReq.responseText)
			let sendInfo = {
				"player1": {
					"tag": info.p1Name,
					"pronouns": info.p1Pronouns,
					"score": info.p1Score,
					"country": info.p1Country,
					"teamColour": getColour(info.p1Team),	//red, blue, green (GhostStreamer doesn't normalise colours, eg: Original Yoshi = original)
				},
				"player2": {
					"tag": info.p2Name,
					"pronouns": info.p2Pronouns,
					"score": info.p2Score,
					"country": info.p2Country,
					"teamColour": getColour(info.p2Team),	//red, blue, green
				},
				"caster1": {
					"tag": info.caster1Name,
					"pronouns": info.caster1Pronouns,
					"twitter": info.caster1Twitter
				},
				"caster2": {
					"tag": info.caster2Name,
					"pronouns": info.caster2Pronouns,
					"twitter": info.caster2Twitter
				},
				"isDoubles": info.isDoubles,
				"bestOf": info.bestOf,
				"round": info.round
			}
			resolve(sendInfo)
		}
	})
}

/**
 * Get the information from cleo/Glaikit's sm-stream tool, and formats it
 * @returns formatted JSON output that can be handled by the overlay
 */
function getSMInfo() {
	return new Promise(function (resolve) {
		const oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.open("GET", 'http://127.0.0.1:5000/info.json');
		oReq.send();

		//will trigger when file loads
		function reqListener() {
			let info = JSON.parse(oReq.responseText)
			let sendInfo = {
				"player1": {
					"tag": info.isDoubles ? `${info.team1.players[0].name} / ${info.team1.players[1].name}` : info.team1.players[0].name,
					"pronouns": info.isDoubles ? "" : info.team1.players[0].pronouns,
					"score": info.team1.score,
					"country": "United Kingdom",
					"teamColour": info.team1.players[0].colour,	//red, blue, green (we normalise colours, eg: Original Yoshi = green)
				},
				"player2": {
					"tag": info.isDoubles ? `${info.team2.players[0].name} / ${info.team2.players[1].name}` : info.team2.players[0].name,
					"pronouns": info.isDoubles ? "" : info.team2.players[0].pronouns,
					"score": info.team2.score,
					"country": "United Kingdom",
					"teamColour": info.team2.players[0].colour,	//red, blue, green (we normalise colours, eg: Original Yoshi = green)
				},
				"caster1": {
					"tag": info.casters[0].name,
					"pronouns": info.casters[0].pronouns,
					"twitter": ""
				},
				"caster2": {
					"tag": info.casters[1].name,
					"pronouns": info.casters[1].pronouns,
					"twitter": ""
				},
				"isDoubles": info.isDoubles,
				"bestOf": info.bestOf,
				"round": info.round
			}
			resolve(sendInfo)
		}
	})
}

/**
 * Get the information from Shais' PhoenixSmash tool, and formats it
 * @returns formatted JSON output that can be handled by the overlay
 */
function getPSInfo() {
	return new Promise(function (resolve) {
		const oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.open("GET", '');									//TODO
		oReq.send();

		//will trigger when file loads
		function reqListener() {
			let info = JSON.parse(oReq.responseText)
			let sendInfo = {									//TODO
				"player1": {
					"tag": "",
					"pronouns": "",
					"score": "",
					"country": "United Kingdom",
					"teamColour": "",	//red, blue, green
				},
				"player2": {
					"tag": "",
					"pronouns": "",
					"score": "",
					"country": "United Kingdom",
					"teamColour": "",	//red, blue, green
				},
				"caster1": {
					"tag": "",
					"pronouns": "",
					"twitter": ""
				},
				"caster2": {
					"tag": "",
					"pronouns": "",
					"twitter": ""
				},
				"isDoubles": "",
				"bestOf": "",
				"round": "",
			}
			resolve(sendInfo)
		}
	})
}