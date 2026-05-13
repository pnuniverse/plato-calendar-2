import { getInfo, ASSIGNMENT_TYPE, Assignment } from './getInfo';
import Loading from './loading';

const selectedDate = new Date();
let assignmentData: Assignment[] = [];

/**
 * data row 모달창에 생성하는 함수
 */
function createModalContent(assignment: Assignment) {

  if (assignment.dueDate === null) {
    throw new Error('createModalContent: dueDate is required');
  }

  const link = document.createElement('a');
  const img = document.createElement('img');
  const contentDiv = document.createElement('div');

  let typeImg = chrome.runtime.getURL(`/assets/img/${assignment.type}.png`);
  if (assignment.isDone)
    typeImg = chrome.runtime.getURL(`/assets/img/${assignment.type}Done.png`);

  link.className = 'modal-content-card';
  if (assignment.isDone) link.classList.add('done-modal-card');

  link.href = assignment.link ?? '#';
  link.target = '_blank';
  img.src = typeImg;
  img.alt = `${assignment.type} icon`;
  
  const { dueDate } = assignment;
  contentDiv.innerHTML = `
    <div style="overflow:hidden">${assignment.title}</div>
    <div style="overflow:hidden">${assignment.courseName}</div>
    <div> 마감일 ${dueDate.getFullYear()}-${dueDate.getMonth() + 1}-${dueDate.getDate()}  ${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}</div>
    `;
  link.appendChild(img);
  link.appendChild(contentDiv);
  return link;
}

/**
 * 모달 열기
 * @param { Assignment[] } data - 과제 정보
 */
function openModal(data: Assignment[]): void {
  const modal = document.querySelector<HTMLElement>('#calendarModal');
  const modalContent = document.querySelector<HTMLElement>('.modal-content');

  if (modal === null || modalContent === null) return;

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

function hasDueDate(
  assignment: Assignment,
): assignment is Assignment & { dueDate: Date } {
  return assignment.dueDate !== null;
}

/**
 * 셀 렌더링 함수
 *
 * @param cell - 캘린더의 한 칸 (li 요소)
 * @param date - 해당 칸에 표시할 날짜(1~31)
 */
function renderCell(cell: HTMLElement, date: number): void {
  const spanCell = document.createElement('span');
  const divCell = document.createElement('div');

  const dateData = assignmentData
  .filter(hasDueDate)
  .filter(({ dueDate }) => {
    return (
      dueDate.getDate() === date &&
      dueDate.getMonth() === selectedDate.getMonth() &&
      dueDate.getFullYear() === selectedDate.getFullYear()
    );
  });
  const typeData = Object.groupBy(dateData, ({ type }) => type);

  const homeWork = typeData[ASSIGNMENT_TYPE.HOMEWORK] ?? [];
  const video = typeData[ASSIGNMENT_TYPE.VIDEO] ?? [];
  const zoom = typeData[ASSIGNMENT_TYPE.ZOOM] ?? [];
  const quiz = typeData[ASSIGNMENT_TYPE.QUIZ] ?? [];

  const homeWorkDiv = document.createElement('div');
  const videoDiv = document.createElement('div');
  const zoomDiv = document.createElement('div');
  const quizDiv = document.createElement('div');

  if (homeWork.length > 0) {
    const isDone = homeWork.every((item) => item.isDone);
    homeWorkDiv.className = `calendar-content-week-icon ${isDone ? 'done-assignment' : 'homeWork'}`;
    homeWorkDiv.innerText = `${homeWork.filter((item) => item.isDone).length}/${homeWork.length}`;
  } else homeWorkDiv.style.visibility = 'hidden';

  if (video.length > 0) {
    const isDone = video.every((item) => item.isDone);
    videoDiv.className = `calendar-content-week-icon ${isDone ? 'done-assignment' : 'video'}`;
    videoDiv.innerText = `${video.filter((item) => item.isDone).length}/${video.length}`;
  } else videoDiv.style.visibility = 'hidden';

  if (zoom.length > 0) {
    const isDone = zoom.every((item) => item.isDone);
    zoomDiv.className = `calendar-content-week-icon ${isDone ? 'done-assignment' : 'zoom'}`;
    zoomDiv.innerText = `${zoom.filter((item) => item.isDone).length}/${zoom.length}`;
  } else zoomDiv.style.visibility = 'hidden';

  if (quiz.length > 0) {
    const isDone = quiz.every((item) => item.isDone);
    quizDiv.className = `calendar-content-week-icon ${isDone ? 'done-assignment' : 'quiz'}`;
    quizDiv.innerText = `${quiz.filter((item) => item.isDone).length}/${quiz.length}`;
  } else quizDiv.style.visibility = 'hidden';

  homeWorkDiv.addEventListener('click', () => openModal(homeWork));
  videoDiv.addEventListener('click', () => openModal(video));
  zoomDiv.addEventListener('click', () => openModal(zoom));
  quizDiv.addEventListener('click', () => openModal(quiz));

  divCell.appendChild(homeWorkDiv);
  divCell.appendChild(videoDiv);
  divCell.appendChild(zoomDiv);
  divCell.appendChild(quizDiv);
  spanCell.innerText = String(date);

  cell.appendChild(spanCell);
  cell.appendChild(divCell);
}

/**
 * 캘린더 날자 로드
 */
async function loadCalendarDate({ 
  year, 
  month 
}: {
  year: number;
  month: number;
}): Promise<void> {
  const today = new Date();
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDay = firstDay.getDay();

  const calendar = document.querySelectorAll<HTMLElement>('.calendar-content-week>li');
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
    ) {
      calendar[i].style.backgroundColor = 'var(--borderColor)';
    } else calendar[i].style.backgroundColor = '#fff';
  }

  const disMonth = document.querySelector<HTMLElement>('#thisMonth');
  if (disMonth !== null) {
    disMonth.innerText = `${year}년 ${month}월`;
  }
}

function setRenderBtn(time: number = 60): void {
  const renderBtnText = document.querySelector<HTMLElement>('#re-rendering > div');
  if (renderBtnText === null) return;

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
    (typeof asyncTimeJSON === 'string' && new Date().getTime() - new Date(asyncTimeJSON).getTime() > 1000 * 60)
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

  if (typeof info !== 'string') return;
  
  const parsed: unknown = JSON.parse(info);
  if (!Array.isArray(parsed)) return;
  assignmentData = parsed.map((data) => ({ 
    ...data, 
    dueDate: data.dueDate !== null ? new Date(data.dueDate) : null, 
  })) as Assignment[];

  await loadCalendarDate({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
  });
  Loading.hide();
}

/**
 * 캘린더 생성
 */
async function createCalendar(): Promise<void> {
  const domparser = new DOMParser();
  const calendarURL = chrome.runtime.getURL('/assets/calendar.html');

  return new Promise<void>((resolve, reject) => {
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

        if (calendar === null) {
          reject(new Error('calendar element not found'));
          return;
        }

        const leftBtn = calendar.querySelector('#prevMonth');
        const rightBtn = calendar.querySelector('#nextMonth');
        const reRenderBtn = calendar.querySelector('#re-rendering');

        if (leftBtn === null || rightBtn === null || reRenderBtn === null) {
          reject(new Error('calendar buttons not found'));
          return;
        }

        leftBtn.addEventListener('click', () => {
          selectedDate.setDate(1);
          selectedDate.setMonth(selectedDate.getMonth() - 1);
          loadCalendarDate({
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth() + 1,
          });
        });
        rightBtn.addEventListener('click', () => {
          selectedDate.setDate(1);
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

        const root = document.querySelector('.front-box');
        if (root === null) {
          reject(new Error('.front-box not found'));
          return;
        }
        root.insertBefore(toggle, root.firstChild);
        resolve();
      })
      .catch((error) => {
        console.log('error: ', error);
        reject();
      });
  });
}

async function initCalendar() {
  await createCalendar();
}

/**
 * 캘린더 데이터 로드
 */
async function loadCalendarData() {
  const { asyncTimeJSON } = await chrome.storage.local.get('asyncTimeJSON');
  if (
    !asyncTimeJSON ||
    (typeof asyncTimeJSON === 'string' && new Date().getTime() - new Date(asyncTimeJSON).getTime() > 1000 * 60)
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

  if (typeof info === 'string') {
    const parsed: unknown = JSON.parse(info);
    if (!Array.isArray(parsed)) return;

    assignmentData = parsed.map((data) => ({
      ...data,
      dueDate: data.dueDate !== null ? new Date(data.dueDate) : null,
    })) as Assignment[];
  }


  await chrome.storage.local.set({
    asyncTimeJSON,
    info: JSON.stringify(assignmentData),
  });

  if (typeof asyncTimeJSON === 'string') {
    const timeInterval = (new Date().getTime() - new Date(asyncTimeJSON).getTime()) / 1000;
    setRenderBtn(timeInterval > 60 ? 0 : 60 - timeInterval);
  }

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
