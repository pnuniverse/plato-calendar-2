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
 * @property { string } content - 과제 내용
 * @property { string } link - 과제 링크
 * @property { Date } dueDate - 과제 마감일
 * @property { string } type - 과제 유형 (homework, quiz, video, zoom)
 * @property { boolean } isDone - 과제 완료 여부
 */
class Assignment {
  constructor(title, content, link, dueDate, type, isDone) {
    this.title = title;
    this.content = content;
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
            const content = '임시 데이터';
            result.push(
              new Assignment(
                title,
                content,
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
 * @returns { Promise<Assignment[]> }
 */
const getQuizInfo = () => [];

/**
 * video 정보를 가져온다.
 * @returns { Promise<Assignment[]> }
 */
const getVideoInfo = () => [];

/**
 * zoom 정보를 가져온다.
 * @returns { Promise<Assignment[]> }
 */
const getZoomInfo = () => [];

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
    '.my-course-lists > .course-label-r > .course-box > a',
  );
  const courseIdList = [];
  for (let i = 0; i < courseLinkList.length; i += 1) {
    courseIdList.push(courseLinkList[i].href.split('?id=')[1]);
  }

  console.log(`my courseIdList: ${courseIdList.toString()}`);

  return [
    ...(await getHomeworkInfo(courseIdList)),
    ...(await getQuizInfo(courseIdList)),
    ...(await getVideoInfo(courseIdList)),
    ...(await getZoomInfo(courseIdList)),
  ];
};

export default getInfo;
