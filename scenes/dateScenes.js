const { Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");

const arrivalDateScene = new Scenes.WizardScene(
	"ArrivalDateScene",
	(ctx) => {
		ctx.reply(
			"Which date is the latest you can return from the trip? (dd/mm/yyyy)",
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

		if (utils.isValidDate(input)) {
			const date = utils.parseDate(input);
			const today = new Date();
			const departureDate = new Date(utils.getState("departure"));
			today.setHours(0, 0, 0, 0);

			const diffDays = utils.getDaysDifference(departureDate, date);

			if (date < today) {
				ctx.reply("Do not set a date in the past.");
				return;
			} else if (diffDays < utils.getState("duration")) {
				ctx.reply("Trip length is too long to be within these dates.");
				return;
			}

			if (departureDate > date) {
				// if departure date is later than arrival date,
				// set departure date to one day before arrival
				utils.updateDateSettings(true, date.subtractDays(1));
			}
			utils.updateDateSettings(false, date);
			ctx.reply(
				`Latest arrival date successfully updated to ${input}!`,
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		} else {
			ctx.reply("Hmm, I was not able to understand this. Please try again.");
			return;
		}
	}
);

const departureDateScene = new Scenes.WizardScene(
	"DepartureDateScene",
	(ctx) => {
		ctx.reply(
			"Which date is the earliest you can leave for the trip? (dd/mm/yyyy)",
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

		if (utils.isValidDate(input)) {
			const date = utils.parseDate(input);

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const arrivalDate = new Date(utils.getState("arrival"));

			const diffDays = utils.getDaysDifference(date, arrivalDate);

			if (date < today) {
				ctx.reply("Do not set a date in the past.");
				return;
			} else if (diffDays < utils.getState("duration")) {
				ctx.reply("Trip length is too long to be within these dates.");
				return;
			}

			if (new Date(utils.getState("arrival")) < date) {
				// if arrival date is earlier than departure date
				// set arrival date to one after departure
				utils.updateDateSettings(false, date.addDays(1));
			}

			utils.updateDateSettings(true, date);
			ctx.reply(
				`Earliest departure date successfully updated to ${input}!`,
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		} else {
			ctx.reply("Hmm, I was not able to understand this. Please try again.");
			return;
		}
	}
);

module.exports = {
	arrivalDateScene: arrivalDateScene,
	departureDateScene: departureDateScene,
};
