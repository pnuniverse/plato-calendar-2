import sidePanel from './side-panel';
import getInfo from './getInfo';

sidePanel();

const selectedDate = new Date();
let assignmentData = [];
let isLoading = true;

/**
 * 셀 렌더링 함수
 */
function renderCell(cell, date) {
  const spanCell = document.createElement('span');
  const divCell = document.createElement('div');

  spanCell.innerText = date;
  divCell.innerHTML = `<div class="calendar-content-week-icon video">0/4</div>
          <div class="calendar-content-week-icon zoom">0/4</div>
          <div class="calendar-content-week-icon homeWork">0/4</div>
          <div class="calendar-content-week-icon quiz">0/4</div>`;
  cell.appendChild(spanCell);
  cell.appendChild(divCell);
}

/**
 * 캘린더 날자 로드
 */
function loadCalendarDate({ year, month }) {
  const firstDay = new Date(year, month - 1, 1); // 3/1 (토:6)
  const lastDay = new Date(year, month, 0); // 3/31 (일:0)
  const startDay = (firstDay.getDay() + 6) % 7; // 3/1 (토:6)

  const calendar = document.querySelectorAll('.calendar-content-week>li');
  for (let i = startDay; i < lastDay.getDate() + startDay; i += 1) {
    renderCell(calendar[i], i - startDay + 1);
  }
}

/**
 * 캘린더 생성
 */
async function createCalendar() {
  const domparser = new DOMParser();
  const calendarURL = chrome.runtime.getURL('/assets/calendar.html');

  return new Promise((reslove, reject) => {
    fetch(calendarURL)
      .then(async (data) => {
        const leftImg = chrome.runtime.getURL('/assets/img/left.png');
        const rightImg = chrome.runtime.getURL('/assets/img/right.png');
        const homeWorkImg = chrome.runtime.getURL('/assets/img/homework.png');
        const videoImg = chrome.runtime.getURL('/assets/img/video.png');
        const quizImg = chrome.runtime.getURL('/assets/img/quiz.png');
        const zoomImg = chrome.runtime.getURL('/assets/img/zoom.png');
        const loadingImg = chrome.runtime.getURL('/assets/img/loading.png');

        return (await data.text())
          .replace('{left}', leftImg)
          .replace('{right}', rightImg)
          .replace('{homework}', homeWorkImg)
          .replace('{video}', videoImg)
          .replace('{quiz}', quizImg)
          .replace('{zoom}', zoomImg)
          .replace('{loading}', loadingImg);
      })
      .then((text) => {
        const doc = domparser.parseFromString(text, 'text/html');
        const toggle = document.createElement('details');
        const summary = document.createElement('summary');
        const calendar = doc.querySelector('.calendar');

        summary.innerText = 'Plato Calendar 2';
        toggle.appendChild(summary);
        toggle.appendChild(calendar);
        toggle.id = 'plato_calendar-container';
        // toggle "Plato Calendar" 생성

        const root = document.querySelector('.front-box');
        root.insertBefore(toggle, root.firstChild);
        reslove();
      })
      .catch((error) => {
        console.log('error: ', error);
        reject();
      });
  });
}

async function initCalendar() {
  // asset/calendar.html (5줄 캘린더 형태까지 html 구현)
  await createCalendar();
  loadCalendarDate({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
  });

  // initPopup();
  // eventListener 등록
  // updateCalendar(); //
}

/**
 * 캘린더 데이터 로드
 */
async function loadCalendarData() {
  isLoading = true;
  const { asyncTimeJSON } = await chrome.storage.local.get('asyncTimeJSON');

  if (
    !asyncTimeJSON ||
    (asyncTimeJSON && new Date() - new Date(asyncTimeJSON) > 1000 * 60 * 60)
  ) {
    const info = await getInfo();
    assignmentData = info;
    await chrome.storage.local.set({
      asyncTimeJSON: new Date().toJSON(),
      info: JSON.stringify(info),
    });
    return;
  }

  const { info } = await chrome.storage.local.get('info');
  assignmentData = JSON.parse(info);
  isLoading = false;
  await chrome.storage.local.set({
    asyncTimeJSON: new Date().toJSON(),
    info: JSON.stringify(assignmentData),
  });
}

window.onload = () => {
  if (!document.getElementsByClassName('front-box front-box-pmooc').length)
    return;

  initCalendar();
  loadCalendarData();
};

// const initPopup = () => {};

// const updateCalendar = () => {
//   const data = dataLoad();
//   //html안에 넣어야 할것 (event역할)
// };

// const dataLoad = () => {
//   return [Assignment, Assignment, Assignment, Assignment, Assignment];
// };

// //style 적용 잘해두기
