const networkClient = require("./network");
const utils = require("./utils");
const fs = require("fs");
const { Telegraf, Scenes, session, Markup } = require("telegraf");
require("dotenv").config({ path: ".env" });

const flights = networkClient.mockGetFlightData();
var airportsList = JSON.parse(fs.readFileSync("airports.json"));

const mainKeyboard = [["Price Summary", "Settings"]];
const settingsKeyboard = [
	["Departure Airport", "Arrival Airport"],
	["Departure Date", "Stopovers", "Duration"],
	["Cancel"],
];

// filter by max price and stopovers
function filterFlights(maxPrice, maxStopovers) {
	filtered = flights.filter(function (flight) {
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

bot.start(async (ctx) => {
	return await ctx.reply(
		"Hello!",
		Markup.keyboard(mainKeyboard).oneTime().resize()
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

bot.hears("Settings", async (ctx) => {
	utils.updateSetting("isSetting", true);
	return await ctx.reply(
		"Settings",
		Markup.keyboard(settingsKeyboard).oneTime().resize()
	);
});

const departureScene = new Scenes.WizardScene(
	"DepartureScene",
	(ctx) => {
		ctx.reply(
			"Type in a place",
			Markup.keyboard([["Cancel"]])
				.oneTime()
				.resize()
		);
		return ctx.wizard.next();
	},
	(ctx) => {
		// validation example
		input = ctx.message.text;

		if (input == "Cancel") {
			utils.updateSetting("isSetting", false);
			ctx.reply("okay", Markup.keyboard(mainKeyboard).oneTime().resize());
			return ctx.scene.leave();
		}

		filteredAirports = airportsList.filter(function (airport) {
			return airport.country.toLowerCase().includes(input.toLowerCase());
		});
		var airportMarkup = [["Cancel"]];

		for (var i = 0; i < filteredAirports.length; i++) {
			airportMarkup.push([filteredAirports[i].name]);
		}
		if (airportMarkup.length == 1) {
			ctx.reply("no airports found");
			return;
		} else {
			ctx.reply(
				"Select the airport",
				Markup.keyboard(airportMarkup).oneTime().resize()
			);
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		airportCodeList = airportsList.filter(function (airport) {
			return airport.name == ctx.message.text;
		});
		input = ctx.message.text;
		if (input == "Cancel") {
			utils.updateSetting("isSetting", false);
			return ctx.scene.leave();
		}

		if (airportCodeList.length >= 1) {
			console.log("sucvcess");
			console.log(airportCodeList);
			utils.updateSetting("isSetting", false);
			utils.updateSetting("from", airportCodeList[0].code);

			ctx.reply(
				"Thank you for your replies, well contact your soon",
				Markup.keyboard(mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		}
		return;
	}
);

const arrivalScene = new Scenes.WizardScene(
	"ArrivalScene",
	(ctx) => {
		ctx.reply(
			"Type in a place",
			Markup.keyboard([["Cancel"]])
				.oneTime()
				.resize()
		);
		return ctx.wizard.next();
	},
	(ctx) => {
		// validation example
		input = ctx.message.text;

		if (input == "Cancel") {
			utils.updateSetting("isSetting", false);
			ctx.reply("okay", Markup.keyboard(mainKeyboard).oneTime().resize());
			return ctx.scene.leave();
		}

		filteredAirports = airportsList.filter(function (airport) {
			return airport.country.toLowerCase().includes(input.toLowerCase());
		});
		var airportMarkup = [["Cancel"]];

		for (var i = 0; i < filteredAirports.length; i++) {
			airportMarkup.push([filteredAirports[i].name]);
		}
		if (airportMarkup.length == 1) {
			ctx.reply("no airports found");
			return;
		} else {
			ctx.reply(
				"Select the airport",
				Markup.keyboard(airportMarkup).oneTime().resize()
			);
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		airportCodeList = airportsList.filter(function (airport) {
			return airport.name == ctx.message.text;
		});
		input = ctx.message.text;
		if (input == "Cancel") {
			utils.updateSetting("isSetting", false);
			return ctx.scene.leave();
		}

		if (airportCodeList.length >= 1) {
			console.log("sucvcess");
			console.log(airportCodeList);
			utils.updateSetting("isSetting", false);
			utils.updateSetting("to", airportCodeList[0].code);

			ctx.reply("Updated", Markup.keyboard(mainKeyboard).oneTime().resize());
			return ctx.scene.leave();
		}
		return;
	}
);

const stage = new Scenes.Stage([departureScene, arrivalScene]);
bot.use(session());
bot.use(stage.middleware());

bot.hears("Departure Airport", (ctx) => {
	ctx.scene.enter("DepartureScene");
});

bot.hears("Arrival Airport", (ctx) => {
	ctx.scene.enter("ArrivalScene");
});

bot.hears("Cancel", (ctx) => {
	utils.updateSetting("isSetting", false);

	return ctx.reply("okay", Markup.keyboard(mainKeyboard).oneTime().resize());
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
