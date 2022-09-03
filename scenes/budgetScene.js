const { Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");

const budgetScene = new Scenes.WizardScene(
	"BudgetScene",
	(ctx) => {
		ctx.reply(
			"What is your maximum budget for this trip, including all travellers? (SGD)",
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
				ctx.reply("Please key in a valid budget!");
				return;
			}
			utils.updateBudgetSettings(value);
			ctx.reply(
				`Budget successfully updated to \$${value} SGD!`,
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
	budgetScene: budgetScene,
};
