/**
 * 학습활동 유형. 값은 활동유형 칩에 표시되는 이름이자
 * assets/img-v2 의 아이콘 파일명과 같다.
 */
export const ASSIGNMENT_TYPE = {
  URL: 'URL',
  ZOOM: 'Zoom',
  BOARD: '게시판',
  HOMEWORK: '과제',
  VIDEO: '동영상',
  SURVEY: '설문조사',
  QUIZ: '시험',
  WIKI: '위키',
  ELEARNING: '이러닝콘텐츠',
  DISCUSSION: '토론',
  VOTE: '투표',
  TEAM_EVALUATION: '팀플평가',
  FILE: '파일',
  FOLDER: '폴더',
} as const;

/**
 * 학습활동 유형.
 * 개편된 플라토는 활동 유형이 계속 늘어날 수 있어
 * 고정된 4종이 아닌 페이지에 표시된 이름을 그대로 사용한다.
 */
export type AssignmentType = string;

export class Assignment {
  constructor(
    public title: string,
    public link: string | null,
    public dueDate: Date | null,
    public type: AssignmentType,
    public isDone: boolean,
    public courseId: string,
    public week: number | null,
    public courseName?: string,
  ) {}
}

export class Course {
  constructor(
    public courseId: string,
    public courseName: string,
  ) {}
}

const ACTIVITIES_URL =
  'https://plato.pusan.ac.kr/local/ubion/course/activities.php';

/**
 * 학습활동 모아보기 페이지의 행 하나를 Assignment로 변환한다.
 * 이 페이지에는 마감일/제출여부가 없으므로 각각 null, false로 둔다.
 * @param { Element } row - table.table-activities 의 tr 요소
 * @param { Course } course - 해당 행이 속한 과목
 * @returns { Assignment | null } - 변환에 실패하면 null
 */
const parseActivityRow = (row: Element, course: Course): Assignment | null => {
  const anchor = row.querySelector<HTMLAnchorElement>('td a[href]');
  const title = anchor?.textContent?.trim();

  if (anchor === null || anchor === undefined || !title) return null;

  // 활동유형 칩에 표시된 이름(시험, URL, 파일 ...)을 우선 사용한다.
  // assets/img-v2 의 아이콘 파일명이 이 이름을 따른다.
  const type =
    row.querySelector('.activity-chip')?.textContent?.trim() ||
    row.getAttribute('data-modname')?.trim() ||
    '';

  // 주차 칸은 'N주차' 형식이다. 숫자를 못 찾으면 null로 둔다.
  const weekNumber = Number.parseInt(
    row.querySelector('.td-printtype')?.textContent?.trim() ?? '',
    10,
  );
  const week = Number.isNaN(weekNumber) ? null : weekNumber;

  return new Assignment(
    title,
    anchor.href,
    null,
    type,
    false,
    course.courseId,
    week,
    course.courseName,
  );
};

/**
 * 과목 하나의 학습활동 모아보기 페이지에서 모든 활동을 가져온다.
 * @param { Course } course - 과목 정보
 * @returns { Promise<Assignment[]> }
 */
const getCourseActivities = async (course: Course): Promise<Assignment[]> => {
  const res = await fetch(`${ACTIVITIES_URL}?id=${course.courseId}`);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const rows = doc.querySelectorAll('table.table-activities tbody tr');

  const result: Assignment[] = [];
  rows.forEach((row) => {
    const assignment = parseActivityRow(row, course);
    if (assignment !== null) result.push(assignment);
  });

  return result;
};

const ACTIVITY_DETAIL_CACHE_KEY = 'activityDetailCache';

/** 활동 상태가 완료일 때 상세 페이지에 표시되는 문구. */
const COMPLETED_TEXT = '완료';

/** 기간이 표시되지 않는 활동 유형. 상세 페이지를 조회하지 않는다. */
const NO_PERIOD_TYPES = new Set([ASSIGNMENT_TYPE.URL.toLowerCase()]);

/** 상세 페이지에서 읽어오는 정보. */
type ActivityDetail = {
  dueDate: Date | null;
  isDone: boolean;
};

/** 학습활동 주소 -> 조회해둔 상세 정보. dueDate는 JSON 문자열로 저장한다. */
type ActivityDetailCache = Record<string, { dueDate: string | null; isDone: boolean }>;

/**
 * 저장해둔 상세 정보 캐시를 불러온다.
 * @returns { Promise<ActivityDetailCache> } - 저장된 값이 없거나 형식이 다르면 빈 객체
 */
const loadDetailCache = async (): Promise<ActivityDetailCache> => {
  const stored = await chrome.storage.local.get(ACTIVITY_DETAIL_CACHE_KEY);
  const cache: unknown = stored[ACTIVITY_DETAIL_CACHE_KEY];

  if (cache === null || typeof cache !== 'object' || Array.isArray(cache))
    return {};

  return cache as ActivityDetailCache;
};

/**
 * 캐시에 저장된 값을 Date로 되돌린다.
 * @param { string | null | undefined } cached - 캐시에 저장된 값
 * @returns { Date | null } - 마감일이 없거나 형식이 깨졌으면 null
 */
const parseCachedDueDate = (cached: string | null | undefined): Date | null => {
  if (typeof cached !== 'string') return null;

  const dueDate = new Date(cached);
  return Number.isNaN(dueDate.getTime()) ? null : dueDate;
};

/**
 * 학습활동 상세 페이지에서 마감일과 완료 여부를 가져온다.
 * 기간이 표시된 활동에만 .timeclose(종료 일시)가 있고,
 * 활동 상태는 #csms-mod-completion 에 '완료' / '미완료'로 표시된다.
 * @param { string } link - 학습활동 상세 페이지 주소
 * @returns { Promise<ActivityDetail> }
 */
const getActivityDetail = async (link: string): Promise<ActivityDetail> => {
  const res = await fetch(link);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  const timeclose = doc.querySelector('.timeclose')?.textContent?.trim();
  const dueDate = timeclose ? new Date(timeclose) : null;
  // '미완료'도 '완료'를 포함하므로 부분 일치가 아닌 정확히 비교한다.
  const completion = doc
    .querySelector('#csms-mod-completion .text')
    ?.textContent?.trim();

  return {
    dueDate: dueDate === null || Number.isNaN(dueDate.getTime()) ? null : dueDate,
    isDone: completion === COMPLETED_TEXT,
  };
};

/**
 * 각 학습활동의 마감일과 완료 여부를 채운다.
 * 완료로 확인된 활동은 상태가 되돌아가지 않으므로 캐시를 그대로 쓰고,
 * 그 외에는 완료 여부가 바뀌었을 수 있으므로 상세 페이지를 다시 조회한다.
 * @param { Assignment[] } assignments - 정보를 채울 학습활동 리스트
 */
const fillActivityDetails = async (assignments: Assignment[]): Promise<void> => {
  const cache = await loadDetailCache();
  const nextCache: ActivityDetailCache = {};

  await Promise.all(
    assignments.map(async (assignment) => {
      const { link, type } = assignment;
      if (link === null || NO_PERIOD_TYPES.has(type.toLowerCase())) return;

      const cached = cache[link];
      if (cached?.isDone === true) {
        nextCache[link] = cached;
        assignment.dueDate = parseCachedDueDate(cached.dueDate);
        assignment.isDone = true;
        return;
      }

      try {
        const detail = await getActivityDetail(link);
        nextCache[link] = {
          dueDate: detail.dueDate?.toJSON() ?? null,
          isDone: detail.isDone,
        };
        assignment.dueDate = detail.dueDate;
        assignment.isDone = detail.isDone;
      } catch {
        // 조회에 실패한 활동은 캐시하지 않고 다음 동기화에서 다시 시도한다.
      }
    }),
  );

  // 사라진 활동은 nextCache에 담기지 않으므로 캐시가 무한정 늘어나지 않는다.
  await chrome.storage.local.set({ [ACTIVITY_DETAIL_CACHE_KEY]: nextCache });
  // 마감일만 담던 이전 캐시를 정리한다.
  await chrome.storage.local.remove('dueDateCache');
};

/**
 * 모든 과목의 학습활동 정보를 마감일/완료 여부와 함께 가져온다.
 * @param { Course[] } courses - 과목 리스트
 * @returns { Promise<Assignment[]> }
 */
export const getAssignmentInfo = async (
  courses: Course[],
): Promise<Assignment[]> => {
  const result = await Promise.all(courses.map(getCourseActivities));
  const assignments = result.flat();

  await fillActivityDetails(assignments);

  return assignments;
};

const COURSE_CARD_SELECTOR = '.ongoing-courses li a';
const COURSE_CARD_TIMEOUT = 10000;

/**
 * 선택자에 해당하는 요소가 나타날 때까지 기다린다.
 * @param { string } selector - 기다릴 요소의 선택자
 * @param { number } timeout - 최대 대기 시간(ms)
 * @returns { Promise<NodeListOf<T>> } - 시간이 초과되면 그 시점의 조회 결과
 */
const waitForElements = <T extends Element>(
  selector: string,
  timeout: number,
): Promise<NodeListOf<T>> =>
  new Promise((resolve) => {
    const elements = document.querySelectorAll<T>(selector);
    if (elements.length > 0) {
      resolve(elements);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const observer = new MutationObserver(() => {
      const found = document.querySelectorAll<T>(selector);
      if (found.length === 0) return;

      observer.disconnect();
      clearTimeout(timer);
      resolve(found);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 끝내 나타나지 않더라도 동기화가 영영 멈추지 않도록 한다.
    timer = setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelectorAll<T>(selector));
    }, timeout);
  });

/**
 * 수강 중인 과목 정보를 가져온다.
 * 강의 목록은 페이지가 로드된 뒤 스크립트가 채우므로 나타날 때까지 기다린다.
 * @returns { Promise<Course[]> }
 */
const getCourseInfo = async (): Promise<Course[]> => {
  const courseCards = await waitForElements<HTMLAnchorElement>(
    COURSE_CARD_SELECTOR,
    COURSE_CARD_TIMEOUT,
  );

  const courses = new Map<string, Course>();
  courseCards.forEach((el) => {
    const courseId = el.href.split('?id=')[1];
    const courseName = el.querySelector('h5')?.textContent?.trim() ?? '';

    // 캐러셀이 복제한 슬라이드 때문에 같은 강의가 여러 번 나올 수 있다.
    if (courseId !== undefined && !courses.has(courseId))
      courses.set(courseId, new Course(courseId, courseName));
  });

  return [...courses.values()];
};

const ASSIGNMENTS_CACHE_KEY = 'assignmentsCache';

/** 조회 결과를 재사용하는 시간. 이 시간 안에는 다시 크롤링하지 않는다. */
const ASSIGNMENTS_CACHE_TTL = 1000 * 60 * 5;

/** 저장 형태. Date는 그대로 담기지 않으므로 dueDate만 JSON 문자열로 바꾼다. */
type CachedAssignments = {
  fetchedAt: string;
  assignments: Array<Omit<Assignment, 'dueDate'> & { dueDate: string | null }>;
};

/**
 * 저장해둔 학습활동 조회 결과를 불러온다.
 * @returns { Promise<Assignment[] | null> } - 저장된 값이 없거나 5분이 지났으면 null
 */
const loadCachedAssignments = async (): Promise<Assignment[] | null> => {
  const stored = await chrome.storage.local.get(ASSIGNMENTS_CACHE_KEY);
  const cache: unknown = stored[ASSIGNMENTS_CACHE_KEY];

  if (cache === null || typeof cache !== 'object' || Array.isArray(cache))
    return null;

  const { fetchedAt, assignments } = cache as Partial<CachedAssignments>;
  if (typeof fetchedAt !== 'string' || !Array.isArray(assignments)) return null;

  // 기기 시간이 되돌아간 경우도 만료로 본다.
  const elapsed = Date.now() - new Date(fetchedAt).getTime();
  if (Number.isNaN(elapsed) || elapsed < 0 || elapsed > ASSIGNMENTS_CACHE_TTL)
    return null;

  return assignments.map((assignment) => ({
    ...assignment,
    dueDate: parseCachedDueDate(assignment.dueDate),
  }));
};

/**
 * 학습활동 조회 결과를 조회 시각과 함께 저장한다.
 * @param { Assignment[] } assignments - 저장할 학습활동 리스트
 */
const saveAssignments = async (assignments: Assignment[]): Promise<void> => {
  const cache: CachedAssignments = {
    fetchedAt: new Date().toJSON(),
    assignments: assignments.map((assignment) => ({
      ...assignment,
      dueDate: assignment.dueDate?.toJSON() ?? null,
    })),
  };

  await chrome.storage.local.set({ [ASSIGNMENTS_CACHE_KEY]: cache });
};

/**
 * 모든 과목의 모든 학습활동 정보를 가져온다.
 * 마지막 조회로부터 5분이 지나지 않았으면 저장해둔 결과를 그대로 돌려준다.
 * @returns { Promise<Assignment[]> }
 */
export const getInfo = async (): Promise<Assignment[]> => {
  const cached = await loadCachedAssignments();
  if (cached !== null) return cached;

  const courses = await getCourseInfo();
  const assignments = await getAssignmentInfo(courses);

  await saveAssignments(assignments);

  return assignments;
};
