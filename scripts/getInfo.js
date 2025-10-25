import Assignment from './domain/assignment/Assignment';
import getHomeworkInfo from './domain/homeWork/homeWork';
import getQuizInfo from './domain/quiz/quiz';
import getVideoInfo from './domain/video/video';
import getZoomInfo from './domain/zoom/zoom';

/**
 * 모든 과제(homework, quiz, video, zoom) 정보를 가져온다.
 * @returns { Promise<Assignment[]> }
 */
export default async function getInfo() {
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
}
