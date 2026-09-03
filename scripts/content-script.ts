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

  const typeImg = chrome.runtime.getURL(
    `/assets/img-v2/${assignment.type}.svg`,
  );

  link.className = 'plato-calendar-2-modal-content-card';
  if (assignment.isDone) link.classList.add('plato-calendar-2-done-modal-card');

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
  const modal = document.querySelector<HTMLElement>('#plato-calendar-2-modal');
  const modalContent = document.querySelector<HTMLElement>('.plato-calendar-2-modal-content');

  if (modal === null || modalContent === null) return;

  const closeBtn = document.createElement('span');
  const DoneData = data.filter((item) => item.isDone);
  const NotDoneData = data.filter((item) => !item.isDone);

  modalContent.innerHTML = '';
  closeBtn.className = 'plato-calendar-2-modal-content-header';
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

  // 그 날 존재하는 유형만 아이콘으로 그린다.
  Object.values(ASSIGNMENT_TYPE).forEach((type) => {
    const items = typeData[type] ?? [];
    if (items.length === 0) return;

    const doneCount = items.filter((item) => item.isDone).length;
    const iconDiv = document.createElement('div');
    const iconImg = document.createElement('img');
    const countSpan = document.createElement('span');

    iconDiv.className = 'calendar-content-week-icon';
    if (doneCount === items.length) iconDiv.classList.add('done-assignment');
    iconDiv.title = type;

    iconImg.src = chrome.runtime.getURL(`/assets/img-v2/${type}.svg`);
    iconImg.alt = type;
    countSpan.innerText = `${doneCount}/${items.length}`;

    iconDiv.appendChild(iconImg);
    iconDiv.appendChild(countSpan);
    iconDiv.addEventListener('click', () => openModal(items));
    divCell.appendChild(iconDiv);
  });

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

/**
 * 과제 정보를 불러와 캘린더를 그린다.
 * 조회 부하는 getInfo 내부의 캐시가 담당하므로 여기서 따로 막지 않는다.
 */
async function syncCalendar(): Promise<void> {
  Loading.show();

  assignmentData = await getInfo();
  await loadCalendarDate({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
  });

  Loading.hide();
}

/**
 * 헤더의 유형 범례를 그린다.
 * @param { Element } calendar - 캘린더 루트 요소
 */
function renderTypeLegend(calendar: Element): void {
  const legend = calendar.querySelector('.calendar-header-info-icons');
  if (legend === null) return;

  legend.innerHTML = '';
  Object.values(ASSIGNMENT_TYPE).forEach((type) => {
    const box = document.createElement('div');
    const img = document.createElement('img');

    img.src = chrome.runtime.getURL(`/assets/img-v2/${type}.svg`);
    img.alt = type;
    box.title = type;
    box.appendChild(img);
    legend.appendChild(box);
  });
}

/**
 * 캘린더 생성
 */
async function createCalendar(): Promise<HTMLElement> {
  const domparser = new DOMParser();
  const calendarURL = chrome.runtime.getURL('/assets/calendar.html');

  return new Promise<HTMLElement>((resolve, reject) => {
    fetch(calendarURL)
      .then(async (data) => {
        const leftImg = chrome.runtime.getURL('/assets/img/left.png');
        const rightImg = chrome.runtime.getURL('/assets/img/right.png');

        return (await data.text())
          .replace('{left}', leftImg)
          .replace('{right}', rightImg);
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

        renderTypeLegend(calendar);

        const leftBtn = calendar.querySelector('#prevMonth');
        const rightBtn = calendar.querySelector('#nextMonth');

        if (leftBtn === null || rightBtn === null) {
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
        summary.innerText = 'Plato Calendar 2';
        toggle.appendChild(summary);
        toggle.appendChild(calendar);
        toggle.id = 'plato_calendar-container';

        resolve(toggle);
      })
      .catch((error) => {
        console.log('error: ', error);
        reject();
      });
  });
}

async function initCalendar(targetContainer: HTMLElement) {
  const calendar: HTMLElement = await createCalendar();
  if (!targetContainer) return;
  targetContainer.insertBefore(calendar, targetContainer.firstChild);
}

window.onload = async () => {
  const targetContainer: HTMLElement | null = document.querySelector('#page-content .ongoing-courses');
  if (targetContainer === null)
    return;
  await initCalendar(targetContainer);
  await syncCalendar();
};
