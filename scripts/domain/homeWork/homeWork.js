import ASSIGNMENT_TYPE from '../../type/assignment.type';
import Assignment from '../assignment/Assignment';

/**
 * homework 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
export default async function getHomeworkInfo(courseIdList) {
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
}
