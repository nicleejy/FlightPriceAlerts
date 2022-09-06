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
const { filter } = require("async");

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
		"Hello Advocado Films! To check flight prices, use the Settings menu to input your trip details. When completed, simply click Check Prices to load flight information.",
		Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
	);
});

var CronJob = require("cron").CronJob;

var job = new CronJob(
	"* * */6 * *",
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
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		return await ctx.reply(
			"⚙️ Settings",
			Markup.keyboard(appConstants.settingsKeyboard).oneTime().resize()
		);
	} else {
		return await ctx.reply("Another process is ongoing, please wait! ⚠️");
	}
});

// FOR TESTING
bot.hears("Check Prices", async (ctx) => {
	if (!utils.getState("isBusy") && utils.getState("isSetting") === null) {
		utils.updateBusyState(true);
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"🔍 Searching for flights, this might take a while...",
			{
				parse_mode: "Markdown",
			}
		);
		main(ctx);
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
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
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("DepartureScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("🛬 Arrival Airport", (ctx) => {
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("ArrivalScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("📆 Earliest Departure Date", (ctx) => {
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("DepartureDateScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("📆 Latest Arrival Date", (ctx) => {
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("ArrivalDateScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("⌛ Days", (ctx) => {
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("DurationScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("🛑 Stopovers", (ctx) => {
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("StopoverScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("💰 Budget", (ctx) => {
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("BudgetScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("🧍‍♂️ Number of Travellers", (ctx) => {
	if (utils.isAllowedSetting(ctx) && !utils.getState("isBusy")) {
		ctx.scene.enter("PaxScene");
	} else {
		ctx.telegram.sendMessage(
			ctx.message.chat.id,
			"Job in progress, please wait! ⚠️",
			{
				parse_mode: "Markdown",
			}
		);
	}
});

bot.hears("❌ Cancel", (ctx) => {
	utils.cancelProcess(ctx);
});

bot.hears("🗒️ Trip Summary", (ctx) => {
	getSummary(ctx);
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

		const diffDays = utils.getDaysDifference(tempArrivalDate, arrivalDate);

		if (diffDays == 0) {
			context.telegram.sendMessage(
				context.message.chat.id,
				"Almost there... 🙂",
				{
					parse_mode: "Markdown",
				}
			);
		} else {
			context.telegram.sendMessage(
				context.message.chat.id,
				"Checking next travel window...",
				{
					parse_mode: "Markdown",
				}
			);
		}

		var allFlights = [];

		allFlights = await networkClient.queryUntilCompletion(
			source,
			destination,
			pax,
			utils.getDateString(departureDate),
			utils.getDateString(tempArrivalDate)
		);

		if (allFlights == false) {
			context.telegram.sendMessage(
				context.message.chat.id,
				"An error occurred when attempting to retrieve data from SkyScanner 😔",
				{
					parse_mode: "Markdown",
				}
			);
			utils.updateBusyState(false);
			return;
		}

		console.log(`${allFlights.length} flights found`);

		// pass date string in
		const filteredFlights = filterFlights(allFlights, budget, stopovers);
		console.log(`${filteredFlights.length} matching your budget`);

		context.telegram.sendMessage(
			context.message.chat.id,
			`Found ${
				allFlights.length == 0 ? "no" : allFlights.length
			} flights in total and ${
				filteredFlights.length == 0 ? "no" : filteredFlights.length
			} flight${
				filteredFlights.length == 0 || filteredFlights.length == 1 ? "" : "s"
			} matching your budget so far...`,
			{
				parse_mode: "Markdown",
			}
		);

		results.push(...filteredFlights);
		allData.push(...allFlights);

		if (results.length >= 3) {
			console.log("Done querying early");
			break;
		}

		departureDate = departureDate.addDays(1);
		tempArrivalDate = tempArrivalDate.addDays(1);
	}

	await new Promise((resolve) => setTimeout(resolve, 1000));

	const median = Math.round(utils.getMedianPrice(allData) / pax);
	const mininum = Math.round(utils.getLowestPrice(allData) / pax);

	// var message = "";
	// if (results.length > 0) {
	// 	if (results.length == 1) {
	// 		message = `Yay! I found ${results.length} flight under your budget! 😄\n\nThe median price of your flights is currently around \$${median} SGD per person. Note that I'll only display the top 3 results.`;
	// 	} else {
	// 		message = `Yay! I found ${results.length} flights under your budget! 😄\n\nThe median price of your flights is currently around \$${median} SGD per person. Note that I'll only display the top 3 results.`;
	// 	}
	// } else {
	// 	if (median == 0) {
	// 		message = "No flights found 😔";
	// 	} else {
	// 		message = `No flights found 😔\n\nThe median price of your flights is currently around \$${median} SGD per person. Perhaps you could try setting your budget higher?`;
	// 	}
	// }

	var message = "";
	if (results.length > 0) {
		if (results.length == 1) {
			message = `Yay! I found ${results.length} flight under your budget! 😄\n\nThe median price of your flights is currently around \$${median} SGD per person. Note that I'll only display the top 3 results.`;
		} else {
			message = `Yay! I found ${results.length} flights under your budget! 😄\n\nThe median price of your flights is currently around \$${median} SGD per person. Note that I'll only display the top 3 results.`;
		}
	} else {
		if (allData.length == 0) {
			message = "No flights found 😔";
		} else {
			message = `No flights found 😔\n\nThe minimum price of your flights is currently around \$${mininum} SGD per person. You could try setting your budget higher, or increase the number of stopovers requested.`;
		}
	}

	context.telegram.sendMessage(context.message.chat.id, message, {
		parse_mode: "Markdown",
	});

	if (results.length != 0) {
		setTimeout(() => sendIndivFlightMsgs(results, context), 2000);
	}
	utils.updateBusyState(false);
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
		stopoverDetails1 = `⏰ 1 stopover at `;
	} else {
		stopoverDetails1 = `⏰ ${stopovers1.length} stopovers at `;
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

	const header2 = `🔴 *Incoming Flight* 🔴\n\n${source2} to ${destination2} 🛬`;

	let stopoverDetails2 = "";

	if (stopovers2.length == 0) {
		stopoverDetails2 = "This is a direct flight! 🎉";
	} else if (stopovers2.length == 1) {
		stopoverDetails2 = `⏰ 1 stopover at `;
	} else {
		stopoverDetails2 = `⏰ ${stopovers2.length} stopovers at `;
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

	var numResults = results.length < 3 ? results.length : 3;

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

	const sourceName = utils.searchByCode(source)[0].name;
	destName = utils.searchByCode(destination)[0].name;

	const departureDateString = utils
		.formatDate(departureDateStr)
		.split(" ")
		.slice(0, 4)
		.join(" ");

	const arrivalDateString = utils
		.formatDate(arrivalDateStr)
		.split(" ")
		.slice(0, 4)
		.join(" ");

	summary = `*Here's your Trip Summary!*\n\n✈️  *Trip:*\n\n${sourceName} to ${destName}\n\n🛫  *Date of departure:*\n\n${departureDateString}\n\n🛬  *Date of arrival:*\n\n${arrivalDateString}\n\n💸  *Budget:* \$${budget} SGD\n\n*Number of travellers:*\n\n${pax} person${
		pax == 1 ? "" : "s"
	}\n\n⌛  *Trip Length:* ${tripLength} day${
		tripLength == 1 ? "" : "s"
	}\n\n🛑  *Maximum stopovers:* ${stopovers}`;

	context.telegram.sendMessage(context.message.chat.id, summary, {
		parse_mode: "Markdown",
	});
}

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
