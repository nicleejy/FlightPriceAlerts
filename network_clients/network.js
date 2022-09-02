const axios = require("axios");
const fs = require("fs");
const utils = require("../utilities/utils");

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
		const jsonData = JSON.stringify(response.data, null, 2);
		fs.writeFile("response.json", jsonData, function (writeError) {
			if (writeError) {
				console.log(writeError);
			} else {
				console.log("Success");
			}
		});
		const data = response.data;

		if (data.context.status != "complete") {
			console.log("Not complete, requerying!");
			setTimeout(getFlightData, 20000);
		} else {
			const results = data.itineraries.results;
			const allFlights = parseFlightData(results);
			return allFlights;
		}
	} catch (error) {
		console.log("error occured");
		console.log(error);
	}
}

// Mimicks API call to save queries
function mockGetFlightData() {
	var data = JSON.parse(fs.readFileSync("./constants/response.json"));

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
	return allFlights;
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

	return allFlights.sort((flightA, flightB) =>
		flightA.pricing[0].price > flightB.pricing[0].price ? 1 : -1
	);
}

// Organises the flight segements for any particular leg of the trip
// Eg on a flight from SG to NZ, a stopover at Canberra splits the leg into 2 segments
function getFlightSegments(leg) {
	const segmentDetails = leg.segments;
	const segmentCount = leg.segments.length;
	var flightsArray = [];
	var stopovers = [];

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

	if (segmentCount > 1) {
		for (var j = 0; j < segmentCount - 1; j++) {
			stopovers.push(flightsArray[j].to);
		}
	}
	return {
		segments: segmentCount,
		stopovers: stopovers,
		flights: flightsArray,
	};
}

// Loops through specifically pricing options and extracts the agent and pricing data
function getPrices(pricingDetails) {
	var pricingArray = [];
	for (var i = 0; i < pricingDetails.length; i++) {
		let agent = "";
		let rating = 0;
		pricingOption = pricingDetails[i];

		agentsList = pricingOption.agents;
		if (agentsList.length >= 1) {
			agent = agentsList[0].name;
			if (agentsList[0].hasOwnProperty("rating")) {
				rating = agentsList[0].rating;
			}
		}
		price = pricingOption.price.amount;

		if (price !== undefined) {
			pricingArray.push({
				price: price,
				agent: agent,
				rating: rating,
			});
		}
	}
	return pricingArray.sort((priceA, priceB) =>
		priceA.price > priceB.price ? 1 : -1
	);
}

async function recursiveCall(
	source,
	destination,
	pax,
	departureDate,
	tempArrivalDate
) {
	flights = await getFlightData(
		source,
		destination,
		pax,
		utils.getDateString(departureDate),
		utils.getDateString(tempArrivalDate)
	);
	return flights;
}

module.exports = { mockGetFlightData, getFlightData, recursiveCall };
