import {
  getInfo,
  ASSIGNMENT_TYPE,
  Assignment,
  AssignmentType,
} from './getInfo';
import Loading from './loading';

const selectedDate = new Date();
let assignmentData: Assignment[] = [];

/** assets의 html 파일에서 꺼내 둔 조각 template. id를 키로 쓴다. */
const templates = new Map<string, HTMLTemplateElement>();

/**
 * assets 하위 html 조각을 불러와 {키} 자리를 채운 뒤 파싱한다.
 * 파일에 들어 있는 template은 자동으로 등록해 cloneTemplate으로 꺼내 쓴다.
 * @param { string } path - 확장 프로그램 기준 경로
 * @param { Record<string, string> } replacements - 치환할 {키}와 값
 */
async function loadTemplate(
  path: string,
  replacements: Record<string, string> = {},
): Promise<Document> {
  const response = await fetch(chrome.runtime.getURL(path));
  const html = Object.entries(replacements).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    await response.text(),
  );
  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('template').forEach((template) => {
    templates.set(template.id, template);
  });

  return doc;
}

/**
 * 등록해 둔 조각 template을 복제한다.
 * @param { string } id - template 요소의 id
 */
function cloneTemplate(id: string): DocumentFragment {
  const template = templates.get(id);

  if (template === undefined) {
    throw new Error(`cloneTemplate: unknown template ${id}`);
  }

  return document.importNode(template.content, true);
}

/**
 * 마감일 표기 문자열
 */
function formatDueDate(dueDate: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${dueDate.getFullYear()}-${pad(dueDate.getMonth() + 1)}-${pad(dueDate.getDate())} ${pad(dueDate.getHours())}:${pad(dueDate.getMinutes())}`;
}

/**
 * 과제 하나를 모달 카드 한 줄로 만든다. 구조는 assets/modal.html의 template에 있고
 * 여기서는 복제본에 데이터만 채운다.
 * @param { Assignment } assignment - 과제 정보
 */
function createModalContent(assignment: Assignment): DocumentFragment {
  const card = cloneTemplate('plato-calendar-2-modal-card');
  const link = card.querySelector<HTMLAnchorElement>(
    '.plato-calendar-2-service-menu',
  );
  const icon = card.querySelector<HTMLImageElement>(
    '.plato-calendar-2-service-menu-bullet > img',
  );
  const title = card.querySelector<HTMLElement>(
    '.plato-calendar-2-service-menu-title',
  );
  const desc = card.querySelector<HTMLElement>(
    '.plato-calendar-2-service-menu-desc',
  );

  if (link === null || icon === null || title === null || desc === null) {
    throw new Error('createModalContent: broken modal card template');
  }

  if (assignment.isDone) link.classList.add('plato-calendar-2-done-modal-card');

  link.href = assignment.link ?? '#';
  link.title = assignment.title;

  icon.src = chrome.runtime.getURL(`/assets/img-v2/${assignment.type}.svg`);
  icon.alt = assignment.type;

  title.textContent = assignment.title;
  desc.textContent = [
    assignment.courseName,
    assignment.dueDate === null
      ? '마감일 없음'
      : `마감 ${formatDueDate(assignment.dueDate)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return card;
}

/**
 * 모달 열기
 * @param { string } title - 모달 헤더 문구
 * @param { Assignment[] } data - 띄울 과제 정보
 */
function openModal(title: string, data: Assignment[]): void {
  const modal = document.querySelector<HTMLElement>('#plato-calendar-2-modal');
  const modalTitle = document.querySelector<HTMLElement>(
    '.plato-calendar-2-modal-title',
  );
  const list = document.querySelector<HTMLElement>(
    '.plato-calendar-2-modal-list',
  );

  if (modal === null || modalTitle === null || list === null) return;

  // 마감이 이른 순으로 두되 이미 한 것은 뒤로 보낸다.
  const sorted = [...data].sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    // 마감일이 없는 활동은 순서를 매길 수 없으므로 뒤로 보낸다.
    if ((a.dueDate === null) !== (b.dueDate === null)) {
      return a.dueDate === null ? 1 : -1;
    }

    return (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0);
  });

  modalTitle.textContent = title;

  list.innerHTML = '';
  if (sorted.length === 0) {
    list.appendChild(cloneTemplate('plato-calendar-2-modal-empty'));
  } else {
    sorted.forEach((assignment) => {
      list.appendChild(createModalContent(assignment));
    });
  }

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
  const content = cloneTemplate('plato-calendar-2-cell');
  const dateLabel = content.querySelector('span');
  const icons = content.querySelector('div');

  if (dateLabel === null || icons === null) return;

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
    const iconFragment = cloneTemplate('plato-calendar-2-cell-icon');
    const icon = iconFragment.querySelector<HTMLElement>(
      '.calendar-content-week-icon',
    );
    const iconImg = iconFragment.querySelector('img');
    const countSpan = iconFragment.querySelector('span');

    if (icon === null || iconImg === null || countSpan === null) return;

    if (doneCount === items.length) icon.classList.add('done-assignment');
    icon.title = type;

    iconImg.src = chrome.runtime.getURL(`/assets/img-v2/${type}.svg`);
    iconImg.alt = type;
    countSpan.textContent = `${doneCount}/${items.length}`;

    icon.addEventListener('click', () =>
      openModal(`${selectedDate.getMonth() + 1}월 ${date}일 ${type}`, items),
    );
    icons.appendChild(icon);
  });

  dateLabel.textContent = String(date);
  cell.appendChild(content);
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
    disMonth.textContent = `${year}년 ${month}월`;
  }

  updateTypeLegendCounts();
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
 * 범례에서 다루는 활동. 개수 배지와 모달이 같은 기준을 쓰도록 여기로 모은다.
 * 마감일이 없는 활동은 특정 달에 속하지 않으므로 유형만 맞으면 함께 본다.
 * @param { AssignmentType } type - 학습활동 유형
 */
function getTypeAssignments(type: AssignmentType): Assignment[] {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  return assignmentData.filter(
    (assignment) =>
      assignment.type === type &&
      (assignment.dueDate === null ||
        (assignment.dueDate.getMonth() === month &&
          assignment.dueDate.getFullYear() === year)),
  );
}

/**
 * 범례 아이콘을 눌렀을 때. 보고 있는 달의 해당 유형 과제를 모두 띄운다.
 * @param { AssignmentType } type - 학습활동 유형
 */
function openTypeModal(type: AssignmentType): void {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  openModal(`${year}년 ${month + 1}월 ${type}`, getTypeAssignments(type));
}

/**
 * 범례 아이콘의 미완료 개수 배지를 다시 계산한다.
 * 과제 정보나 보고 있는 달이 바뀌면 호출한다.
 */
function updateTypeLegendCounts(): void {
  document
    .querySelectorAll<HTMLElement>('.calendar-header-info-icons > div')
    .forEach((box) => {
      const badge = box.querySelector<HTMLElement>(
        '.plato-calendar-2-legend-count',
      );
      const { type } = box.dataset;

      if (badge === null || type === undefined) return;

      const remaining = getTypeAssignments(type).filter(
        (assignment) => !assignment.isDone,
      ).length;
      // 남은 활동이 없으면 배지를 비워 감춘다.
      badge.textContent = remaining === 0 ? '' : String(remaining);
    });
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
    const item = cloneTemplate('plato-calendar-2-legend-item');
    const box = item.querySelector('div');
    const img = item.querySelector('img');

    if (box === null || img === null) return;

    img.src = chrome.runtime.getURL(`/assets/img-v2/${type}.svg`);
    img.alt = type;
    box.title = type;
    box.dataset.type = type;
    box.addEventListener('click', () => openTypeModal(type));
    legend.appendChild(item);
  });
}

/**
 * 캘린더 생성. 구조는 assets/calendar.html에 있고 여기서는 이미지 경로만 채운다.
 */
async function createCalendar(): Promise<HTMLElement> {
  const doc = await loadTemplate('/assets/calendar.html', {
    left: chrome.runtime.getURL('/assets/img/left.png'),
    right: chrome.runtime.getURL('/assets/img/right.png'),
  });

  const container = doc.querySelector<HTMLElement>('#plato_calendar-container');
  const calendar = container?.querySelector('.calendar') ?? null;

  if (container === null || calendar === null) {
    throw new Error('calendar element not found');
  }

  renderTypeLegend(calendar);

  const leftBtn = calendar.querySelector('#prevMonth');
  const rightBtn = calendar.querySelector('#nextMonth');

  if (leftBtn === null || rightBtn === null) {
    throw new Error('calendar buttons not found');
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

  return container;
}

/**
 * 모달 생성. 구조는 assets/modal.html에 있고 여기서는 아이콘 경로만 채운다.
 */
async function createModal(): Promise<HTMLElement> {
  const doc = await loadTemplate('/assets/modal.html', {
    close: chrome.runtime.getURL('/assets/img-v2/close.svg'),
    externalLink: chrome.runtime.getURL('/assets/img-v2/external-link.svg'),
  });

  const modal = doc.querySelector<HTMLElement>('#plato-calendar-2-modal');

  if (modal === null) {
    throw new Error('modal element not found');
  }

  const closeBtn = modal.querySelector('.plato-calendar-2-modal-close');

  if (closeBtn === null) {
    throw new Error('modal close button not found');
  }

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  return modal;
}

async function initCalendar(targetContainer: HTMLElement) {
  const calendar: HTMLElement = await createCalendar();
  const calendarBody = calendar.querySelector('.calendar');

  if (calendarBody === null) return;

  // 모달은 .calendar를 기준으로 절대배치되므로 그 안에 넣는다.
  calendarBody.appendChild(await createModal());
  targetContainer.insertBefore(calendar, targetContainer.firstChild);
}

window.onload = async () => {
  const targetContainer: HTMLElement | null = document.querySelector('#page-content .ongoing-courses');
  if (targetContainer === null)
    return;
  await initCalendar(targetContainer);
  await syncCalendar();
};
