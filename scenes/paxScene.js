const { Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");

const paxScene = new Scenes.WizardScene(
	"PaxScene",
	(ctx) => {
		ctx.reply(
			"How many travellers will there be?",
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
			if (value <= 0) {
				ctx.reply("Please key in at least 1 traveller!");
				return;
			}
			utils.updatePaxSettings(value);
			ctx.reply(
				`Successfully updated number of travellers to ${value}!`,
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
	paxScene: paxScene,
};
