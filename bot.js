const { findSeries } = require("async");
const axios = require("axios");
const fs = require("fs");

require("dotenv").config({ path: ".env" });

const token = process.env.API_KEY;
const host = process.env.HOST;

async function getFlightData(origin, dest, pax, departureDate, returnDate) {
	console.log("getting flight data...");
	const options = {
		method: "GET",
		url: "https://skyscanner44.p.rapidapi.com/search-extended",
		params: {
			adults: pax.toString(),
			origin: `${origin}`,
			destination: `${dest}`,
			departureDate: `${departureDate}`,
			returnDate: `${returnDate}`,
			currency: "SGD",
			stops: "0,1,2",
			duration: "50",
			startFrom: "00:00",
			arriveTo: "23:59",
			returnStartFrom: "00:00",
			returnArriveTo: "23:59",
		},
		headers: {
			"X-RapidAPI-Key": token,
			"X-RapidAPI-Host": host,
		},
	};

	try {
		const response = await axios.request(options);
		// const jsonData = JSON.stringify(response.data, null, 2);
		// fs.writeFile("response.json", jsonData, function (writeError) {
		// 	if (writeError) {
		// 		console.log(writeError);
		// 	} else {
		// 		console.log("Success");
		// 	}
		// });
		const data = response.data;

		if (data.context.status != "complete") {
			console.log("Not complete, requerying!");
			setTimeout(getFlightData, 20000);
		}

		return data;
	} catch (error) {
		console.log(error.response);
	}
}

// getFlightData("SIN", "HBA", 3, "2022-12-10", "2022-12-20");

flight = {
	deeplink:
		"https://www.skyscanner.net/transport/flights/sin/hba/221211/221220/config/16292-2212110045--31876-1-12084-2212120905|12084-2212201035--31876-1-16292-2212210015?adults=1&adultsv2=1&cabinclass=economy&children=0&childrenv2=&destinationentityid=27542001&originentityid=27546111&inboundaltsenabled=false&infants=0&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1",
	pricing: [
		{ price: 800, agent: "GotoGate" },
		{ price: 400, agent: "My trip" },
	],

	to: {
		segments: 2,
		stopovers: ["Melbourne"],
		flights: [
			{
				airline: "Scoot",
				number: "TR435",
				from: "Singapore",
				to: "Melbourne",
				depart: "",
				arrive: "",
			},
			{
				airline: "Singapore Airlines",
				number: "SQ652",
				from: "Melbourne",
				to: "Hobart",
				depart: "",
				arrive: "",
			},
		],
	},

	from: {
		segments: 2,
		stopovers: ["Melbourne, Kuala Lumpur"],
		flights: [
			{
				airline: "Scoot",
				number: "TR435",
				from: "Singapore",
				to: "Melbourne",
				depart: "",
				arrive: "",
			},
			{
				airline: "Singapore Airlines",
				number: "SQ652",
				from: "Melbourne",
				to: "Hobart",
				depart: "",
				arrive: "",
			},
		],
	},
};

// Mimicks API call to save queries
function mockGetFlightData() {
	var data = JSON.parse(fs.readFileSync("response.json"));

	const results = data.itineraries.results;
	const allFlights = parseFlightData(results);

	const jsonData = JSON.stringify({ res: allFlights }, null, 2);
	fs.writeFile("cleaned.json", jsonData, function (writeError) {
		if (writeError) {
			console.log(writeError);
		} else {
			console.log("Success");
		}
	});

	console.log(allFlights);
}

// Main function intended to extract and reorganise the relevant flight information
function parseFlightData(itineraryResults) {
	var allFlights = [];

	for (var i = 0; i < itineraryResults.length; i++) {
		const legs = itineraryResults[i].legs;

		// if there is insufficient data for to and from

		if (legs.length < 2) {
			continue;
		}

		const toLeg = legs[0];
		const returnLeg = legs[1];
		const deeplink = itineraryResults[i].deeplink;
		const pricingDetails = itineraryResults[i].pricing_options;

		pricingArr = getPrices(pricingDetails);
		flightsArrTo = getFlightSegments(toLeg);
		flightsArrBack = getFlightSegments(returnLeg);

		allFlights.push({
			deeplink: deeplink,
			pricing: pricingArr,
			to: flightsArrTo,
			back: flightsArrBack,
		});
	}
	return allFlights;
}

// Organises the flight segements for any particular leg of the trip
// Eg on a flight from SG to NZ, a stopover at Canberra splits the leg into 2 segments
function getFlightSegments(leg) {
	const segmentDetails = leg.segments;
	const segmentCount = leg.segments.length;
	var flightsArray = [];

	for (var i = 0; i < segmentCount; i++) {
		segmentData = segmentDetails[i];
		airline = segmentData.marketingCarrier.name;
		callsign =
			segmentData.marketingCarrier.alternate_di + segmentData.flightNumber;
		from = `${segmentData.origin.name} ${segmentData.origin.type} (${segmentData.origin.flightPlaceId})`;
		to = `${segmentData.destination.name} ${segmentData.destination.type} (${segmentData.destination.flightPlaceId})`;
		departure = new Date(segmentData.departure);
		arrival = new Date(segmentData.arrival);

		flightsArray.push({
			airline: airline,
			number: callsign,
			from: from,
			to: to,
			depart: departure,
			arrive: arrival,
		});
	}
	return { segments: segmentCount, flights: flightsArray };
}

// Loops through specifically pricing options and extracts the agent and pricing data
function getPrices(pricingDetails) {
	var pricingArray = [];
	for (var i = 0; i < pricingDetails.length; i++) {
		let agent = "";
		pricingOption = pricingDetails[i];
		agentsList = pricingOption.agents;
		if (agentsList.length >= 1) {
			agent = agentsList[0].name;
		}
		price = pricingOption.price.amount;
		pricingArray.push({
			price: price,
			agent: agent,
		});
	}
	return pricingArray;
}

mockGetFlightData();
