// Copyright (c) 2019 Qingpeng Li. All rights reserved.
// Author: qingpeng9802@gmail.com (Qingpeng Li).

'use strict'

// Count the number of return from the API
var countResult = 0;
// Count the number of the Request sent
var countRequest = 0;

// The return result from API
// [duration_value, distance_value, index]
// [             0,              1,     2]
var returnResult = [];

/**
 * Get the duaration time and distance value of a specified index.
 * 
 * @param {json} response The response from Google Map API.
 * @param {number} index The index of correspding class.
 * @return {array} A element of `returnResult` (return for test only)
 */
let getDuaDis = function (response, index) {
  if (response.rows[0].elements[0].status === "NOT_FOUND") {
    console.log(" API returns NO result ! ");

    let resultArr = ["none", "none", index];
    returnResult.push(resultArr);
    countResult++;

    if (countResult === countRequest) {
      //Test
      //console.log(returnResult);

      // Send the API result back contentscript.js
      chrome.tabs.sendMessage(currentTabID, { "returnAPI": returnResult });
      //Test
      //console.log("API result has been sent back !!!");
    }

    return resultArr;

  } else {
    // Process the API return result
    /**
     *    e.g. Format:
     *
     *    {
     *    "status": "OK",
     *    "duration": {
     *      "value": 288834,
     *      "text": "3 jours 8 heures"
     *    },
     *    "distance": {
     *      "value": 1489604,
     *      "text": "1 490 km"
     *    }
     *
     */

    // Duration
    var duration = response.rows[0].elements[0].duration;
    var duration_value = duration.value; // unit: s
    var duration_text = duration.text; // reserve only
    // Distance
    var distance = response.rows[0].elements[0].distance;
    var distance_value = distance.value; // unit: m
    var distance_text = distance.text; // reserve only

    // Construct a element of `returnResult` 
    let resultArr = [duration_value, distance_value, index];
    // Add the element to `returnResult` 
    returnResult.push(resultArr);
    // Get 1 result
    countResult++;

    if (countResult === countRequest) {
      //Test
      //console.log(returnResult);

      // Send the API result back contentscript.js
      chrome.tabs.sendMessage(currentTabID, { "returnAPI": returnResult });
      //Test
      //console.log("API result has been sent back !!!");
    }

    return resultArr;
  }
}

var mapAPIKey = YOUR_API_KEY;

/**
 * Use XMLHttpRequest() to request json from Google Map API.
 * 
 * @param origin The origin of the address.
 * @param destionation The destionation of the address.
 */
let requestDistanceAPI = function (origin, destination, index) {
  let requestURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?' +
    'units=metric&mode=walking&' +
    'origins=' + origin.replace(/ /g, '+') + ",+Los+Angeles,+CA+90095" +
    '&destinations=' + destination.replace(/ /g, '+') + ",+Los+Angeles,+CA+90095" +
    '&key=' + mapAPIKey;
  let request = new XMLHttpRequest();

  request.open('GET', requestURL, true);
  // Open 1 request
  countRequest++;

  request.onreadystatechange = function (e) {
    if (request.readyState == 4) {
      if (request.status == 200) {
        let json = JSON.parse(request.response);
        //Test
        //console.log(json);
        let r = getDuaDis(json, index);
        //Test
        //console.log("return: " + r);
      }
    } else {
      ;
      //console.log('Unable to resolve address into lat/lng');
    }
  }
  request.send(null);
}

// The address array
// [origin, destination]
// [     0,           1]
var addrArr = [];

/**
 * Check if two addresses in the same building
 * @param oriaddr The origin.
 * @param desaddr The destionation.
 * @return if in the same building.
 */
let isSamebuilding = function (oriaddr, desaddr) {
  let oriaddrArr = oriaddr.split(' ');
  oriaddrArr.pop();
  let desaddrArr = desaddr.split(' ');
  desaddrArr.pop();
  if (oriaddrArr === desaddrArr) {
    return true;
  } else {
    return false;
  }
}

// Call API for every addresses pair
let callAPI = function () {
  addrArr.forEach(
    function (element, index) {
      // Precheck to reduce calling API
      if ((element[1] !== "none") &&
        !(isSamebuilding(element[0], element[1]))) {
        requestDistanceAPI(element[0], element[1], index);
      }
    });
}

// Store the tab ID of my.ucla.edu/ClassPlanner/*
var currentTabID;

chrome.runtime.onMessage.addListener(function (req, sender) {
  // Get the addresses pairs from contentscipt.js and call API
  if (req.address !== undefined) {
    addrArr = req.address;
    currentTabID = sender.tab.id;
    callAPI();
    return true;
  }
});
