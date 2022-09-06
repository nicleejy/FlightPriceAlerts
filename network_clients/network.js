const axios = require("axios");
const fs = require("fs");
const utils = require("../utilities/utils");

require("dotenv").config({ path: ".env" });

const token = process.env.API_KEY;
const host = process.env.HOST;

async function queryUntilCompletion(
	origin,
	dest,
	pax,
	departureDate,
	returnDate
) {
	var flightData = [];

	try {
		var flightData = await getFlightData(
			origin,
			dest,
			pax,
			departureDate,
			returnDate
		);
	} catch (error) {
		console.log("An error has occurred");
		console.log(error);
		return false;
	}

	while (flightData.context.status != "complete") {
		console.log("Not complete, requerying!");
		await new Promise((resolve) => setTimeout(resolve, 60000));
		flightData = await getFlightData(
			origin,
			dest,
			pax,
			departureDate,
			returnDate
		);
	}

	console.log("completed query!");
	const results = flightData.itineraries.results;
	const allFlights = parseFlightData(results);

	utils.writeToFile(allFlights, "processed.json");

	return allFlights;
}

async function getFlightData(origin, dest, pax, departureDate, returnDate) {
	console.log("getting flight data...");

	if (!utils.hasCallsRemaining()) {
		throw new Error("Exceeded local max API quota");
	}

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

	const response = await axios.request(options);
	var data = response.data;

	if (data.error == true) {
		throw new Error("Invalid query");
	}
	return data;
}

// Mimicks API call to save queries
function mockGetFlightData() {
	var data = JSON.parse(fs.readFileSync("./constants/response.json"));

	const results = data.itineraries.results;
	const allFlights = parseFlightData(results);

	utils.writeToFile(allFlights, "cleaned.json");
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

// Organises the flight segments for any particular leg of the trip
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

module.exports = { mockGetFlightData, getFlightData, queryUntilCompletion };
