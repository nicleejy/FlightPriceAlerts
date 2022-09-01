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
const budgetScene = require("./scenes/budgetScene");


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
	stopoverScene.stopoverScene,
	budgetScene.budgetScene
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

bot.hears("Set Duration", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("DurationScene");
	}
});

bot.hears("Set Stopovers", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("StopoverScene");
	}
});

bot.hears("Set Budget", (ctx) => {
	if (utils.isAllowedSetting(ctx)) {
		ctx.scene.enter("BudgetScene");
	}
});

bot.hears("Cancel", (ctx) => {
	utils.cancelProcess(ctx);
	
});


bot.hears("Price Summary", (ctx) => {
	main(ctx);
	
});

function main(context) {

	const stopovers = utils.getState("stopovers");
	const departureDateStr = utils.getState("departure");
	const arrivalDateStr = utils.getState("arrival");
	const tripLength = utils.getState("duration");
	const budget = utils.getState("budget");
	const source = utils.getState("from");
	const destination = utils.getState("to");

	// Represents the bounds of the users desired travel window
	var departureDate = new Date(departureDateStr);
	var arrivalDate = new Date(arrivalDateStr);

	// Represents the arrival date on which the trip ends after taking
	// into account some departure date + trip length
	var tempArrivalDate = departureDate.addDays(tripLength)

	var results = [];

	console.log("flight bounds");
	console.log(departureDate.toLocaleDateString());
	console.log(tempArrivalDate.toLocaleDateString());

	// while (tempArrivalDate <= arrivalDate) {
	// 	//searchFlights(stopovers, source, destination, departureDate, tempArrivalDate);
	// 	//pass date string in
	// 	const allFlights = networkClient.mockGetFlightData();
	// 	const filteredFlights = filterFlights(allFlights, budget, stopovers);
	// 	results.push(...filteredFlights);
	// 	departureDate = departureDate.addDays(1);
	// 	tempArrivalDate = tempArrivalDate.addDays(1);
	// }

	test1 = {
		"deeplink": "https://www.skyscanner.net/transport/flights/sin/hba/221210/221220/config/16292-2212100040--31757,-32166-1-12084-2212101815|12084-2212200855--32166,-31757-1-16292-2212201830?adults=3&adultsv2=3&cabinclass=economy&children=0&childrenv2=&destinationentityid=27542001&originentityid=27546111&inboundaltsenabled=false&infants=0&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1",
		"pricing": [
		  {
			"price": 5336,
			"agent": "Kiwi.com",
			"rating": 3.4
		  }
		],
		"to": {
		  "segments": 2,
		  "stopovers": [
			"Melbourne Tullamarine Airport (MEL)"
		  ],
		  "flights": [
			{
			  "airline": "Scoot",
			  "number": "TR18",
			  "from": "Singapore Changi Airport (SIN)",
			  "to": "Melbourne Tullamarine Airport (MEL)",
			  "depart": "2022-12-09T16:40:00.000Z",
			  "arrive": "2022-12-10T03:30:00.000Z"
			},
			{
			  "airline": "Jetstar",
			  "number": "JQ711",
			  "from": "Melbourne Tullamarine Airport (MEL)",
			  "to": "Hobart Airport (HBA)",
			  "depart": "2022-12-10T09:00:00.000Z",
			  "arrive": "2022-12-10T10:15:00.000Z"
			}
		  ]
		},
		"back": {
		  "segments": 2,
		  "stopovers": [
			"Melbourne Tullamarine Airport (MEL)"
		  ],
		  "flights": [
			{
			  "airline": "Jetstar",
			  "number": "JQ702",
			  "from": "Hobart Airport (HBA)",
			  "to": "Melbourne Tullamarine Airport (MEL)",
			  "depart": "2022-12-20T00:55:00.000Z",
			  "arrive": "2022-12-20T02:15:00.000Z"
			},
			{
			  "airline": "Scoot",
			  "number": "TR19",
			  "from": "Melbourne Tullamarine Airport (MEL)",
			  "to": "Singapore Changi Airport (SIN)",
			  "depart": "2022-12-20T05:35:00.000Z",
			  "arrive": "2022-12-20T10:30:00.000Z"
			}
		  ]
		}
	  };
	console.log("done");

	msg = displayFlightInformation(test1)

	context.telegram.sendMessage(
		context.message.chat.id, msg, { parse_mode: 'Markdown' });

}

function displayFlightInformation(flightObj) {

	const firstLeg = flightObj.to;
	const segments = firstLeg.segments;
	const stopovers = firstLeg.stopovers;
	const flights = firstLeg.flights;


	const source = flights[0].from;
	const destination = flights[segments - 1].to;

	const header1 = `🟢 *Outgoing:* ${source} to ${destination} 🛫`;
	let stopoverDetails = "";

	if (stopovers.length == 0) {
		stopoverDetails = "This is a direct flight! 🎉";
	} else if (stopovers.length == 1) {
		stopoverDetails = "⏰ Stopover at ";
	} else {
		stopoverDetails = "⏰ Stopovers at ";
	}

	stopovers.forEach((item, index) => {
		if (index === stopovers.length - 2) {
			stopoverDetails += item + ', and '
		} else if (index === stopovers.length - 1) {
			stopoverDetails += item
		} else {
			stopoverDetails += (item + ', ')
		}
	})
	
	const firstLegText = `${header1}\n\n${stopoverDetails}`;
	
	var flightSegments1 = "";

	for (i = 0; i < segments; i++) {
		const flight = flights[i];
		subHeader = `${flight.from} to ${flight.to}:`;
		airline = `✈️ *${flight.airline} ${flight.number}*`;
		departing = `${utils.formatDate(flight.depart)}`;
		arriving = `${utils.formatDate(flight.arrive)}`;

		flightSegments1 += (`\n\n${subHeader}\n\n    ${airline}\n    🛫 *Depart ${departing}\n    🛬 Arrive ${arriving}*`)
	}

	firstLegMessage = `${firstLegText}\n\n*Here are the details:*${flightSegments1}`;


	const header2 = `🔴 *Incoming:* ${destination} to ${source} 🛬`;

	const secondLegText = `${header2}\n\n${stopoverDetails}`;
	
	var flightSegments2 = "";

	for (i = 0; i < segments; i++) {
		const flight = flights[i];
		subHeader = `${flight.from} to ${flight.to}:`;
		airline = `✈️ *${flight.airline} ${flight.number}*`;
		departing = `${utils.formatDate(flight.depart)}`;
		arriving = `${utils.formatDate(flight.arrive)}`;

		flightSegments2 += (`\n\n${subHeader}\n\n    ${airline}\n    🛫 *Depart ${departing}\n    🛬 Arrive ${arriving}*`)
	}

	secondLegMessage = `${secondLegText}\n\n*Here are the details:*${flightSegments1}`;


	return firstLegMessage + "\n\n\n\n" + secondLegMessage;


}


bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
