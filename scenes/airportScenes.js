const {Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");


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
		const input = ctx.message.text;

		if (input == "Cancel") {
			utils.cancelProcess(ctx);
			return ctx.scene.leave();
		}

		airportMarkup = utils.filterAirports(input);

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
		input = ctx.message.text;
		
		airportCodeArr = utils.getSpecificAirport(input);

		if (input == "Cancel") {
			utils.cancelProcess(ctx);
			return ctx.scene.leave();
		}

		if (airportCodeArr.length >= 1) {
			console.log(airportCodeArr);
			utils.updateAirportSettings(true, airportCodeArr);

			ctx.reply(
				"Thank you for your replies, well contact your soon",
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
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
		const input = ctx.message.text;
		if (input == "Cancel") {
			utils.cancelProcess(ctx);
			return ctx.scene.leave();
		}
		airportMarkup = utils.filterAirports(input);
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
		input = ctx.message.text;
		
		airportCodeArr = utils.getSpecificAirport(input);

		if (input == "Cancel") {
			cancelProcess(ctx);
			return ctx.scene.leave();
		}

		if (airportCodeArr.length >= 1) {
	
			utils.updateAirportSettings(false, airportCodeArr);

			ctx.reply(
				"Thank you for your replies, well contact your soon",
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		}
		return;
	}
);

module.exports = {
    arrivalScene: arrivalScene,
    departureScene: departureScene
};