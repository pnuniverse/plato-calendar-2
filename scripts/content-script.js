console.log('content-script.js loaded');

window.onload = () => {
  const container = document.createElement('div');
  container.id = 'plato_calendar-container';
  container.innerText = 'Plato Calendar 2';
  const root = document.querySelector('.front-box');
  root.insertBefore(container, root.firstChild);
  initCalendar();
};

async function initCalendar() {
  //asset/calendar.html (5줄 캘린더 형태까지 html 구현)
  console.log('calendar 초기화1');
  await createCalendar();
  // initPopup();
  //eventListener 등록
  // updateCalendar(); //
}
async function createCalendar() {
  console.log('calendar 초기화2');

  return new Promise((reslove, reject) => {
    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('/assets/prev-style.css');
    document.head.appendChild(link);

    let calendarURL = chrome.runtime.getURL('/assets/calendar.html');
    fetch(calendarURL)
      .then(async (data) => data.text())
      .then((text) => {
        const domparser = new DOMParser();
        const doc = domparser.parseFromString(text, 'text/html');
        document
          .getElementById('plato_calendar-container')
          .appendChild(doc.querySelector('.calendar'));
      })
      .catch((error) => {
        console.log('error');
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
