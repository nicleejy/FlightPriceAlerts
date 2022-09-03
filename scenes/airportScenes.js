const { Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");

const departureScene = new Scenes.WizardScene(
	"DepartureScene",
	(ctx) => {
		ctx.reply(
			"Which country will you be flying from?",
			Markup.keyboard([["❌ Cancel"]])
				.oneTime()
				.resize()
		);
		return ctx.wizard.next();
	},
	(ctx) => {
		// validation example
		const input = ctx.message.text;

		if (input == "❌ Cancel") {
			utils.cancelProcess(ctx);
			return ctx.scene.leave();
		}

		airportMarkup = utils.filterAirports(input);

		if (airportMarkup.length == 1) {
			ctx.reply("I was not able find any location, please try again.");
			return;
		} else {
			ctx.reply(
				"Which airport is it?",
				Markup.keyboard(airportMarkup).oneTime().resize()
			);
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		input = ctx.message.text;

		airportCodeArr = utils.searchByName(input);

		if (input == "❌ Cancel") {
			utils.cancelProcess(ctx);
			return ctx.scene.leave();
		}

		if (airportCodeArr.length >= 1) {
			console.log(airportCodeArr);
			utils.updateAirportSettings(true, airportCodeArr);

			ctx.reply(
				`Successfully updated departure airport to ${input}!`,
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
			"Which country will you be flying to?",
			Markup.keyboard([["❌ Cancel"]])
				.oneTime()
				.resize()
		);
		return ctx.wizard.next();
	},
	(ctx) => {
		// validation example
		const input = ctx.message.text;
		if (input == "❌ Cancel") {
			utils.cancelProcess(ctx);
			return ctx.scene.leave();
		}
		airportMarkup = utils.filterAirports(input);
		if (airportMarkup.length == 1) {
			ctx.reply("I was not able find any location, please try again.");
			return;
		} else {
			ctx.reply(
				"Which airport is it?",
				Markup.keyboard(airportMarkup).oneTime().resize()
			);
		}
		return ctx.wizard.next();
	},
	async (ctx) => {
		input = ctx.message.text;

		airportCodeArr = utils.searchByName(input);

		if (input == "❌ Cancel") {
			utils.cancelProcess(ctx);
			return ctx.scene.leave();
		}

		if (airportCodeArr.length >= 1) {
			utils.updateAirportSettings(false, airportCodeArr);

			ctx.reply(
				`Successfully updated arrival airport to ${input}!`,
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		}
		return;
	}
);

module.exports = {
	arrivalScene: arrivalScene,
	departureScene: departureScene,
};
