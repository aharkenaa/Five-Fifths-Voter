/*
    Alaska Early Voting Location Web Scraper
    Authors:
        - Alex Harken <alexander.harken@aa.com>
        - Kennedy Stewart <kennedy.stewart@aa.com>

*/
require('dotenv').config(); // For GOOGLE_MAPS_API_KEY env

const fetch = require('node-fetch');
const jsdom = require('jsdom');
const https = require('https');

const alaskaElectionsURL = 'https://www.elections.alaska.gov/Core/avolocationsg.php';

const agent = new https.Agent({
    rejectUnauthorized: false,
})

// Will fetch the alaskaElectionsURL and pass the data to processRawWebScrape
async function fetchRawElectionsData() {
    await fetch(alaskaElectionsURL, { agent })
        .then(res => res.text())
        .then(body => processRawWebScrape(body))
        .then(locationArr => processLocationArr(locationArr))
        .then(locationMap => saveVotingLocations(locationMap));
}

// Will create a dom using scraped website and programmatically process the site, looking for tr elements containing the text "Early Voting Location"
async function processRawWebScrape(website) {
    const dom = new jsdom.JSDOM(`<!DOCTYPE html>${website}`);
    const querySelectorResult = dom.window.document.querySelectorAll('tr');
    const querySelectorResultArray = Array.from(querySelectorResult);
    // Filter table rows with 3 entries
    const filteredSet = querySelectorResultArray.filter((element) => {
        if (element.cells.length === 3 && element.cells.item(0).innerHTML !== undefined && element.cells.item(0).innerHTML.includes('Early Vote Location')) {
            return true;
        }
        return false;
    })
    /*
        Remove the HTML tags, empty array entries, and new line characters.
        splitSet is a 2D array consisting of the following:
        [
            [
                'city', 'Location Description', 'Location Address'
            ]
        ]
    */
    const splitSet = filteredSet.map((element) => element.cells.item(0).innerHTML.split(/<[^>]*>|\n/).filter(element => (element.length > 0 && element !== 'Early Vote Location')));
    const earlyVoteLocations = [];
    for (let i = 0; i < splitSet.length; i += 1) {
        const currentArray = splitSet[i];
        const earlyVoteLocation = { 
            county: currentArray[0],
            location: currentArray[1],
            address: currentArray[2],
        };
        earlyVoteLocations.push(earlyVoteLocation);
    }
    return Promise.resolve(earlyVoteLocations);
}

async function processLocationArr(locationArr) {
    /* Expects an input array of the following structure:
        [{ city: string; location: string; address: string}]
    */
   const locationArrToProcess = Array.from(locationArr);
   const promiseArr = [];
   for (let i = 0; i < locationArr.length; i += 1) {
        const currentElement = locationArrToProcess[i];
        promiseArr.push(fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${currentElement.address}, ${currentElement.county}, AK&key=${process.env.GOOGLE_MAPS_API_KEY}`)
            .then(res => res.json())
            .then(body => ({location: locationArrToProcess[i], res: body })));
   }
   const locationMap = new Map();
   await Promise.all(promiseArr).then((addressList) => {
       for (let i = 0; i < addressList.length; i += 1) {
           const currentElement = addressList[i];
           const county = currentElement.res.results[0].address_components.find(element => element.types[0] === 'administrative_area_level_2').long_name.toUpperCase().replace(' ', '_');
           const key = `${currentElement.location.location.toUpperCase()} ${county} AK ${currentElement.res.results[0].address_components.find(element => element.types[0] === 'postal_code').long_name}`;
           if (locationMap.has(county)) {
                const currentEntry = locationMap.get(county);
                currentEntry[key] = {
                    location_name: `${currentElement.location.location.toUpperCase()}`,
                    original_address: `${currentElement.location.location.toUpperCase()} ${county}, AK ${currentElement.res.results[0].address_components[6].long_name}`,
                    location_type: currentElement.res.results[0].geometry.location_type,
                    formatted_address: currentElement.res.results[0].formatted_address,
                    lat: currentElement.res.results[0].geometry.location.lat,
                    lng: currentElement.res.results[0].geometry.location.lng,
                };
                locationMap.set(county, currentEntry);
           } else {
                const newEntry = {};
                newEntry[key] = {
                    location_name: `${currentElement.location.location.toUpperCase()}`,
                    original_address: `${currentElement.location.location.toUpperCase()} ${county}, AK ${currentElement.res.results[0].address_components[6].long_name}`,
                    location_type: currentElement.res.results[0].geometry.location_type,
                    formatted_address: currentElement.res.results[0].formatted_address,
                    lat: currentElement.res.results[0].geometry.location.lat,
                    lng: currentElement.res.results[0].geometry.location.lng,
                }
                locationMap.set(county, newEntry);
           };
       }
   });
   return locationMap;
}

async function saveVotingLocations(locationMap) {
    const fs = require('fs');
    const promiseArr = [];
    locationMap.forEach((value, key) => {
        promiseArr.push(fs.writeFile(`${__dirname}/knownLocations/${key}.json`, JSON.stringify(locationMap.get(key), null, '\t'), 'utf8', (err) => {
            if (err === null) {
                console.log(`${key}.json Created/Updated!`);
            } else {
                console.log(`Error Saving ${key}.json: `, err);
            }
        }));
    });
    await Promise.all(promiseArr);
}

fetchRawElectionsData()
    .then(() => console.log('Alaska Early Voting Scrape Complete!'))
    .catch((err) => console.log(`Error: ${err}`));