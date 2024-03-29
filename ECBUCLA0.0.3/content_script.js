// Copyright (c) 2019 Qingpeng Li. All rights reserved.
// Author: qingpeng9802@gmail.com (Qingpeng Li).

'use strict'

// Reserve for understanding only
// The Class that stores the infomation of a class.
class ClassInfo {
  constructor(number, classtype, location, id, startTime, endTime, weekday, nextClassInd,
    gapTime, walkTime, walkTistance, hurry) {
    /**
    * @param {string} number The class number. eg. COM SCI 188
    * @param {string} classtype The class type. eg. Lec 1
    * @param {string} location The location of the class. eg. Boelter Hall 3400
    * @param {string} id The ID of the class. eg. 186799200
    * @param {string} startTime The start time of the class. eg. 2pm
    * @param {string} endTime The end time of the class. eg. 3:50pm
    * @param {string} weekday The weekday of the class. eg. W
    * @param {number} nextClassInd The index of the next class in the box. eg. 4
    * @param {number} gapTime The gap time between current class and next class with unit: min . eg. 10
    * @param {number} walkTime The walking time with unit: s . eg. 132
    * @param {number} walkTistance The walking time with distance: m . eg. 245
    * @param {number} hurry If (gapTime - walkTime) <= threshold eg. 1
    * 
    */
    this.number = '';
    this.classtype = '';
    this.location = '';
    this.id = '';
    this.startTime = '';
    this.endTime = '';
    this.weekday = '';
    this.nextClassInd = -1;
    this.gapTime = 0;
    this.walkTime = 0;
    this.walkTistance = 0;
    this.hurry = 0;
  }

  toString() {
    return ("number: " + this.number + '\n' +
      "classtype: " + this.classtype + '\n' +
      "location: " + this.location + '\n' +
      "startTime: " + this.startTime + '\n' +
      "endTime: " + this.endTime + '\n' +
      "weekday: " + this.weekday + '\n' +
      "nextClassInd: " + this.nextClassInd + '\n' +
      "gapTime: " + this.gapTime + '\n' +
      "walkTime: " + this.walkTime + '\n' +
      "walkTistance: " + this.walkTistance + '\n' +
      "warning: " + this.warning + '\n');
  }

  printClassInfo() {
    console.log(this.toString);
  }
}

// The classes in box
// [number, classtype, location, id, startTime, endTime, weekday, nextClassInd, gapTime,  walkTime, walkTistance, hurry]
// [     0,         1,        2,  3,         4,       5,       6,            7,       8,         9,           10,    11]
var boxClasses = [];

// Extract the class info from timebox
let extractBoxClasses = function () {
  $("div.planneritembox").each(
    function () {
      //Test
      //console.log(this.innerHTML);
      // Replace <br to \n, and delete <> tags
      let arrclass = this.innerHTML.replace(/<br/gi, '\n<').replace(/<(.|\n)*?>/gi, '').split('\n');
      let trimedArr = arrclass.map(str => str.trim());
      //Test
      //console.log(trimedArr);
      boxClasses.push(trimedArr);
    }
  );
}

// The classes in plan with ID and time
// [number, classtype, id, startTime, endTime]
// [     0,         1,  2,         3,       4]
var planClasses = []

// Extract the class info from plan
let extractPlanClasses = function () {
  $('td.section-header a').each(
    function () {
      let aClassInfoArr = []

      // Extract 1st part of the class number
      let startInd1 = $(this).attr('href').indexOf('='); // 67
      let endInd1 = $(this).attr('href').indexOf('&'); // 75
      let numPart1 = $(this).attr('href').slice(startInd1 + 1, endInd1).replace(/\+/g, ' ').trim();

      // Extract 2nd part of the class number
      let startInd2 = $(this).attr('href').indexOf('=', endInd1); // 88
      let endInd2 = $(this).attr('href').indexOf('&', startInd2); // 97

      // Process the class number with 'M'
      let helpStr = function (str) {
        if (str[str.length - 1] === 'M') {
          str = str.slice(0, -2).trim();
          str = 'M' + str;
        }
        return str;
      }

      let numPart2 = $(this).attr('href').slice(startInd2 + 1, endInd2).replace(/\+/g, ' ').trim().slice(1);
      numPart2 = helpStr(numPart2);

      // push number
      aClassInfoArr.push(numPart1 + ' ' + numPart2);
      // push classtype
      aClassInfoArr.push(this.innerText);
      // push id
      aClassInfoArr.push($(this).attr('title').split(' ').pop());

      let classTime = $(this).parent().nextAll("td[class='centerColumn']").next().text().split('-');
      // push startTime
      aClassInfoArr.push(classTime[0]);
      // push endTime
      aClassInfoArr.push(classTime[1]);
      //Test
      //console.log(tempArr);
      planClasses.push(aClassInfoArr);
    }
  );
}

// Map the IDs to `BoxClasses`
let mapID2BoxClasses = function () {
  extractBoxClasses();
  extractPlanClasses();
  for (var cl of boxClasses) {
    for (var ci of planClasses) {
      if (cl[0] === ci[0] && cl[1] === ci[1]) {
        // push id, startTime, endTime to classesPlan
        cl.push(ci[2], ci[3], ci[4]);
        //Test
        //console.log(cl);
      }
    }
  }
}
// Finish preprocess `BoxClasses` #1
// [number, classtype, location, id, startTime, endTime]
// [     0,         1,        2,  3,         4,       5]
mapID2BoxClasses();

/**
 * Convert time string to minutes.
 * @param timeStr A time string 
 * @return The minutes from day start
 */
let time2Min = function (timeStr) {
  // TimeStrArr [HH, MM]
  let timeStrArr = timeStr.slice(0, -2).split(':');

  // Test valid time string input
  if (timeStrArr[1] === undefined) {
    timeStrArr.push("00");
  }
  if (parseInt(timeStrArr[0]) > 12 || parseInt(timeStrArr[0]) < 0 ||
    parseInt(timeStrArr[1]) > 60 || parseInt(timeStrArr[1]) < 0) {
    console.log("****** Time String Format ERROR ******");
    return;
  }

  // Minutes from day start
  let min = 0;

  // pm
  if (timeStr.slice(-2) === 'pm') {
    min = 12 * 60 + 60 * parseInt(timeStrArr[0]) +
      parseInt(timeStrArr[1]);
    if (timeStrArr[0] === "12") {
      min = 12 * 60 + parseInt(timeStrArr[1]);
    }
    // am
  } else if (timeStr.slice(-2) === 'am') {
    min = 60 * parseInt(timeStrArr[0]) +
      parseInt(timeStrArr[1]);
    if (timeStrArr[0] === "12") {
      min = parseInt(timeStrArr[1]);
    }
    // error
  } else {
    console.log("****** Time String Format ERROR ******");
    return;
  }
  return min;
}

/**
 * Calculate the time difference between startTime and endTime
 * @param startTime The strat time.
 * @param endTime The end time.
 * @return The minute difference between `startTime` and `endTime`
 */
let minDiff = function (startTime, endTime) {
  let result = time2Min(endTime) - time2Min(startTime);
  if (result > 1440) {
    console.log("****** Time Diff ERROR ******");
    return;
  }
  return result;
}

/**
 * Return a week day char by a index.
 * @param number The index of class in `$("div.planneritembox")`
 * @return The char represented a week day.
 */
let assignWeekday = function (number) {
  switch (number) {
    case 0:
      return "M";
    case 1:
      return "T";
    case 2:
      return "W";
    case 3:
      return "R";
    case 4:
      return "F";
    default:
      return "none";
  }
}

// The array of address pairs passed as message to background.js
let addressPairArr = [];

/**
* Calculate the time difference of current class and next class
* and push the `weekday` to boxClasses
* and push the `nextClassInd` to `boxClasses`
* and push the `gapTime` to `boxClasses`
*/
let calMinDiffOfBoxClasses = function () {
  // The index of the classes in the box
  let index = 0;

  // The weekdays
  let colnum = $('div.timebox').length;

  for (let i = 0; i < colnum; i++) {
    // The number of classes of a day
    let rownum = $($('div.timebox')[i]).children().length;

    for (let j = 0; j < rownum; j++) {
      let nextclassInd = index + 1;

      if (j === rownum - 1) {
        // Last class of the day
        boxClasses[index].push(assignWeekday(i));
        boxClasses[index].push("none");

        // push default value (will NOT get result from API)
        boxClasses[index].push(1000, 0, 0);
        addressPairArr.push([boxClasses[index][2], "none"]);
      } else {
        // If there is tier class, update the nextclassInd
        while (minDiff(boxClasses[index][5], boxClasses[nextclassInd][4]) <= 0) {
          nextclassInd++;
          // Prevent from length overflow
          if (nextclassInd === boxClasses.length) {
            break;
          }
        }

        let diff = minDiff(boxClasses[index][5], boxClasses[nextclassInd][4]);

        //Test
        //console.log(diff);
        boxClasses[index].push(assignWeekday(i));
        boxClasses[index].push(nextclassInd);
        boxClasses[index].push(diff);

        // Construct a addressPairArr
        addressPairArr.push([boxClasses[index][2], boxClasses[nextclassInd][2]]);
      }
      index++;
    }
  }

}
// Finish preprocess `BoxClasses` #2
// [number, classtype, location, id, startTime, endTime, weekday, nextClassInd, gapTime]
// [     0,         1,        2,  3,         4,       5        6,            7,       8]
calMinDiffOfBoxClasses();

//Test
//console.log(boxClasses);
//console.log(planClasses);
//console.log(addressPairArr);

// Send addressPairArr to background.js
let requestDistance = function () {
  // Test if the address pairs are extract correctly
  if (addressPairArr.length !== boxClasses.length) {
    console.log("****** ERROR: addressPairArr.length != boxClasses.length ******");
    return;
  }

  // Send `addressPairArr` to background.js
  chrome.runtime.sendMessage({
    'address': addressPairArr
  }, function () {
    console.log("Message has been sent successfully !!!");
  });
}
requestDistance();

// ******************* Before Calling API Preprocessing End ***************

// ******************* After Calling API Preprocessing Start **************

//Test calling short#1
/*
var returnResult = [
  [0, 0, 1],
  [0, 0, 10],
  [7, 10, 0],
  [7, 10, 9],
  [132, 169, 2],
  [132, 169, 12],
  [391, 552, 25],
  [268, 355, 23],
  [212, 221, 11],
  [212, 221, 5],
  [212, 221, 15],
  [294, 365, 6],
  [294, 365, 16],
  [203, 229, 4],
  [203, 229, 14],
  [315, 384, 7],
  [315, 384, 17],
  [214, 260, 21],
  [298, 374, 20],
  [482, 686, 22],
  [0, 0, 19],
  [635, 874, 24]];
*/

let m2mile = function (meter) {
  return (meter / 1609.344).toFixed(2);
}

let s2min = function (s) {
  return (s / 60).toFixed(2);
}

let min2s = function (min) {
  return (min * 60);
}

// Append the result (`walkTime`, `walkTistance`) from API to `boxClasses`
let appendResult = function () {
  returnResult.forEach(function (element) {
    let ind = element[2];
    boxClasses[ind].push(element[0], element[1]);
  });
}

// Residual time (`gapTime` - `walkTime`) of tolerance
// TODO: add a adjustment bar on the extension button
var threshold = 2; // unit: min

// Append `hurry` flag to `boxClasses`
let appendHurryFlag = function () {
  boxClasses.forEach(function (element) {
    if ((min2s(element[8]) - element[9]) <= threshold * 60) {
      element.push(1);
    } else {
      element.push(0);
    }
  });
}

/**
 * Construct a ButtonPopup node.
 * @param classArr current class info array
 * @param nextclassArr next class info array
 * @param str which string need to display
 * @return a node of info string
 */
let constructButtonPopupNode = function (classArr, nextclassArr, str) {
  let infostr = str + nextclassArr[0] + ' ' + nextclassArr[1] + ' ' + nextclassArr[6] + '<br>' +
    'BreakTime: ' + classArr[8] + 'min<br>WalkTime: ' + s2min(classArr[9]) +
    'min<br>ResTime: ' + (s2min(min2s(classArr[8]) - classArr[9])) +
    'min (' + (min2s(classArr[8]) - classArr[9]) + 's)<br>' +
    'Distance: ' + m2mile(classArr[10]) + 'miles (' + classArr[10] + 'm)<br>';

  let $infoline = $('<em class=tabhurry></em>').html(infostr);

  return $infoline;
}

let showResult = function () {
  // Listen `hover()` and change `<em></em>` display attr
  $(document).ready(function () {
    $(".hurry").hover(function () {
      $(this).parent().find("em").attr('style', 'display: block !important');
    }, function () {
      $(this).parent().find("em").attr('style', 'display: none !important');
    });
  });

  for (let i = 0; i < boxClasses.length; i++) {
    if (boxClasses[i][11] === 1) {
      // Search corresponding hurry class in planClasses
      var oriHurryID = boxClasses[i][3];
      var nextind = boxClasses[i][7];
      var desHurryID = boxClasses[nextind][3];

      for (let j = 0; j < planClasses.length; j++) {
        // Origin class is hurry
        if (planClasses[j][2] === oriHurryID) {
          let oriModifyNodeInd = j;
          let $locationBox = $($("td[class='centerColumn']")[oriModifyNodeInd]).next().next();

          // Create the container of ButtonPopup
          let $BPNode = $('<div></div>');
          $BPNode.attr({ class: "infotab" });
          $locationBox.append($BPNode);

          // Insert the color Button INTO a new <div> node (container)
          // to keep the relative position of the other nodes
          let theWeekday = boxClasses[i][6];
          let $button = $('<a></a>').html('\nOri ' + theWeekday);
          $button.attr({ class: "hurry", href: "javascript:;" });
          $BPNode.append($button);

          // Insert the class info after the Button
          let $oriInsertNode = constructButtonPopupNode(boxClasses[i], boxClasses[nextind], 'Next: ');
          $BPNode.append($oriInsertNode);

          continue;
        }
        // Destination class is hurry
        if (planClasses[j][2] === desHurryID) {
          let desModifyNodeInd = j;
          let $locationBox = $($("td[class='centerColumn']")[desModifyNodeInd]).next().next();

          let $BPNode = $('<div></div>');
          $BPNode.attr({ class: "infotab" });
          $locationBox.append($BPNode);

          let theWeekday = boxClasses[i][6];
          let $button = $('<a></a>').html('\nDest ' + theWeekday);
          $button.attr({ class: "hurry", href: "javascript:;" });
          $BPNode.append($button);

          let $desInsertNode = constructButtonPopupNode(boxClasses[i], boxClasses[i], 'Prev: ');
          $BPNode.append($desInsertNode);

          continue;
        }
      }

    }
  }

}

let processandshowResult = function () {
  appendResult();
  appendHurryFlag();
  showResult();
}
//Test calling short#2
//processandshowResult();

// Recieve the API result from background.js
var returnResult = [];
chrome.runtime.onMessage.addListener(function (req, sender) {
  if (req.returnAPI !== undefined) {
    returnResult = req.returnAPI;
    //Test
    //console.log("Return: " + returnResult);
    processandshowResult();
  }
});
