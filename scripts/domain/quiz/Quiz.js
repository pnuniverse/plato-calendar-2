import ASSIGNMENT_TYPE from '../../common/type/assignment.type';
import Assignment from '../assignment/Assignment';

/**
 * quiz 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */

export default class Quiz {
  async getQuizInfo(courseIdList) {
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
  }

  openQuizModal(typeData, modal, divCell) {
    const quiz = typeData[ASSIGNMENT_TYPE.QUIZ] || [];
    const quizDiv = document.createElement('div');

    if (quiz.length > 0) {
      const isDone = quiz.every((item) => item.isDone);
      quizDiv.className = `calendar-content-week-icon ${isDone ? 'done-assignment' : 'quiz'}`;
      quizDiv.innerText = `${quiz.filter((item) => item.isDone).length}/${quiz.length}`;
    } else quizDiv.style.visibility = 'hidden';

    quizDiv.addEventListener('click', () => modal.openModal(quiz));
    divCell.appendChild(quizDiv);
  }
}
