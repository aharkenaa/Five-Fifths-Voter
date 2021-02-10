/*
    Alaska Early Voting Location Web Scraper
    Authors:
        - Alex Harken <alexander.harken@aa.com>
        - Kennedy Stewart <kennedy.stewart@aa.com>

*/

const fetch = require('node-fetch');
const jsdom = require('jsdom');

const alaskaElectionsURL = 'https://www.elections.alaska.gov/Core/avolocationsg.php';

// Will fetch the alaskaElectionsURL and pass the data to processRawWebScrape
async function fetchRawElectionsData() {
    await fetch(alaskaElectionsURL)
        .then(res => res.text())
        .then(body => processRawWebScrape(body));
}

// Will create a dom using scraped website and programmatically process the site, looking for tr elements containing the text "Early Voting Location"
function processRawWebScrape(website) {
    const dom = new jsdom.JSDOM(website.trim());
    console.log(website.trim());
    console.log(dom.window.document.querySelector('tr').textContent);
}

fetchRawElectionsData().then(() => console.log('Complete!'));