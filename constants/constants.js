const fs = require("fs");

const mainKeyboard = [["🗒️ Trip Summary", "⚙️ Settings"], ["Test"]];

const settingsKeyboard = [
	["🧍‍♂️ Number of Travellers"],
	["🛫 Departure Airport", "🛬 Arrival Airport"],
	["📆 Departure Date", "📆 Arrival Date"],
	["⌛ Days", "🛑 Stopovers", "💰 Budget"],
	["❌ Cancel"],
];

const airportsList = JSON.parse(fs.readFileSync("./constants/airports.json"));

module.exports = {
	mainKeyboard: mainKeyboard,
	settingsKeyboard: settingsKeyboard,
	airportsList: airportsList,
};
