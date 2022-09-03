const fs = require("fs");

const mainKeyboard = [["🗒️ Trip Summary", "⚙️ Settings"], ["Check Prices"]];

const settingsKeyboard = [
	["🧍‍♂️ Number of Travellers"],
	["🛫 Departure Airport", "🛬 Arrival Airport"],
	["📆 Earliest Departure Date", "📆 Latest Arrival Date"],
	["⌛ Days", "🛑 Stopovers", "💰 Budget"],
	["❌ Cancel"],
];

const airportsList = JSON.parse(fs.readFileSync("./constants/airports.json"));

module.exports = {
	mainKeyboard: mainKeyboard,
	settingsKeyboard: settingsKeyboard,
	airportsList: airportsList,
};
