const networkClient = require("./network_clients/network");
const utils = require("./utilities/utils");
const fs = require("fs");
const { Telegraf, Scenes, session, Markup } = require("telegraf");
require("dotenv").config({ path: ".env" });
const dateScenes = require('./scenes/dateScenes');
const airportScenes = require('./scenes/airportScenes');
const appConstants = require("./constants/constants");
const durationScene = require("./scenes/durationScene");
const stopoverScene = require("./scenes/stopoverScene");


const flights = networkClient.mockGetFlightData();


// filter by max price and stopovers
function filterFlights(maxPrice, maxStopovers) {
	const filtered = flights.filter(function (flight) {
		return (
			flight.pricing[0].price <= maxPrice &&
			flight.to.stopovers.length <= maxStopovers &&
			flight.back.stopovers.length <= maxStopovers
		);
	});

	const jsonData = JSON.stringify({ res: filtered }, null, 2);
	fs.writeFile("filtered.json", jsonData, function (writeError) {
		if (writeError) {
			console.log(writeError);
		} else {
			console.log("Success");
		}
	});

	return filtered;
}

filterFlights(7000, 2);

const bot = new Telegraf(process.env.BOT_TOKEN);

// START COMMAND
bot.start(async (ctx) => {
	return await ctx.reply(
		"Hello!",
		Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
	);
});

var CronJob = require("cron").CronJob;
var job = new CronJob(
	"* */1 * * *",
	function () {
		console.log("");
	},
	null,
	false,
	"Asia/Singapore"
);
// Use this if the 4th param is default value(false)
// job.start();

// SETTINGS COMMAND
bot.hears("Settings", async (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		return await ctx.reply(
		"Settings",
		Markup.keyboard(appConstants.settingsKeyboard).oneTime().resize()
		);
	} else {
	return await ctx.reply(
		"Cannot amend settings right now",
		Markup.keyboard(appConstants.settingsKeyboard).oneTime().resize());
	}
});



const stage = new Scenes.Stage([
	airportScenes.departureScene, 
	airportScenes.arrivalScene, 
	dateScenes.departureDateScene, 
	dateScenes.arrivalDateScene,
	durationScene.durationScene,
	stopoverScene.stopoverScene
]);
bot.use(session());
bot.use(stage.middleware());


bot.hears("Departure Airport", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("DepartureScene");
	}
	
});

bot.hears("Arrival Airport", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("ArrivalScene");
	}
});

bot.hears("Departure Date", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("DepartureDateScene");
	}
});

bot.hears("Arrival Date", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("ArrivalDateScene");
	}
});

bot.hears("Duration", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("DurationScene");
	}
});

bot.hears("Stopovers", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("StopoverScene");
	}
});

bot.hears("Cancel", (ctx) => {
	utils.cancelProcess(ctx);
	
});


bot.hears("Price Summary", (ctx) => {
	main();
	
});

function main() {

	const stopovers = utils.getState("stopovers");
	const departureDateStr = utils.getState("departure");
	const arrivalDateStr = utils.getState("arrival");
	const tripLength = utils.getState("duration");
	const source = utils.getState("from");
	const destination = utils.getState("to");

	var departureDate = new Date(departureDateStr);
	var arrivalDate = departureDate.addDays(tripLength)

	console.log(departureDate.toLocaleDateString());
	console.log(arrivalDate.toLocaleDateString());

	





}


bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
