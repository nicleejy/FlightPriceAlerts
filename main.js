const networkClient = require("./network_clients/network");
const utils = require("./utilities/utils");
const fs = require("fs");
const { Telegraf, Scenes, session, Markup } = require("telegraf");
require("dotenv").config({ path: ".env" });
const dateScenes = require("./scenes/dateScenes");
const airportScenes = require("./scenes/airportScenes");
const appConstants = require("./constants/constants");
const durationScene = require("./scenes/durationScene");
const stopoverScene = require("./scenes/stopoverScene");
const budgetScene = require("./scenes/budgetScene");
const paxScene = require("./scenes/paxScene");
const { get } = require("http");

// filter by max price and stopovers
function filterFlights(allFlights, maxPrice, maxStopovers) {
	const filtered = allFlights.filter(function (flight) {
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
	"* */2 * * *",
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
bot.hears("⚙️ Settings", async (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		return await ctx.reply(
			"Settings",
			Markup.keyboard(appConstants.settingsKeyboard).oneTime().resize()
		);
	} else {
		return await ctx.reply(
			"Cannot amend settings right now",
			Markup.keyboard(appConstants.settingsKeyboard).oneTime().resize()
		);
	}
});

// FOR TESTING
bot.hears("Test", async (ctx) => {
	main(ctx);
});

const stage = new Scenes.Stage([
	airportScenes.departureScene,
	airportScenes.arrivalScene,
	dateScenes.departureDateScene,
	dateScenes.arrivalDateScene,
	durationScene.durationScene,
	stopoverScene.stopoverScene,
	budgetScene.budgetScene,
	paxScene.paxScene,
]);
bot.use(session());
bot.use(stage.middleware());

bot.hears("🛫 Departure Airport", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("DepartureScene");
	}
});

bot.hears("🛬 Arrival Airport", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("ArrivalScene");
	}
});

bot.hears("📆 Departure Date", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("DepartureDateScene");
	}
});

bot.hears("📆 Arrival Date", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("ArrivalDateScene");
	}
});

bot.hears("⌛ Days", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("DurationScene");
	}
});

bot.hears("🛑 Stopovers", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("StopoverScene");
	}
});

bot.hears("💰 Budget", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("BudgetScene");
	}
});

bot.hears("🧍‍♂️ Number of Travellers", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("PaxScene");
	}
});

bot.hears("❌ Cancel", (ctx) => {
	utils.cancelProcess(ctx);
});

bot.hears("🗒️ Trip Summary", (ctx) => {
	getSummary(ctx);
	// main(ctx);
});

async function main(context) {
	const stopovers = utils.getState("stopovers");
	const departureDateStr = utils.getState("departure");
	const arrivalDateStr = utils.getState("arrival");
	const tripLength = utils.getState("duration");
	const budget = utils.getState("budget");
	const source = utils.getState("from");
	const destination = utils.getState("to");
	const pax = utils.getState("pax");

	// Represents the bounds of the users desired travel window
	var departureDate = new Date(departureDateStr);
	var arrivalDate = new Date(arrivalDateStr);

	// Represents the arrival date on which the trip ends after taking
	// into account some departure date + trip length
	var tempArrivalDate = departureDate.addDays(tripLength);

	var results = [];
	var allData = [];

	console.log("flight bounds");
	console.log(departureDate.toLocaleDateString());
	console.log(tempArrivalDate.toLocaleDateString());
	console.log(pax);

	while (tempArrivalDate <= arrivalDate) {
		console.log("Checking next travel window!");

		var allFlights = [];

		allFlights = await networkClient.queryUntilCompletion(source, destination, pax, utils.getDateString(departureDate), utils.getDateString(arrivalDate));

		if (allFlights == false) {
			context.telegram.sendMessage(context.message.chat.id, "An error occurred when attempting to retrieve data from SkyScannerAPI", {
				parse_mode: "Markdown",
			});
			return;
		}
		
		console.log(`${allFlights.length} flights found`);

		// pass date string in
		const filteredFlights = filterFlights(allFlights, budget, stopovers);
		console.log(`${filteredFlights.length} matching your budget`);
		results.push(...filteredFlights);
		allData.push(...allFlights);

		if (results.length >= 3) {
			console.log("Done querying early!");
			break;
		}

		departureDate = departureDate.addDays(1);
		tempArrivalDate = tempArrivalDate.addDays(1);
	}

	const avgPrice = utils.getAveragePrice(allData);

	var message = "";
	if (results.length > 0) {
		if (results.length == 1) {
			message = `Yay! I found ${results.length} flight under your budget!😄 Here are the top 3 results. The average price of your flights is currently around ${avgPrice}.`;
		} else {
			message = `Yay! I found ${results.length} flights under your budget!😄 Here are the top 3 results. The average price of your flights is currently around ${avgPrice}.`;
		}
	} else {

		if (avgPrice == 0) {
			message = "No flights found 😔";
		} else {
			message = `No flights found 😔 The average price of your flights is currently around ${avgPrice}.`;
		}
	}

	context.telegram.sendMessage(context.message.chat.id, message, {
		parse_mode: "Markdown",
	});

	if (results.length != 0) {
		setTimeout(() => sendIndivFlightMsgs(results, context), 2000);
	}
}

function displayFlightInformation(flightObj) {
	const firstLeg = flightObj.to;
	const secondLeg = flightObj.back;
	const segments1 = firstLeg.segments;
	const segments2 = secondLeg.segments;
	const stopovers1 = firstLeg.stopovers;
	const stopovers2 = secondLeg.stopovers;
	const flights1 = firstLeg.flights;
	const flights2 = secondLeg.flights;
	const pax = utils.getState("pax");

	const lowestPrice = flightObj.pricing[0];
	const agent = lowestPrice.agent;
	const price = Math.round(lowestPrice.price / pax);
	const rating = lowestPrice.rating;

	var mainHeader = `*✈️ Flight Information ✈️\n\n*Lowest Price: \$${price}/pax\nAgent: ${agent}\nRating: ${utils.getRatingStr(
		rating
	)}`;

	const source1 = flights1[0].from;
	const destination1 = flights1[segments1 - 1].to;

	const header1 = `🟢 *Outgoing Flight* 🟢\n\n${source1} to ${destination1} 🛫`;
	let stopoverDetails1 = "";

	if (stopovers1.length == 0) {
		stopoverDetails1 = "This is a direct flight! 🎉";
	} else if (stopovers1.length == 1) {
		stopoverDetails1 = "⏰ Stopover at ";
	} else {
		stopoverDetails1 = "⏰ Stopovers at ";
	}

	stopovers1.forEach((item, index) => {
		if (index === stopovers1.length - 2) {
			stopoverDetails1 += item + ", and ";
		} else if (index === stopovers1.length - 1) {
			stopoverDetails1 += item;
		} else {
			stopoverDetails1 += item + ", ";
		}
	});

	const firstLegText = `${header1}\n\n${stopoverDetails1}`;

	var flightSegments1 = "";

	for (i = 0; i < segments1; i++) {
		const flight1 = flights1[i];
		subHeader = `${flight1.from} to ${flight1.to}:`;
		airline = `✈️  *${flight1.airline} ${flight1.number}*`;
		departing = `${utils.formatDate(flight1.depart)}`;
		arriving = `${utils.formatDate(flight1.arrive)}`;

		flightSegments1 += `\n\n${subHeader}\n\n    ${airline}\n    🛫  *Departs ${departing}\n    🛬  Arrives ${arriving}*`;
	}

	firstLegMessage = `${firstLegText}\n\n*Details:*${flightSegments1}`;

	const source2 = flights2[0].from;
	const destination2 = flights2[segments2 - 1].to;

	const header2 = `🔴 *Incoming Flight* 🔴\n\n${destination2} to ${source2} 🛬`;

	let stopoverDetails2 = "";

	if (stopovers2.length == 0) {
		stopoverDetails2 = "This is a direct flight! 🎉";
	} else if (stopovers2.length == 1) {
		stopoverDetails2 = "⏰ Stopover at ";
	} else {
		stopoverDetails2 = "⏰ Stopovers at ";
	}

	stopovers2.forEach((item, index) => {
		if (index === stopovers2.length - 2) {
			stopoverDetails2 += item + ", and ";
		} else if (index === stopovers2.length - 1) {
			stopoverDetails2 += item;
		} else {
			stopoverDetails2 += item + ", ";
		}
	});

	const secondLegText = `${header2}\n\n${stopoverDetails2}`;

	var flightSegments2 = "";

	for (i = 0; i < segments2; i++) {
		const flight2 = flights2[i];
		subHeader = `${flight2.from} to ${flight2.to}:`;
		airline = `✈️  *${flight2.airline} ${flight2.number}*`;
		departing = `${utils.formatDate(flight2.depart)}`;
		arriving = `${utils.formatDate(flight2.arrive)}`;

		flightSegments2 += `\n\n${subHeader}\n\n    ${airline}\n    🛫  *Depart ${departing}\n    🛬  Arrive ${arriving}*`;
	}

	secondLegMessage = `${secondLegText}\n\n*Details:*${flightSegments2}`;

	footer = "⬇️ Click here to view more details ⬇️";

	return `${mainHeader}\n\n${firstLegMessage}\n\n\n\n${secondLegMessage}\n\n${footer}`;
}

function sendIndivFlightMsgs(results, context) {

	results.sort((flightA, flightB) =>
		flightA.pricing[0].price > flightB.pricing[0].price ? 1 : -1
	);

	var numResults = (results.length < 3 ? results.length : 3);

	for (var i = 0; i < numResults; i++) {
		const deeplink = results[i].deeplink;

		const options = {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Go to Skyscanner",
							url: deeplink,
						},
					],
				],
			},
			parse_mode: "Markdown",
		};

		context.telegram.sendMessage(
			context.message.chat.id,
			displayFlightInformation(results[i]),
			options
		);
	}
}

function getSummary(context) {
	const stopovers = utils.getState("stopovers");
	const departureDateStr = utils.getState("departure");
	const arrivalDateStr = utils.getState("arrival");
	const tripLength = utils.getState("duration");
	const budget = utils.getState("budget");
	const source = utils.getState("from");
	const destination = utils.getState("to");
	const pax = utils.getState("pax");

	summary = `*Trip Summary*\n\n✈️  *Trip:* ${source} - ${destination}\n\n🛫  *Date of departure:* ${utils.formatDate(
		departureDateStr
	)}\n\n🛬  *Date of arrival:* ${utils.formatDate(
		arrivalDateStr
	)}\n\n💸  *Budget:* \$${budget}\n\n🧍  *Number of travellers:* ${pax} persons\n\n⌛  *Trip Length:* ${tripLength} days\n\n🛑  *Maximum stopovers:* ${stopovers}`;

	context.telegram.sendMessage(context.message.chat.id, summary, {
		parse_mode: "Markdown",
	});
}

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
