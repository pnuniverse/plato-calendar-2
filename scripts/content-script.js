import sidePanel from './side-panel';
import getInfo from './getInfo';
let calendarboxToggle;

console.log('content-script.js loaded');
sidePanel();
getInfo();

window.onload = () => {
  if (!document.getElementsByClassName('front-box front-box-pmooc').length)
    return;
  initCalendar();
};

async function initCalendar() {
  //asset/calendar.html (5줄 캘린더 형태까지 html 구현)
  await createCalendar();
  // initPopup();
  //eventListener 등록
  // updateCalendar(); //
}

/**
 * 캘린더 생성
 */
async function createCalendar() {
  // let toggle = document.createElement('details');
  // let summary = document.createElement('summary');
  // summary.innerText = 'Plato Calendar 2';
  // toggle.appendChild(summary);
  // // toggle.appendChild(document.querySelector('.calendar'));
  // toggle.id = 'plato_calendar-container';

  // const root = document.querySelector('.front-box');
  // root.insertBefore(toggle, root.firstChild);

  console.log('calendar 초기화2');

  return new Promise((reslove, reject) => {
    let calendarURL = chrome.runtime.getURL('/assets/calendar.html');
    fetch(calendarURL)
      .then(async (data) => data.text())
      .then((text) => {
        const domparser = new DOMParser();
        const doc = domparser.parseFromString(text, 'text/html');
        // document
        //   .getElementById('plato_calendar-container')
        //   .appendChild(doc.querySelector('.calendar'));
        console.log('calendar 초기화3', doc);

        let toggle = document.createElement('details');
        let summary = document.createElement('summary');
        summary.innerText = 'Plato Calendar 2';
        toggle.appendChild(summary);
        toggle.appendChild(doc.querySelector('.calendar'));
        toggle.id = 'plato_calendar-container';
        const root = document.querySelector('.front-box');
        root.insertBefore(toggle, root.firstChild);
      })
      .catch((error) => {
        console.log('error: ', error);
      });
    reslove();
  });
}

// const initPopup = () => {};

// const updateCalendar = () => {
//   const data = dataLoad();
//   //html안에 넣어야 할것 (event역할)
// };

// const dataLoad = () => {
//   return [Assignment, Assignment, Assignment, Assignment, Assignment];
// };

// //style 적용 잘해두기
