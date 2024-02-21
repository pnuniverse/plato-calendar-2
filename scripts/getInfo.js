/**
 * @enum {{ HOMEWORK: string, QUIZ: string, VIDEO: string, ZOOM: string }} ASSIGNMENT_TYPE
 */
const ASSIGNMENT_TYPE = {
  HOMEWORK: 'homework',
  QUIZ: 'quiz',
  VIDEO: 'video',
  ZOOM: 'zoom',
};

/**
 * 과제 정보를 담는 클래스
 * @class Assignment
 * @property { string } title - 과제 제목
 * @property { string } link - 과제 링크
 * @property { Date } dueDate - 과제 마감일
 * @property { string } type - 과제 유형 (homework, quiz, video, zoom)
 * @property { boolean } isDone - 과제 완료 여부
 */
class Assignment {
  constructor(title, link, dueDate, type, isDone) {
    this.title = title;
    this.link = link;
    this.dueDate = dueDate;
    this.type = type;
    this.isDone = isDone;
  }
}

/**
 * homework 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
const getHomeworkInfo = async (courseIdList) => {
  const promises = courseIdList.map((courseId) => {
    return new Promise((resolve) => {
      (async () => {
        const result = [];
        const res = await fetch(
          `https://plato.pusan.ac.kr/mod/assign/index.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i].querySelector('td.cell.c1 a')?.innerHTML;
          const link = rows[i].querySelector('td.cell.c1 a')?.href;
          const dueDate = new Date(
            rows[i].querySelector('td.cell.c2')?.innerHTML,
          );
          const isDone =
            rows[i].querySelector('td.cell.c3')?.innerHTML === '제출 완료';

          if (title !== undefined) {
            result.push(
              new Assignment(
                title,
                link,
                dueDate,
                ASSIGNMENT_TYPE.HOMEWORK,
                isDone,
              ),
            );
          }
        }
        resolve(result);
      })();
    });
  });

  const result = await Promise.all(promises);
  return result.flat();
};

/**
 * quiz 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
const getQuizInfo = async (courseIdList) => {
  const promises = courseIdList.map((courseId) => {
    return new Promise((resolve) => {
      (async () => {
        const result = [];
        const res = await fetch(
          `https://plato.pusan.ac.kr/mod/quiz/index.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i].querySelector('td.cell.c1 a')?.innerHTML;
          const link = `https://plato.pusan.ac.kr/mod/quiz/${rows[i].querySelector('td.cell.c1 a')?.href.split('pusan.ac.kr/')[1]}`;
          const dueDate = new Date(
            rows[i].querySelector('td.cell.c2')?.innerHTML,
          );
          const isDone =
            rows[i].querySelector('td.cell.c3')?.textContent !== '' ||
            dueDate <= new Date();

          if (title !== undefined) {
            result.push(
              new Assignment(
                title,
                link,
                dueDate,
                ASSIGNMENT_TYPE.QUIZ,
                isDone,
              ),
            );
          }
        }
        resolve(result);
      })();
    });
  });

  const result = await Promise.all(promises);
  return result.flat();
};

/**
 * video 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
const getVideoInfo = async (courseIdList) => {
  const promises = courseIdList.map((courseId) => {
    return new Promise((resolve) => {
      (async () => {
        const result = [];
        const res = await fetch(
          `https://plato.pusan.ac.kr/report/ubcompletion/user_progress_a.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('.user_progress_table tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i].querySelector('td.text-left')?.textContent;
          // const link = rows[i].querySelector('td.text-left img')?.href;
          // const dueDate = new Date();

          /**
           * @todo link, dueDate 정보 가져오기
           */
          const link = courseId;
          const dueDate = new Date();

          const isDone = Array.from(
            rows[i].querySelectorAll('td.text-center'),
          ).some((td) => td.textContent === 'O');

          if (title !== undefined) {
            result.push(
              new Assignment(
                title,
                link,
                dueDate,
                ASSIGNMENT_TYPE.VIDEO,
                isDone,
              ),
            );
          }
        }
        resolve(result);
      })();
    });
  });

  const result = await Promise.all(promises);
  return result.flat();
};

/**
 * zoom 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
const getZoomInfo = async (courseIdList) => [];

/**
 * 모든 과제(homework, quiz, video, zoom) 정보를 가져온다.
 * @returns { Promise<Assignment[]> }
 */
const getInfo = async () => {
  const res = await fetch('https://plato.pusan.ac.kr');
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const courseLinkList = doc.querySelectorAll(
    '.my-course-lists > li > .course-box > a',
  );

  const courseIdList = [];
  for (let i = 0; i < courseLinkList.length; i += 1) {
    courseIdList.push(courseLinkList[i].href.split('?id=')[1]);
  }

  console.log(`my courseIdList: ${courseIdList.toString()}`);

  const result = await Promise.all([
    getHomeworkInfo(courseIdList),
    getQuizInfo(courseIdList),
    getVideoInfo(courseIdList),
    getZoomInfo(courseIdList),
  ]);
  return result.flat();
};

export default getInfo;
