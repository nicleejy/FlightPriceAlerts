const { Scenes, Markup } = require("telegraf");
const utils = require("../utilities/utils");
const appConstants = require("../constants/constants");

const paxScene = new Scenes.WizardScene(
	"PaxScene",
	(ctx) => {
		ctx.reply(
			"number of pax",
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
				ctx.reply("invalid number");
				return;
			}
			utils.updatePaxSettings(value);
			ctx.reply(
				"Thank you for your replies, well contact your soon",
				Markup.keyboard(appConstants.mainKeyboard).oneTime().resize()
			);
			return ctx.scene.leave();
		} else {
			ctx.reply("invalid number");
			return;
		}
	}
);

module.exports = {
	paxScene: paxScene,
};
