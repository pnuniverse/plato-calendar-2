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
export default class Assignment {
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
