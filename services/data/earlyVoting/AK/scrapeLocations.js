/*
    Alaska Early Voting Location Web Scraper
    Authors:
        - Alex Harken <alexander.harken@aa.com>
        - Kennedy Stewart <kennedy.stewart@aa.com>

*/

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
        .then(body => processRawWebScrape(body));
}

// Will create a dom using scraped website and programmatically process the site, looking for tr elements containing the text "Early Voting Location"
async function processRawWebScrape(website) {
    const dom = new jsdom.JSDOM(`<!DOCTYPE html>${website}`);
    // await new Promise(resolve => setTimeout(resolve, 10000));
    // console.log(website.trim());
    const querySelectorResult = dom.window.document.querySelectorAll('tr');
    console.log(JSON.stringify(querySelectorResult.item(0)));
    const querySelectorResultArray = Array.from(querySelectorResult);
    // Filter table rows with 3 entries
    const filteredSet = querySelectorResultArray.filter((element) => {
        if (element.cells.length === 3 && element.cells.item(0).innerHTML !== undefined && element.cells.item(0).innerHTML.includes('Early Vote Location')) {
            console.log(element.cells.item(0).innerHTML);
            return true;
        }
        return false;
    })
    /*
        Remove the HTML tags, empty array entries, and new line characters.
        splitSet is a 2D array consisting of the following:
        [
            [
                'City', 'Location Description', 'Location Address'
            ]
        ]
    */
    const splitSet = filteredSet.map((element) => element.cells.item(0).innerHTML.split(/<[^>]*>|\n/).filter(element => (element.length > 0 && element !== 'Early Vote Location')));
    console.log(splitSet);
    const earlyVoteLocations = [];
    for (let i = 0; i < splitSet.length; i += 1) {
        const currentArray = splitSet[i];
        const earlyVoteLocation = { 
            city: currentArray[0],
            location: currentArray[1],
            address: currentArray[2],
        };
        earlyVoteLocations.push(earlyVoteLocation);
    }
    console.log(earlyVoteLocations);
}

fetchRawElectionsData()
    .then(() => console.log('Complete!'))
    .catch((err) => console.log(`Error: ${err}`));