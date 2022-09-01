const fs = require("fs");
const appConstants = require("../constants/constants");
const { Markup } = require("telegraf");




function updateSetting(attr, value) {
	var settings = JSON.parse(fs.readFileSync("config.json"));

	if (attr == "departure") {
		settings.departure = value;
	} else if (attr == "arrival") {
		settings.arrival = value;
	} else if (attr == "stopovers") {
		settings.stopovers = value;
	} else if (attr == "from") {
		settings.from = value;
	} else if (attr == "isSetting") {
		settings.isSetting = value;
	} else if (attr == "duration") {
		settings.duration = value;
	} else if (attr == "budget") {
		settings.budget = value;
	} else {
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
	} else if (attr == "arrival") {
		return settings.arrival;
	} else if (attr == "stopovers") {
		return settings.stopovers;
	} else if (attr == "from") {
		return settings.from;
	} else if (attr == "isSetting") {
		return settings.isSetting;
	} else if (attr == "duration") {
		return settings.duration;
	} else if (attr == "budget") {
		return settings.budget;
	} else {
		return settings.to;
	}
}


function isAllowedSetting(context) {
	const userID = context.message.chat.id;
	if (getState("isSetting") === null) {
		updateSetting("isSetting", userID);
		return true;
	}
	return getState("isSetting") == userID
}


function cancelProcess(context) {
	updateSetting("isSetting", null);
	context.reply("okay", Markup.keyboard(appConstants.mainKeyboard).oneTime().resize());
}

function filterAirports(searchInput) {
	const filteredAirports = appConstants.airportsList.filter(function (airport) {
		return airport.country.toLowerCase().includes(searchInput.toLowerCase());
	});
	var airportMarkup = [["Cancel"]];

	for (var i = 0; i < filteredAirports.length; i++) {
		airportMarkup.push([filteredAirports[i].name]);
	}
	return airportMarkup

}

function getSpecificAirport(input) {
	const airportCodeList = appConstants.airportsList.filter(function (airport) {
		return airport.name == input;
	});
	return airportCodeList;
}

function updateAirportSettings(isDeparture, airportCodeList) {
	updateSetting("isSetting", null);
	updateSetting(isDeparture ? "from" : "to", airportCodeList[0].code);
}

function updateDateSettings(isDeparture, date) {
	const localDate = getDateString(date)
	updateSetting("isSetting", null);
	updateSetting(isDeparture ? "departure" : "arrival", localDate);
}

function isValidDate(input) {

    if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input))
        return false;

    var parts = input.split("/");
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);

    if (year < 1000 || year > 3000 || month == 0 || month > 12) {
		
		return false;
	}
        

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
		monthLength[1] = 29;
	}
        
    return day > 0 && day <= monthLength[month - 1];
};

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function parseDate(input) {

    var parts = input.split("/");
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);
	var date = new Date(year, month - 1, day);
    return date;
};



function getDateString(date) {
	const strDate = date.toLocaleString('en-CA', { timeZone: 'Asia/Singapore' });
	return strDate.split(",")[0].replaceAll("/", "-");
}


function updateDurationSettings(duration) {
	updateSetting("isSetting", null);
	updateSetting("duration", duration);
}

function updateStopoverSettings(num) {
	updateSetting("isSetting", null);
	updateSetting("stopovers", num);
}

function updateBudgetSettings(price) {
	updateSetting("isSetting", null);
	updateSetting("budget", price);
}



function formatDate(datetime) {
	function tConvert(time) {
		// Check correct time format and split into components
		time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
	
		if (time.length > 1) { // If time format correct
		time = time.slice (1);  // Remove full string match value
		time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
		time[0] = +time[0] % 12 || 12; // Adjust hours
		}
		return time.join(''); // return adjusted time or original string
	  }
	
	dateSplit = new Date(datetime).toString().split(" ");
	day = dateSplit[0];
	month = dateSplit[1];
	date = dateSplit[2];
	year = dateSplit[3];
	time = tConvert(dateSplit[4]);
	return `${day} ${date} ${month} ${year} at ${time}`
}




module.exports = { updateSetting, getState, isAllowedSetting, parseDate, getDateString, isValidDate, cancelProcess, filterAirports, getSpecificAirport, updateAirportSettings, updateDateSettings, updateDurationSettings, updateStopoverSettings, updateBudgetSettings, formatDate};
