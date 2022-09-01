const fs = require("fs");


const mainKeyboard = [["Price Summary", "Settings"]];

const settingsKeyboard = [
	["Departure Airport", "Arrival Airport"],
	["Departure Date", "Arrival Date"],
	["Duration",  "Stopovers"],
	["Cancel"],
];

const airportsList = JSON.parse(fs.readFileSync("./constants/airports.json"));


module.exports = {
    mainKeyboard: mainKeyboard,
    settingsKeyboard: settingsKeyboard,
    airportsList: airportsList
};