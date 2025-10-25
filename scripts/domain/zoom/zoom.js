import ASSIGNMENT_TYPE from '../../type/assignment.type';
import Assignment from '../assignment/Assignment';

/**
 * zoom 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
export default async function getZoomInfo(courseIdList) {
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
}
