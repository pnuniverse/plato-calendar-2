export const ASSIGNMENT_TYPE = {
  HOMEWORK: 'homework',
  QUIZ: 'quiz',
  VIDEO: 'video',
  ZOOM: 'zoom',
} as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPE)[keyof typeof ASSIGNMENT_TYPE];

export class Assignment {
  constructor(
    public title: string,
    public link: string | null,
    public dueDate: Date | null,
    public type: AssignmentType,
    public isDone: boolean,
    public courseId: string,
    public courseName?: string,
  ) {}
}

/**
 * homework 정보를 가져온다.
 * @param { string[] } courseIdList - 과목 id 리스트
 * @returns { Promise<Assignment[]> }
 */
const getHomeworkInfo = async (courseIdList: string[]): Promise<Assignment[]> => {
  const promises: Array<Promise<Assignment[]>> = courseIdList.map((courseId) => {
    return new Promise<Assignment[]>((resolve) => {
      (async () => {
        const result: Assignment[] = [];
        const res = await fetch(
          `https://plato.pusan.ac.kr/mod/assign/index.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i].querySelector('td.cell.c1 a')?.innerHTML;
          const link = rows[i].querySelector<HTMLAnchorElement>('td.cell.c1 a')?.href;
          const dueDateText = rows[i].querySelector('td.cell.c2')?.innerHTML;
          const dueDate = new Date(dueDateText ?? '');
          const statusText = rows[i].querySelector('td.cell.c3')?.innerHTML;
          const isDone =
            statusText === '제출 완료' || statusText === 'Submitted for grading';

          if (title !== undefined && link !== undefined) {
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
 */
const getQuizInfo = async (courseIdList: string[]): Promise<Assignment[]> => {
  const promises = courseIdList.map((courseId) => {
    return new Promise<Assignment[]>((resolve) => {
      (async () => {
        const result: Assignment[] = [];
        const res = await fetch(
          `https://plato.pusan.ac.kr/mod/quiz/index.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i].querySelector('td.cell.c1 a')?.innerHTML;
          const anchor = rows[i].querySelector<HTMLAnchorElement>('td.cell.c1 a');
          const href = anchor?.href ?? '';
          const link = `https://plato.pusan.ac.kr/mod/quiz/${href.split('pusan.ac.kr/')[1] ?? ''}`;
          const dueDateText = rows[i].querySelector('td.cell.c2')?.innerHTML;
          const dueDate = new Date(dueDateText ?? '');
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


type VideoExtraInfo = {
  title: string;
  link: string;
  dueDate: Date;
};

/**
 * video 정보를 가져온다.
 */
const getVideoInfo = async (courseIdList: string[]): Promise<Assignment[]> => {
  const promises = courseIdList.map((courseId) => {
    return new Promise<Assignment[]>((resolve) => {
      (async () => {
        const result: Assignment[] = [];
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
          const isDone = Array.from(
            rows[i].querySelectorAll('td.text-center'),
          ).some((td) => td.textContent === 'O');
          if (title !== undefined) {
            result.push(
              new Assignment(
                title,
                null,
                null,
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
    const videoAssignmentsPromises: Promise<VideoExtraInfo>[] = [];
    return new Promise<Promise<VideoExtraInfo>[]>((resolve) => {
      (async () => {
        const res = await fetch(
          `https://plato.pusan.ac.kr/mod/vod/index.php?id=${courseId}`,
        );
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i += 1) {
          const title = rows[i].querySelector('.cell.c1 a')?.textContent?.trim();
          const videoId = rows[i].querySelector<HTMLAnchorElement>('.cell.c1 a')?.href.split('id=')[1];
          
          if (videoId !== undefined && title !== undefined) {
            const link = `https://plato.pusan.ac.kr/mod/vod/view.php?id=${videoId}`;
            videoAssignmentsPromises.push(
              new Promise<VideoExtraInfo>((resolve2) => {
                fetch(link)
                  .then((response) => response.text())
                  .then((resp) => {
                    const d = parser.parseFromString(resp, 'text/html');
                    const date =
                      d.querySelectorAll('.vod_info_value')[1]?.textContent ?? '';

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

  const result: Assignment[] = [];

  videoAssignmentWithOtherInfo.forEach((item) => {
    const index = assignments.findIndex(
      (assignment) => assignment.title === item.title,
    );
    if (index !== -1) {
      result.push(
        new Assignment(
          assignments[index].title,
          item.link,
          item.dueDate,
          assignments[index].type,
          assignments[index].isDone,
          assignments[index].courseId,
        ),
      );
      assignments.splice(index, 1);
    }
  });

  return result;
};

/**
 * zoom 정보를 가져온다.
 */
const getZoomInfo = async (courseIdList: string[]): Promise<Assignment[]> => {
  const promises = courseIdList.map((courseId) => {
    return new Promise<Assignment[]>((resolve) => {
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
          const link = `https://plato.pusan.ac.kr/mod/zoom/${rows[i].querySelector<HTMLAnchorElement>('td.cell.c1 a')?.href.split('pusan.ac.kr/')[1]}`;
          const dueDateText = rows[i].querySelector('td.cell.c2')?.textContent ?? '';
          const dueDate = new Date(dueDateText);
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
export const getInfo = async (): Promise<Assignment[]> => {
  const res = await fetch('https://plato.pusan.ac.kr');
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const courseLinkList = doc.querySelectorAll<HTMLAnchorElement>(
    '.my-course-lists > li > .course-box > a',
  );
  const courseNameNodes = doc.querySelectorAll(
    '.my-course-lists > li > .course-box > a .course-title h3',
  );

  const courseIdList: string[] = [];
  const courseNameList: string[] = [];
  for (let i = 0; i < courseLinkList.length; i += 1) {
    const id = courseLinkList[i].href.split('?id=')[1];
    const name = courseNameNodes[i].textContent?.split('(')[0].trim() ?? '';
    courseIdList.push(id);
    courseNameList.push(name);
  }

  const result = await Promise.all([
    getHomeworkInfo(courseIdList),
    getQuizInfo(courseIdList),
    getVideoInfo(courseIdList),
    getZoomInfo(courseIdList),
  ]);
  const assignments = result.flat();

  assignments.forEach((assignment) => {
    if (
      assignment.dueDate !== null &&
      assignment.dueDate.getHours() === 0 &&
      assignment.dueDate.getMinutes() === 0
    ) {
      assignment.dueDate.setDate(assignment.dueDate.getDate() - 1);
      assignment.dueDate.setHours(23);
      assignment.dueDate.setMinutes(59);
    }
  });

  return assignments.map((assignment) => {
    return {
      ...assignment,
      courseName: courseNameList[courseIdList.indexOf(assignment.courseId)],
    };
  });
};
