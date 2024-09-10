![preview](doc/full_window.png)

# Melee Ghost Streamer

A fork of [Sheepolution's Melee Ghost Streamer](https://github.com/Sheepolution/Melee-Ghost-Streamer) which is a fork of [Readek's Melee Stream Tool](https://github.com/Readek/Melee-Stream-Tool) with updated features and reduced scope, designed for ease of use for streaming UKIE Netplay tournaments.

# ⚠️ LARGE DISCLAIMER ⚠️

This application uses Electron in an unsecure state. Both `nodeIntegration: true` and `contextIsolation: false` are set as they were set on the original fork and as of now I do not have time to fix them. This does open up this application to potential XSS attacks. However, the only external integration is with the start.gg API which as of now is secure. Please be wary of this when running this application, due to the limited scope of the project, I deem it acceptable for this use case, however it is absolutely not recommended nor good practice to code this way.

## New features
* Improved start.gg integration using GraphQL to load the next set from the stream queue. Set your [start.gg API key](https://start.gg/admin/profile/developer) in `resources/StartGG.json`
* Added basic support for doubles, ability to load both players names and swap the orientation.
* Keeps track of player ports and colours.
* Improved UI - stylised as the original Melee Stream tool, addition of 'Search for folder' for selecting directory for .slp files.
* The current version of the [Long Live Netplay](https://www.start.gg/LLN) overlay has also been included.
* Updated to latest versions of Electron, obs-websocket, etc.

## Future plans
* Serve html files using Express to allow for easier modification due to issues with CORS
* Fix nodeIntegration and contextIsolation issues for security

## Removed features
* Removed old start.gg integration using browser based automation as it is slow and unreliable.
* Removed a lot of the VOD/clip integrations due to lack of need for them for this product.
* Removed PGStats integration due to the end of Panda Global (rip)

## Features kept from Melee Ghost Streamer
* Automatically sets the characters, skin and ports based on the Slippi file.
* Automatically keeps track of score. Detects handwarmers. Crews mode for decreasing stocks.
* Automatically change the scene in OBS when a game starts, a game ends, or a set ends.
* Generates more text files and also images to use in OBS.

---

## Install

1. Download the latest [release](https://github.com/sheikchick/UKIE-Streamer/releases).
2. Unzip the files.
3. Set the required [start.gg API key](https://start.gg/admin/profile/developer) in `resources/StartGG.json`
4. Start `UKIE Streamer.exe`.

---

### Slippi replay folder

The directory where your Slippi files appear in. This is for automatic characters, port and score.

Example: `C:\Users\Sheep\Documents\Slippi\Spectate`

### OBS websocket

This is for automatic stream switching. Enter the information to connect with OBS websocket (In OBS go to Tools -> Websocket Server Settings). You probably only need to set the password, and only if you have enabled the password in OBS. 

### Players

* Auto name - Whether to automatically use the Slippi Netplay name as the name of the player.
* Lower port prio - By default the higher port priority is the first player. Enable this to swap it around.
* NEW - Starts a new set. Resets the score and internal data for cutting the VOD. Useful when switching from playing friendlies over to bracket.
* END - End a set. Use this in case the set is over but you missed a game or something.

### Next round

Enter info here on the next round. Click APPLY to move the fields over to the player section above. Enable auto to automatically apply the new info when the current set has ended.

### Scene switching

When you have connected to OBS you can enable automated stream switching. There are three groups of fields. One for starting a game, one for the end of a game, and one for the end of a set. In here you fill in the name of the scene OBS should switch to upon this event happening. Below you can enter a delay. You can add a sequence of scenes separated by a comma.

Example: After a set has ended I want to instantly go to the Player Cam scene. Then go to the Stats scene 8 seconds later. And then after another 15 seconds go to the replays.

```
Player Cam, Stats, Replays
0, 8, 15
```

You can always uncheck automated stream switching if you temporarily want to disable it.

### Settings

Click the hamburger menu in the bottom right to open the settings. Press escape or click somewhere on the left to go back.

* Allow intro - Plays an intro on [Game Scoreboard.html](html/Game%20Scoreboard.html) whenever the file loads.
* Forces the [W]/[L] buttons to appear on the interface. They will always appear when typing 'Grand' on the round box.
* Uppercase text - Makes all the text uppercase. Kinda useless actually when I realized OBS has an option for this.
* Add space - Adds a space to all text. In OBS text can be cut off with certain fonts. Adding a space is a dumb solution that works.


### Shortcuts
- Press `Enter` to update.
- Press either `F1` or `F2` to increase P1's or P2's score.
- Press `ESC` to clear player info.

---

## Disclaimer

Shoutouts to Readek for not only making the base of this tool, but creating a fancy looking interface as well. I myself was too lazy to keep it fancy, and focused only on functionality. It works, so mission accomplished, but because of that the UI is not great. It looks ugly, you don't get any confirmation when changing fields or clicking buttons, and the UI for changing the scenes is dumb. If you want to improve this your contributions are appreciated.

---

## Developing and building

If you want to make changes to the tool, you can do so by following these steps:

1. Download or clone this project.
2. Install [Node](https://nodejs.org/en) (use the left LTS option).
3. Open a terminal in the main directory (right click -> Open in Terminal).
4. Type `npm install --global yarn` to install Yarn.
5. Type `npm install -g electron` to install Electorn.
6. Type `npm install` to install the dependencies. This takes a while. You can ignore warnings.
7. Type `npm start` to start the app.

Most of the code is in [gui.js](app/src/gui.js).

You can use `npm run dist` to build a new executable.

---

## Cleo's message

This tool was solely designed for use with UKIE Netplay Tournaments. For a more fully fleged version of a Melee stream tool, I highly recommend you check out my [sm stream tool](https://github.com/sheikchick/sm_stream). This project originally started in 2019 for use at [One Stock Up 2019](https://www.start.gg/tournament/one-stock-up-2019/events), then was a large inspiration for my University honours project, and has since been developed further than I could've imagined.

## Sheepolution's original message

If you use this tool for your tournament/local I would love to know. It might motivate me to continue working on it, and who knows, maybe make a proper UI. For that, or for any questions, contact me on Twitter [@Sheepolution](https://twitter.com/Sheepolution).

## Readek's original message

Do you want to adapt [[the original tool](https://github.com/Readek/Melee-Stream-Tool)] to another game but can't figure out how to? Lucky for you, I'm open for commisions! Contact me on Twitter [@Readeku](https://twitter.com/Readeku) or on Discord `Readek#5869`!

---

Resources: [The spriters resource](https://www.spriters-resource.com/search/?q=melee), the [Melee HD Asset Library](https://assets.melee.tv/), and the [VS poses](https://smashboards.com/threads/download-available-poses-for-classic-mode-vs.435797/).