import { getInfo, ASSIGNMENT_TYPE } from './getInfo';
import Loading from './loading';

const selectedDate = new Date();
let assignmentData = [];

/**
 * data row 모달창에 생성하는 함수
 */
function createModalContent(assignment) {
  // console.log('assign : ', assignment);
  const link = document.createElement('a');
  const img = document.createElement('img');
  const contentDiv = document.createElement('div');
  let typeImg = chrome.runtime.getURL(`/assets/img/${assignment.type}.png`);
  if (assignment.isDone)
    typeImg = chrome.runtime.getURL(`/assets/img/${assignment.type}Done.png`);

  link.className = 'modal-content-card';
  if (assignment.isDone) link.classList.add('done-modal-card');
  link.href = assignment.link;
  link.target = '_blank';
  img.src = typeImg;
  img.alt = `${assignment.type} icon`;
  contentDiv.innerHTML = `
    <div style="overflow:hidden">${assignment.title}</div>
    <div style="overflow:hidden">${assignment.courseName}</div>
    <div> 마감일 ${assignment.dueDate.getFullYear()}-${assignment.dueDate.getMonth() + 1}-${assignment.dueDate.getDate()}  ${assignment.dueDate.getHours().toString().padStart(2, '0')}:${assignment.dueDate.getMinutes().toString().padStart(2, '0')}</div>
    `;
  link.appendChild(img);
  link.appendChild(contentDiv);
  return link;
}

/**
 * 모달 열기
 * @param { Assignment[] } data - 과제 정보
 */
function openModal(data) {
  const modal = document.querySelector('#calendarModal');
  const modalContent = document.querySelector('.modal-content');
  const closeBtn = document.createElement('span');
  const DoneData = data.filter((item) => item.isDone);
  const NotDoneData = data.filter((item) => !item.isDone);

  modalContent.innerHTML = '';
  closeBtn.className = 'modal-content-header';
  closeBtn.innerText = 'x';
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modalContent.appendChild(closeBtn); // 닫기 버튼 추가

  NotDoneData.forEach((assignment) => {
    const linkObj = createModalContent(assignment);
    modalContent.appendChild(linkObj);
  });
  DoneData.forEach((assignment) => {
    const linkObj = createModalContent(assignment);
    modalContent.appendChild(linkObj);
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

  if (homeWork.length > 0) {
    if (homeWork.every((item) => item.isDone)) {
      homeWorkDiv.className = 'calendar-content-week-icon done-assignment';
      homeWorkDiv.innerText = `${homeWork.length}`;
    } else {
      homeWorkDiv.className = 'calendar-content-week-icon homeWork';
      homeWorkDiv.innerText = `${homeWork.filter((item) => !item.isDone).length}`;
    }
  } else homeWorkDiv.style.visibility = 'hidden';

  if (video.length > 0) {
    if (video.every((item) => item.isDone)) {
      videoDiv.className = 'calendar-content-week-icon done-assignment';
      videoDiv.innerText = `${video.length}`;
    } else {
      videoDiv.className = 'calendar-content-week-icon video';
      videoDiv.innerText = `${video.filter((item) => !item.isDone).length}`;
    }
  } else videoDiv.style.visibility = 'hidden';

  if (zoom.length > 0) {
    if (zoom.every((item) => item.isDone)) {
      zoomDiv.className = 'calendar-content-week-icon done-assignment';
      zoomDiv.innerText = `${zoom.length}`;
    } else {
      zoomDiv.className = 'calendar-content-week-icon zoom';
      zoomDiv.innerText = `${zoom.filter((item) => !item.isDone).length}`;
    }
  } else zoomDiv.style.visibility = 'hidden';

  if (quiz.length > 0) {
    if (quiz.every((item) => item.isDone)) {
      quizDiv.className = 'calendar-content-week-icon done-assignment';
      quizDiv.innerText = `${quiz.length}`;
    } else {
      quizDiv.className = 'calendar-content-week-icon quiz';
      quizDiv.innerText = `${quiz.filter((item) => !item.isDone).length}`;
    }
  } else quizDiv.style.visibility = 'hidden';

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
  const today = new Date();
  const firstDay = new Date(year, month - 1, 1); // 3/1 (토:6)
  const lastDay = new Date(year, month, 0); // 3/31 (일:0)
  const startDay = (firstDay.getDay() + 6) % 7; // 3/1 (토:6)
  const calendar = document.querySelectorAll('.calendar-content-week>li');
  for (let i = 0; i < calendar.length; i += 1) {
    calendar[i].innerHTML = '';
    calendar[i].style.backgroundColor = 'var(--backgroundColor)';
  }
  for (let i = startDay; i < lastDay.getDate() + startDay; i += 1) {
    renderCell(calendar[i], i - startDay + 1);
    if (
      i - startDay + 1 === today.getDate() &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear()
    )
      calendar[i].style.backgroundColor = 'var(--borderColor)';
    else calendar[i].style.backgroundColor = '#fff';
  }
  const disMonth = document.querySelector('#thisMonth');
  disMonth.innerText = `${year}년 ${month}월`;
}

function setRenderBtn(time = 60) {
  const renderBtnText = document.querySelector('#re-rendering > div');
  let clock = Math.ceil(time);
  const timer = setInterval(() => {
    clock -= 1;
    renderBtnText.innerText = `동기화 (${clock})`;
    if (clock <= 0) {
      clearInterval(timer);
      renderBtnText.innerText = '동기화 (가능)';
    }
  }, 1000);
}

async function reRenderCalendar() {
  Loading.show();

  const { asyncTimeJSON } = await chrome.storage.local.get('asyncTimeJSON');
  if (
    !asyncTimeJSON ||
    (asyncTimeJSON && new Date() - new Date(asyncTimeJSON) > 1000 * 60)
  ) {
    const info = await getInfo();
    assignmentData = info;
    await chrome.storage.local.set({
      asyncTimeJSON: new Date().toJSON(),
      info: JSON.stringify(info),
    });
    setRenderBtn();
    await loadCalendarDate({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
    });
    Loading.hide();
    return;
  }

  const { info } = await chrome.storage.local.get('info');

  assignmentData = JSON.parse(info);
  assignmentData = assignmentData.map((data) => {
    return { ...data, dueDate: new Date(data.dueDate) };
  });

  // await chrome.storage.local.set({
  //   asyncTimeJSON: new Date().toJSON(),
  //   info: JSON.stringify(assignmentData),
  // });

  await loadCalendarDate({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
  });
  Loading.hide();
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
        const reRenderBtn = calendar.querySelector('#re-rendering');

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
        reRenderBtn.addEventListener('click', () => {
          reRenderCalendar();
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

  // initPopup();
  // eventListener 등록
  // updateCalendar(); //
}

/**
 * 캘린더 데이터 로드
 */
async function loadCalendarData() {
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
    setRenderBtn(60);
    return;
  }

  const { info } = await chrome.storage.local.get('info');

  assignmentData = JSON.parse(info);
  assignmentData = assignmentData.map((data) => {
    return { ...data, dueDate: new Date(data.dueDate) };
  });

  await chrome.storage.local.set({
    asyncTimeJSON,
    info: JSON.stringify(assignmentData),
  });

  const timeInterval = (new Date() - new Date(asyncTimeJSON)) / 1000;
  setRenderBtn(timeInterval > 60 ? 0 : 60 - timeInterval);
}

window.onload = async () => {
  if (!document.getElementsByClassName('front-box front-box-pmooc').length)
    return;
  await initCalendar();
  Loading.show();
  loadCalendarData().then(() => {
    loadCalendarDate({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
    });
    Loading.hide();
  });
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
