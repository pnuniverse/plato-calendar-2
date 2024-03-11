import sidePanel from './side-panel';
import { getInfo, ASSIGNMENT_TYPE } from './getInfo';

sidePanel();

const selectedDate = new Date();
let assignmentData = [];
let isLoading = true;

/**
 * 모달창 과목 이름만 보여주기
 */
function extractText(input) {
  const startIndex = input.indexOf('(');
  const endIndex = input.indexOf(')');

  let output;

  if (startIndex !== -1 && endIndex !== -1) {
    output = input.substring(0, startIndex);
  } else {
    output = input;
  }

  if (output.length > 11) {
    output = `${output.substring(0, 11)}...`;
  }

  return output;
}

/**
 * 모달 열기
 * @param { Assignment[] } data - 과제 정보
 */
function openModal(data) {
  const modal = document.querySelector('#calendarModal');
  const modalContent = document.querySelector('.modal-content');
  const closeBtn = document.createElement('span');

  modalContent.innerHTML = '';
  closeBtn.className = 'close';
  closeBtn.innerText = 'x';
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modalContent.appendChild(closeBtn); // 닫기 버튼 추가

  data.forEach((assignment) => {
    const link = document.createElement('a');
    const img = document.createElement('img');
    const contentDiv = document.createElement('div');
    const typeImg = chrome.runtime.getURL(`/assets/img/${assignment.type}.png`);

    link.className = 'modal-content-card';
    link.href = assignment.link;
    img.src = typeImg;
    img.alt = `${assignment.type} icon`;
    contentDiv.innerHTML = `
    <div style="overflow:hidden">${assignment.title}</div>
    <div style="overflow:hidden">${extractText(assignment.courseName)}</div>
    <div> 마감일 ${assignment.dueDate.getFullYear()}-${assignment.dueDate.getMonth()}-${assignment.dueDate.getDate()}  ${assignment.dueDate.getHours().toString().padStart(2, '0')}:${assignment.dueDate.getMinutes().toString().padStart(2, '0')}</div>
    `;
    link.appendChild(img);
    link.appendChild(contentDiv);
    modalContent.appendChild(link);
  });
  modal.style.display = 'flex';
}

/**
 * 셀 렌더링 함수
 */
function renderCell(cell, date) {
  const spanCell = document.createElement('span');
  const divCell = document.createElement('div');
  const dateData = assignmentData.filter(({ dueDate }) => {
    return (
      dueDate.getDate() === date &&
      dueDate.getMonth() === selectedDate.getMonth() &&
      dueDate.getFullYear() === selectedDate.getFullYear()
    );
  });
  const typeData = Object.groupBy(dateData, ({ type }) => type);

  const homeWork = typeData[ASSIGNMENT_TYPE.HOMEWORK] || [];
  const video = typeData[ASSIGNMENT_TYPE.VIDEO] || [];
  const zoom = typeData[ASSIGNMENT_TYPE.ZOOM] || [];
  const quiz = typeData[ASSIGNMENT_TYPE.QUIZ] || [];

  const homeWorkDiv = document.createElement('div');
  const videoDiv = document.createElement('div');
  const zoomDiv = document.createElement('div');
  const quizDiv = document.createElement('div');

  homeWorkDiv.className = 'calendar-content-week-icon homeWork';
  videoDiv.className = 'calendar-content-week-icon video';
  zoomDiv.className = 'calendar-content-week-icon zoom';
  quizDiv.className = 'calendar-content-week-icon quiz';

  if (homeWork.length > 0) homeWorkDiv.innerText = `${homeWork.length}`;
  else homeWorkDiv.style.visibility = 'hidden';
  if (video.length > 0) videoDiv.innerText = `${video.length}`;
  else videoDiv.style.visibility = 'hidden';
  if (zoom.length > 0) zoomDiv.innerText = `${zoom.length}`;
  else zoomDiv.style.visibility = 'hidden';
  if (quiz.length > 0) quizDiv.innerText = `${quiz.length}`;
  else quizDiv.style.visibility = 'hidden';

  homeWorkDiv.addEventListener('click', () => openModal(homeWork));
  videoDiv.addEventListener('click', () => openModal(video));
  zoomDiv.addEventListener('click', () => openModal(zoom));
  quizDiv.addEventListener('click', () => openModal(quiz));

  divCell.appendChild(homeWorkDiv);
  divCell.appendChild(videoDiv);
  divCell.appendChild(zoomDiv);
  divCell.appendChild(quizDiv);
  spanCell.innerText = date;

  cell.appendChild(spanCell);
  cell.appendChild(divCell);
}

/**
 * 캘린더 날자 로드
 */
async function loadCalendarDate({ year, month }) {
  const firstDay = new Date(year, month - 1, 1); // 3/1 (토:6)
  const lastDay = new Date(year, month, 0); // 3/31 (일:0)
  const startDay = (firstDay.getDay() + 6) % 7; // 3/1 (토:6)
  const calendar = document.querySelectorAll('.calendar-content-week>li');
  for (let i = 0; i < startDay; i += 1) {
    calendar[i].innerHTML = '';
  }
  for (let i = startDay; i < lastDay.getDate() + startDay; i += 1) {
    calendar[i].innerHTML = '';
    renderCell(calendar[i], i - startDay + 1);
  }
  for (let i = lastDay.getDate() + startDay; i < calendar.length; i += 1) {
    calendar[i].innerHTML = '';
  }
  const disMonth = document.querySelector('#thisMonth');
  disMonth.innerText = `${year}년 ${month}월`;
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
          .replaceAll('{homework}', homeWorkImg)
          .replaceAll('{video}', videoImg)
          .replaceAll('{quiz}', quizImg)
          .replaceAll('{zoom}', zoomImg)
          .replace('{loading}', loadingImg);
      })
      .then((text) => {
        const doc = domparser.parseFromString(text, 'text/html');
        const toggle = document.createElement('details');
        const summary = document.createElement('summary');
        const calendar = doc.querySelector('.calendar');

        const leftBtn = calendar.querySelector('#prevMonth');
        const rightBtn = calendar.querySelector('#nextMonth');
        const loadingBtn = calendar.querySelector('#re-rendering');

        leftBtn.addEventListener('click', () => {
          selectedDate.setMonth(selectedDate.getMonth() - 1);
          loadCalendarDate({
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth() + 1,
          });
        });
        rightBtn.addEventListener('click', () => {
          selectedDate.setMonth(selectedDate.getMonth() + 1);
          loadCalendarDate({
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth() + 1,
          });
        });
        loadingBtn.addEventListener('click', async () => {
          if (isLoading) return;
          loadingBtn.style.cursor = 'wait';
          await loadCalendarDate({
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth() + 1,
          });
          loadingBtn.style.cursor = 'pointer';
        });

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
  await createCalendar();
  loadCalendarDate({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
  });
}

/**
 * 캘린더 데이터 로드
 */
async function loadCalendarData() {
  isLoading = true;
  // chrome.storage.local.clear();
  await chrome.storage.local.get(console.log);
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
    console.log('info: ', info);
    return;
  }
  const { info } = await chrome.storage.local.get('info');
  console.log('info2: ', info);
  assignmentData = JSON.parse(info);
  assignmentData = assignmentData.map((data) => {
    return { ...data, dueDate: new Date(data.dueDate) };
  });
  isLoading = false;
  await chrome.storage.local.set({
    asyncTimeJSON: new Date().toJSON(),
    info: JSON.stringify(assignmentData),
  });
}

window.onload = async () => {
  if (!document.getElementsByClassName('front-box front-box-pmooc').length)
    return;
  await loadCalendarData();
  initCalendar();
};
