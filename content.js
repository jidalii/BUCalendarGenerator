// the needed html for the schedule
// const html = document.querySelectorAll("tr[align='center']");

// map from day to number
const dayMap = {
  'MO': 1,
  'TU': 2,
  'WE': 3,
  'TH': 4,
  'FR': 5,
  'SA': 6,
  'SU': 7
}
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// chelper function: onvert 12-hour clock time into 24-hour clock time
const convertTime = function(str) {
  const period = str.substr(-2);
  let time = str.substring(0,str.length-2).split(':');
  if(period==='pm' && time[0]!=='12') {
      time[0] = String(Number(time[0])+12);
  }
  return new Array(time[0], time[1]);
}

// helper function: get day of week
const getDayOfWeek = function(dateString) {
  const [year, month, day] = dateString.split("/").map(Number);
  
  // JavaScript months are 0-indexed, so we subtract 1 from the month value.
  const date = new Date(year, month - 1, day);
  
  return dayMap[days[date.getDay()].toUpperCase().substring(0, 2)];
}
const firstDayofWeek = getDayOfWeek('2023/09/05'); // 2

// console.log(firstDayofWeek);

// calculate the first date of a course
// day: the first day of a course
// firstDay: the first day of the school shown on the school calendar
const calFirstDay = function(days, firstDay, dateVal) {
  let dayNum = dayMap[days[0]];
  for(const day of days) {
      if(dayMap[day]>=firstDay) {
          dayNum = dayMap[day];
          break;
      }
  }
  // console.log(dayNum, firstDay, dateVal);
  if(dayNum >= firstDay) {
      dateVal += dayNum-firstDay;
  }
  else {
      dateVal += 7+(dayNum-firstDay);
  }
  return `${dateVal<10?'0':''}${dateVal}`;
}

const row2classes = function(html) {
  // get raw schedule table
  let rows = html;
  // get each class
  let classls = [];
  
  // get text contents of each row
  for(let eles of rows) {
      let course = [];
      for(let ele of eles.children){
          course.push(ele.textContent);
      }  
      classls.push(course);
  }
  classls[0].splice(0,1);
  for(let course of classls) {
      course.splice(1, 3);
      course.splice(2,1);
      course.splice(-1,1);
  }
  // console.log(classls);

  const classes = [];
  for(let coursels of classls) {
      let course = {};

      course.code = coursels[0].split(/\s{1}/);
      course.name = coursels[1];
      course.type = coursels[2];
      course.bld = coursels[3];
      course.room = coursels[4];
      course.days = coursels[5].split(',').map(day=>day.substring(0,2).toUpperCase());
      course.start = convertTime(coursels[6].trim());
      course.end = convertTime(coursels[7].trim());
      course.startDate = `202309${calFirstDay(course.days, firstDayofWeek, 5)}`
      classes.push(course);
  }
  // console.log(classes);
  return classes;
}

const convert2events = function(classes) {
  // const classes = row2classes();
  let events = '';
  events += 
'BEGIN:VCALENDAR\n\
CALSCALE:GREGORIAN\n\
VERSION:2.0\n\
BEGIN:VTIMEZONE\n\
TZID:America/New_York\n\
BEGIN:DAYLIGHT\n\
DTSTART:20070311T020000\n\
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\n\
TZNAME:EDT\n\
TZOFFSETFROM:-0500\n\
TZOFFSETTO:-0400\n\
END:DAYLIGHT\n\
BEGIN:STANDARD\n\
DTSTART:20071104T020000\n\
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\n\
TZNAME:EST\n\
TZOFFSETFROM:-0400\n\
TZOFFSETTO:-0500\n\
END:STANDARD\n\
END:VTIMEZONE\n';
  classes.forEach(function(course){
  let event = 
`BEGIN:VEVENT\n\
UID:event-${course.code.toString().replaceAll(',','')}@bu.edu\n\
DTSTART;TZID=America/New_York:${course.startDate}T${course.start[0]+course.start[1]}00Z\n\
DTEND;TZID=America/New_York:${course.startDate}T${course.end[0]+course.end[1]}00Z\n\
SUMMARY:${course.code[1]+' '+course.code[2]}\n\
LOCATION:${course.bld+course.room}\n\
RRULE:FREQ=WEEKLY;UNTIL=20231213T190000Z;BYDAY=${course.days.toString()}\n\
END:VEVENT\n\n`;
  events+=event;
  })
  return events
}

// let classes = row2classes(html);
// let events = convert2events(classes);
// const res = events+'END:VCALENDAR';
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapePage') {
    const html = document.querySelectorAll("tr[align='center']");
    let classes = row2classes(html);
    let events = convert2events(classes);
    const icsContent = events+'END:VCALENDAR';
    // console.log(icsContent);
    // const html = document.body.outerHTML;
    sendResponse({ icsContent });
  }
});


