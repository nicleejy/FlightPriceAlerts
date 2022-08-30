const fs = require("fs");

function updateSetting(attr, value) {
	var settings = JSON.parse(fs.readFileSync("config.json"));

	if (attr == "departure") {
		settings.departure = value;
	} else if (attr == "stopovers") {
		settings.stopovers = value;
	} else if (attr == "from") {
		settings.from = value;
	} else if (attr == "isSetting") {
		settings.isSetting = value;
	} else {
		console.log(value);
		settings.to = value;
	}

	fs.writeFileSync(
		"config.json",
		JSON.stringify(settings, null, 2),
		function (writeError) {
			if (writeError) {
				console.log(writeError);
			} else {
				console.log("Success");
			}
		}
	);
}

function getState(attr) {
	var settings = JSON.parse(fs.readFileSync("config.json"));
	if (attr == "departure") {
		return settings.departure;
	} else if (attr == "stopovers") {
		return settings.stopovers;
	} else if (attr == "from") {
		return settings.from;
	} else if (attr == "isSetting") {
		return settings.isSetting;
	} else {
		return settings.to;
	}
}

module.exports = { updateSetting, getState };
