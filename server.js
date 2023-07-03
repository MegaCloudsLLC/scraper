/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const puppeteer = require('puppeteer');
const { URL } = require('url');
const axios = require('axios');
const cheerio = require('cheerio');
const GooglePlaces = require('googleplaces');
const apiKey = 'AIzaSyD4vTiPNqadXMtLUx9fMNYE50jlGmLmSl8';
const googlePlaces = new GooglePlaces(apiKey);
const PORT = 5000;
var mongoose = require('mongoose');
var { ObjectId } = mongoose.Types;

app.use(express.static(path.join(__dirname, '..', 'build'))); // Do this so that even while I'm using the nodejs server, I will be redirected to the react build folder
app.use(express.static('public')); // This line is for linking the static files like images/js/css to the server
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importing Database connection
require('./connection');

function dateNow() {
  const currentDate = new Date();

  // Format the day with leading zero if necessary
  const formattedDay = currentDate.getDate().toString().padStart(2, '0');

  // Array of month names
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Get the month name based on the month index
  const formattedMonth = monthNames[currentDate.getMonth()];

  // Get the year
  const formattedYear = currentDate.getFullYear();

  // Combine the formatted parts
  const formattedDate = `${formattedDay} ${formattedMonth}, ${formattedYear}`;

  return formattedDate;
}
// DEFINING THE FUNCTION FOR GETTING THE WEBSITE SUBDOMAIN FOR MY EMAIL MATCHING

function getSubDomainFromUrl(website) {
  var parsedUrl = new URL(website);
  var hostnameParts = parsedUrl.hostname.split('.');
  var subDomain = '';
  if (hostnameParts[0] == 'www') {
    subDomain = hostnameParts[1];
  } else {
    subDomain = hostnameParts[0];
  }

  return subDomain;
}

// FUNCTION TO CHECK IF THE STRING (subDomain) MATCHES ANY EMAIL FROM THE EMAIL ARRAY
function doesStringMatchEmail(emails, str) {
  var matchedEmailDomain = emails.find((email) => email.includes(str));
  return matchedEmailDomain || 'No Email Found';
}

async function emailFinder(website) {
  // NOW I PICK ONE OF THE DETAILS FOR MY USE
  var browser = await puppeteer.launch();
  var page = await browser.newPage();
  await page.goto(website);

  var subDomain = getSubDomainFromUrl(website);
  console.log(subDomain);

  var pageContent = await page.content();
  var email = extractEmailFromTextContent(pageContent);
  if (email) {
    console.log('Email:', email);
  }

  function extractEmailFromTextContent(textContent) {
    var emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    var matches = textContent.match(emailRegex);
    console.log(matches);
    if (Array.isArray(matches)) {
      const emailMatchString = doesStringMatchEmail(matches, subDomain);
      console.log(emailMatchString);
      return emailMatchString;
    } else {
      return matches && matches.length > 0 ? matches[0] : 'None Found';
    }
  }
  // APPROACH ONE
  // const emailElement = await page.$x('//span[contains(text(), "@")]');
  // if (emailElement.length > 0) {
  //   const email = await page.evaluate(element => element.textContent, emailElement[0]);
  //   console.log('Email:', email);
  // } else {
  //   console.log('Email element not found.');
  // }
  // APPROACH THREE
  // const pageContent = await page.content();
  // const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  // const emailMatches = pageContent.match(emailRegex);
  // if (emailMatches && emailMatches.length > 0) {
  //   const email = emailMatches[0];
  //   console.log('Email:', email);
  // } else {
  //   console.log('Email not found.');
  // }

  await browser.close();

  return email;
}

// FOR THE SINGLE SEARCH USING WEBSITE URL
app.post('/getWebsiteUrl', async (req, res) => {
  let website = req.body.websiteUrl;
  console.log(website);
  if (website != '') {
    const email = await emailFinder(website);
    res.send('Email: ' + email);
  }
});

// FOR THE LOCATION AND BUSINESS NAME SEARCH
app.post('/places', async (req, resp) => {
  const business = req.body.business;
  const userAddress = req.body.address;
  console.log(userAddress);
  const address = encodeURIComponent(userAddress);

  try {
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`,
    );
    const geocodeData = await geocodeResponse.json();
    const geometryData = geocodeData.results[0].geometry.location;
    console.log(geometryData);

    const { lat, lng } = geometryData;
    console.log('Latitude is: ' + lat);
    console.log('Longitude is: ' + lng);

    const config = {
      method: 'get',
      url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat}%2C${lng}&radius=500&type=&keyword=${business}&key=${apiKey}`,
      headers: {},
    };

    const placeResponse = await axios(config);
    const result = placeResponse.data.results;
    const x = result.length;
    console.log(x);

    if (x == 0) {
      console.log('Sending back null now!');
      resp.send('Nil');
    }

    returning = [];

    for (const place of result) {
      const placeId = place.place_id;

      async function getBusinessDetails() {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,rating,website&key=${apiKey}`;

        try {
          const res = await axios.get(url);
          const business = res.data.result;
          const name = business.name;
          const address = business.formatted_address;
          const rating = business.rating;
          const phoneNumber = business.formatted_phone_number;
          website = business.website; // HERE, EVERY DETAIL FROM A PLACE_ID IS RETURNED.
          console.log(website);

          // if ((website != undefined) && website.includes('https')) {
          //   email = await emailFinder(website);
          // } else if(website == undefined) {
          //   email = 'No Email';
          // }
          const returnee = { name, address, phoneNumber, website, rating };
          returning.push(returnee);

          if (returning.length == x) {
            console.log(returning);
            resp.send(returning);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }

      await getBusinessDetails(); // I called the function immediately after creating it.
    }
  } catch (e) {
    console.log(e);
  }
});

// Importing The Folders Model
var folderModel = require('./models/folders');

// FOR CREATING ANS SAVING A NEW FOLDER
app.post('/saveFolder', (req, res) => {
  var folder_name = req.body.folder_name;
  var folder_type = req.body.folder_type;
  var last_updated = dateNow();
  var saveFolder = folderModel({
    folder_name: folder_name,
    folder_type: folder_type,
    last_updated: last_updated,
  });
  saveFolder
    .save()
    .then((resp) => {
      console.log('Folder Successfullly saved.');
      res.send(resp.boby);
    })
    .catch((e) => {
      console.log(e);
    });
});

// Get Folder records
app.get('/getFolders', (req, res) => {
  folderModel.find().then((resp) => {
    res.send(resp);
  });
});

// Saving Records Into The Selected Folder
app.post('/saveResult', (req, res) => {
  var folderId = req.body.folderIdAndName.value;
  var folderName = req.body.folderIdAndName.label;
  var userId = 123;
  var records = req.body.result;
  var ln = records.length;
  var x = 0;
  folderModel
    .findOne({ _id: folderId })
    .then((model) => {
      if (!model) {
        console.log('Model not found');
        res.send('Internal Error');
      } else {
        for (var record of records) {
          var newRecord = {
            user_id: userId,
            business_name: record.name,
            business_address: record.address,
            website: record.website,
            rating: record.rating,
            phone: record.phoneNumber,
          };
          model.folder_records.push(newRecord);
          x++;
        }
        model
          .save()
          .then((resp) => {
            console.log(x);
            if (ln == x) {
              console.log('Record Successfully Saved Into ' + folderName);
              res.send(`Record Successfully Saved Into "${folderName}"`);
            }
          })
          .catch((e) => {
            console.log(e);
          });
      }
    })
    .catch((e) => {
      console.log(e);
    });
});

// This is For getting the number of records in each folder
app.get('/getFolderRecords/:id', (req, res) => {
  var folderId = new ObjectId(req.params.id);
  console.log(folderId);
  folderModel
    .findById({ _id: folderId })
    .then((response) => {
      records = response.folder_records;
      console.log(records);
      res.send(records);
    })
    .catch((e) => {
      console.log(e);
    });
});

// MY TESTED SCRAPER APP RIGHT HERE (WITH CHEERIO)

// app.post('/posting', (req, res) => {
//   var request = req.body.formData
//   console.log(request);
//   const searchValue = req.body.formData.email;

// // URL of the website you want to scrape
// const url = 'https://estateex.000webhostapp.com/blog-display.php?title=Konny';

// // Search value

// axios.get(url)
//   .then(response => {
//     if (response.status === 200) {
//       const html = response.data;
//       const $ = cheerio.load(html);

//       // Perform scraping operations using cheerio selectors
//       const matchedStrings = [];
//       // Find all text nodes on the page
//       $('body').find('*').contents().filter(function () {
//         return this.nodeType === 3;
//       }).each(function () {
//         const regex = /\t/;
//         const text = $(this).text().replace(regex, '');

//         // Check if the text matches the search value
//         if (text.toLowerCase().includes(searchValue.toLowerCase())) {
//           matchedStrings.push(text);
//         }
//       });

//       // Print the matched strings
//       console.log(matchedStrings);
//       return res.send(matchedStrings);
//     }
//   })
//   .catch(error => {
//     console.log(error);
//   });
// });

// OTHER PUPPETEER APPROACHES FOR SCRAPING EMAILS

// Approach 1:

// const emailElement = await page.$x('//span[contains(text(), "@")]');
// if (emailElement.length > 0) {
//   const email = await page.evaluate(element => element.textContent, emailElement[0]);
//   console.log('Email:', email);
// } else {
//   console.log('Email element not found.');
// }

// Approach 2:

// const pageContent = await page.content();
// const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
// const emailMatches = pageContent.match(emailRegex);
// if (emailMatches && emailMatches.length > 0) {
//   const email = emailMatches[0];
//   console.log('Email:', email);
// } else {
//   console.log('Email not found.');
// }

app.get('*', (req, res) => {
  // This is the file (build/index.html) that gets and displays the required file from the src folder
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server Listening at http://localhost:${PORT}`);
});

exports.app = functions.https.onRequest(app);
