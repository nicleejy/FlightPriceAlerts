const { Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");

const arrivalDateScene = new Scenes.WizardScene(
	"ArrivalDateScene",
	(ctx) => {
		ctx.reply(
			"Type in a date in the right format",
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
			if (new Date(utils.getState("departure")) > date) {
				// if departure date is later than set date
				ctx.reply("This date should be later than the departure date");
				return;
			}
			utils.updateDateSettings(false, date);
			ctx.reply(
				"Thank you for your replies, well contact your soon",
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		} else {
			ctx.reply("invalid date");
			return;
		}
	}
);

const departureDateScene = new Scenes.WizardScene(
	"DepartureDateScene",
	(ctx) => {
		ctx.reply(
			"Type in a date in the right format",
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

			if (new Date(utils.getState("arrival")) < date) {
				// if arrival date is earlier than set date
				ctx.reply("This date should be earlier than the arrival date");
				return;
			}

			utils.updateDateSettings(true, date);
			ctx.reply(
				"Thank you for your replies, well contact your soon",
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		} else {
			ctx.reply("invalid date");
			return;
		}
	}
);

module.exports = {
	arrivalDateScene: arrivalDateScene,
	departureDateScene: departureDateScene,
};
