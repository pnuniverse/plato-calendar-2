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
 * @returns { Assignment[] }
 */
const getHomeworkInfo = () => {
  return [];
};

/**
 * quiz 정보를 가져온다.
 * @returns { Assignment[] }
 */
const getQuizInfo = () => [];

/**
 * video 정보를 가져온다.
 * @returns { Assignment[] }
 */
const getVideoInfo = () => [];

/**
 * zoom 정보를 가져온다.
 * @returns { Assignment[] }
 */
const getZoomInfo = () => [];

/**
 * 모든 과제(homework, quiz, video, zoom) 정보를 가져온다.
 * @returns { Assignment[] }
 */
const getInfo = () => {
  console.log('getInfo() called');

  return [
    ...getHomeworkInfo(),
    ...getQuizInfo(),
    ...getVideoInfo(),
    ...getZoomInfo(),
  ];
};

export default getInfo;
