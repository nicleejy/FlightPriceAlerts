const { Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");

const durationScene = new Scenes.WizardScene(
	"DurationScene",
	(ctx) => {
		ctx.reply(
			"How many days long is your trip?",
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

		var regex = /^[0-9]+$/;

		if (input.match(regex)) {
			const value = parseInt(input);

			const oneDay = 24 * 60 * 60 * 1000;
			const from = new Date(utils.getState("departure"));
			const to = new Date(utils.getState("arrival"));

			const diffDays = Math.round(Math.abs((from - to) / oneDay));

			if (value <= 0 || diffDays < value) {
				ctx.reply(
					"Please key in a number of days safely within your specified travel window."
				);
				return;
			}
			utils.updateDurationSettings(value);
			ctx.reply(
				`Successfully updated trip length to ${value} days!`,
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
	durationScene: durationScene,
};
