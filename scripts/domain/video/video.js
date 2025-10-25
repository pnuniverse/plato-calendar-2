import ASSIGNMENT_TYPE from '../../common/type/assignment.type';
import Assignment from '../assignment/Assignment';

/**
 * video 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
export default async function getVideoInfo(courseIdList) {
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
}
