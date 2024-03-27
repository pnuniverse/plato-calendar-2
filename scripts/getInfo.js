/**
 * @enum {{ HOMEWORK: string, QUIZ: string, VIDEO: string, ZOOM: string }} ASSIGNMENT_TYPE
 */
export const ASSIGNMENT_TYPE = {
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
 * @property { string } courseId - 강의 id
 * @property { string } courseName - 강의명
 */
class Assignment {
  constructor(title, link, dueDate, type, isDone, courseId, courseName) {
    this.title = title;
    this.link = link;
    this.dueDate = dueDate;
    this.type = type;
    this.isDone = isDone;
    this.courseId = courseId;
    this.courseName = courseName;
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
            rows[i].querySelector('td.cell.c3')?.innerHTML === '제출 완료' ||
            rows[i].querySelector('td.cell.c3')?.innerHTML ===
              'Submitted for grading';

          if (title !== undefined) {
            result.push(
              new Assignment(
                title,
                link,
                dueDate,
                ASSIGNMENT_TYPE.HOMEWORK,
                isDone,
                courseId,
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
                courseId,
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
          const title = rows[i]
            .querySelector('td.text-left')
            ?.textContent.trim();
          const link = null;
          const dueDate = null;
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
                courseId,
              ),
            );
          }
        }
        resolve(result);
      })();
    });
  });

  const otherInfoPromises = courseIdList.map((courseId) => {
    const videoAssignmentsPromises = [];
    return new Promise((resolve) => {
      (async () => {
        const res = await fetch(
          `https://plato.pusan.ac.kr/mod/vod/index.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i].querySelector('.cell.c1 a')?.textContent.trim();
          const videoId = rows[i]
            .querySelector('.cell.c1 a')
            ?.href.split('id=')[1];
          if (videoId !== undefined) {
            const link = `https://plato.pusan.ac.kr/mod/vod/view.php?id=${videoId}`;
            videoAssignmentsPromises.push(
              new Promise((resolve2) => {
                fetch(link)
                  .then((response) => response.text())
                  .then((resp) => {
                    const d = parser.parseFromString(resp, 'text/html');
                    const date =
                      d.querySelectorAll('.vod_info_value')[1]?.textContent;

                    resolve2({
                      title,
                      link,
                      dueDate: new Date(date),
                    });
                  });
              }),
            );
          }
        }

        resolve(videoAssignmentsPromises);
      })();
    });
  });

  const assignments = (await Promise.all(promises)).flat();
  const videoAssignmentWithOtherInfo = (
    await Promise.all((await Promise.all(otherInfoPromises)).flat())
  ).flat();

  const result = [];

  videoAssignmentWithOtherInfo.forEach((item) => {
    const index = assignments.findIndex(
      (assignment) => assignment.title === item.title,
    );
    if (index !== -1) {
      result.push({
        ...assignments[index],
        link: item.link,
        dueDate: item.dueDate,
      });
      assignments.splice(index, 1);
    }
  });

  return result;
};

/**
 * zoom 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
const getZoomInfo = async (courseIdList) => {
  const promises = courseIdList.map((courseId) => {
    return new Promise((resolve) => {
      (async () => {
        const result = [];
        const res = await fetch(
          `https://plato.pusan.ac.kr/mod/zoom/index.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i]
            .querySelector('td.cell.c1 a')
            ?.textContent.trim();
          const link = `https://plato.pusan.ac.kr/mod/zoom/${rows[i].querySelector('td.cell.c1 a')?.href.split('pusan.ac.kr/')[1]}`;
          const dueDate = new Date(
            rows[i].querySelector('td.cell.c2')?.textContent,
          );
          const isDone = dueDate <= new Date();

          if (title !== undefined) {
            result.push(
              new Assignment(
                title,
                link,
                dueDate,
                ASSIGNMENT_TYPE.ZOOM,
                isDone,
                courseId,
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
 * 모든 과제(homework, quiz, video, zoom) 정보를 가져온다.
 * @returns { Promise<Assignment[]> }
 */
export const getInfo = async () => {
  const res = await fetch('https://plato.pusan.ac.kr');
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const courseLinkList = doc.querySelectorAll(
    '.my-course-lists > li > .course-box > a',
  );
  const courseNameNodes = doc.querySelectorAll(
    '.my-course-lists > li > .course-box > a .course-title h3',
  );

  const courseIdList = [];
  const courseNameList = [];
  for (let i = 0; i < courseLinkList.length; i += 1) {
    courseIdList.push(courseLinkList[i].href.split('?id=')[1]);
    courseNameList.push(courseNameNodes[i].textContent.split('(')[0].trim());
  }

  const result = await Promise.all([
    getHomeworkInfo(courseIdList),
    getQuizInfo(courseIdList),
    getVideoInfo(courseIdList),
    getZoomInfo(courseIdList),
  ]);
  const assignments = result.flat();

  assignments.map((assignment) => {
    if (
      assignment.dueDate.getHours() === 0 &&
      assignment.dueDate.getMinutes() === 0
    ) {
      assignment.dueDate.setDate(assignment.dueDate.getDate() - 1);
      assignment.dueDate.setHours(23);
      assignment.dueDate.setMinutes(59);
    }
    return assignment;
  });

  return assignments.map((assignment) => {
    return {
      ...assignment,
      courseName: courseNameList[courseIdList.indexOf(assignment.courseId)],
    };
  });
};
