import HomeWork from '../../domain/homeWork/HomeWork';
import Quiz from '../../domain/quiz/Quiz';
import Video from '../../domain/video/Video';
import getInfo from '../../getInfo';
import Loading from '../../loading';
import ASSIGNMENT_TYPE from '../type/assignment.type';
import Modal from './Modal';

export default class Calendar {
  assignmentData = [];

  selectedDate;

  constructor(selectedDate) {
    this.selectedDate = selectedDate;
  }

  renderCell(cell, date) {
    const spanCell = document.createElement('span');
    const divCell = document.createElement('div');
    const dateData = this.assignmentData.filter(({ dueDate }) => {
      return (
        dueDate.getDate() === date &&
        dueDate.getMonth() === this.selectedDate.getMonth() &&
        dueDate.getFullYear() === this.selectedDate.getFullYear()
      );
    });
    const typeData = Object.groupBy(dateData, ({ type }) => type);
    const modal = new Modal();

    const homeWork = new HomeWork();
    const video = new Video();
    const quiz = new Quiz();

    // -- homework --
    homeWork.openHomeworkModal(typeData, modal, divCell);

    // -- video --
    video.openVideoModal(typeData, modal, divCell);

    // -- zoom --
    const zoom = typeData[ASSIGNMENT_TYPE.ZOOM] || [];
    const zoomDiv = document.createElement('div');

    if (zoom.length > 0) {
      const isDone = zoom.every((item) => item.isDone);
      zoomDiv.className = `calendar-content-week-icon ${isDone ? 'done-assignment' : 'zoom'}`;
      zoomDiv.innerText = `${zoom.filter((item) => item.isDone).length}/${zoom.length}`;
    } else zoomDiv.style.visibility = 'hidden';

    zoomDiv.addEventListener('click', () => modal.openModal(zoom));
    divCell.appendChild(zoomDiv);

    // -- quiz --
    quiz.openQuizModal(typeData, modal, divCell);

    spanCell.innerText = date;

    cell.appendChild(spanCell);
    cell.appendChild(divCell);
  }

  async loadCalendarDate({ year, month }) {
    const today = new Date();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay();

    const calendar = document.querySelectorAll('.calendar-content-week>li');
    for (let i = 0; i < calendar.length; i += 1) {
      calendar[i].innerHTML = '';
      calendar[i].style.backgroundColor = 'var(--backgroundColor)';
    }

    for (let i = startDay; i < lastDay.getDate() + startDay; i += 1) {
      this.renderCell(calendar[i], i - startDay + 1);
      if (
        i - startDay + 1 === today.getDate() &&
        month === today.getMonth() + 1 &&
        year === today.getFullYear()
      ) {
        calendar[i].style.backgroundColor = 'var(--borderColor)';
      } else calendar[i].style.backgroundColor = '#fff';
    }

    const disMonth = document.querySelector('#thisMonth');
    disMonth.innerText = `${year}년 ${month}월`;
  }

  setRenderBtn(time = 60) {
    const renderBtnText = document.querySelector('#re-rendering > div');
    let clock = Math.ceil(time);
    const timer = setInterval(() => {
      clock -= 1;
      renderBtnText.innerText = `동기화 (${clock})`;
      if (clock <= 0) {
        clearInterval(timer);
        renderBtnText.innerText = '동기화 (가능)';
      }
    }, 1000);
  }

  async reRenderCalendar() {
    Loading.show();

    const { asyncTimeJSON } = await chrome.storage.local.get('asyncTimeJSON');
    if (
      !asyncTimeJSON ||
      (asyncTimeJSON && new Date() - new Date(asyncTimeJSON) > 1000 * 60)
    ) {
      const info = await getInfo();
      this.assignmentData = info;
      await chrome.storage.local.set({
        asyncTimeJSON: new Date().toJSON(),
        info: JSON.stringify(info),
      });
      this.setRenderBtn();
      await this.loadCalendarDate({
        year: this.selectedDate.getFullYear(),
        month: this.selectedDate.getMonth() + 1,
      });
      Loading.hide();
      return;
    }

    const { info } = await chrome.storage.local.get('info');

    this.assignmentData = JSON.parse(info);
    this.assignmentData = this.assignmentData.map((data) => {
      return { ...data, dueDate: new Date(data.dueDate) };
    });

    await this.loadCalendarDate({
      year: this.selectedDate.getFullYear(),
      month: this.selectedDate.getMonth() + 1,
    });
    Loading.hide();
  }

  async createCalendar() {
    const domparser = new DOMParser();
    const calendarURL = chrome.runtime.getURL('/assets/calendar.html');

    return new Promise((reslove, reject) => {
      fetch(calendarURL)
        .then(async (data) => {
          const leftImg = chrome.runtime.getURL('/assets/img/left.png');
          const rightImg = chrome.runtime.getURL('/assets/img/right.png');
          const homeWorkImg = chrome.runtime.getURL('/assets/img/homework.png');
          const videoImg = chrome.runtime.getURL('/assets/img/video.png');
          const quizImg = chrome.runtime.getURL('/assets/img/quiz.png');
          const zoomImg = chrome.runtime.getURL('/assets/img/zoom.png');
          const loadingImg = chrome.runtime.getURL('/assets/img/loading.png');

          return (await data.text())
            .replace('{left}', leftImg)
            .replace('{right}', rightImg)
            .replaceAll('{homework}', homeWorkImg)
            .replaceAll('{video}', videoImg)
            .replaceAll('{quiz}', quizImg)
            .replaceAll('{zoom}', zoomImg)
            .replace('{loading}', loadingImg);
        })
        .then((text) => {
          const doc = domparser.parseFromString(text, 'text/html');
          const toggle = document.createElement('details');
          const summary = document.createElement('summary');
          const calendar = doc.querySelector('.calendar');

          const leftBtn = calendar.querySelector('#prevMonth');
          const rightBtn = calendar.querySelector('#nextMonth');
          const reRenderBtn = calendar.querySelector('#re-rendering');

          leftBtn.addEventListener('click', () => {
            this.selectedDate.setDate(1);
            this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
            this.loadCalendarDate({
              year: this.selectedDate.getFullYear(),
              month: this.selectedDate.getMonth() + 1,
            });
          });
          rightBtn.addEventListener('click', () => {
            this.selectedDate.setDate(1);
            this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
            this.loadCalendarDate({
              year: this.selectedDate.getFullYear(),
              month: this.selectedDate.getMonth() + 1,
            });
          });
          reRenderBtn.addEventListener('click', () => {
            this.reRenderCalendar();
          });

          summary.innerText = 'Plato Calendar 2';
          toggle.appendChild(summary);
          toggle.appendChild(calendar);
          toggle.id = 'plato_calendar-container';
          // toggle "Plato Calendar" 생성

          const root = document.querySelector('.front-box');
          root.insertBefore(toggle, root.firstChild);
          reslove();
        })
        .catch((error) => {
          console.log('error: ', error);
          reject();
        });
    });
  }

  async initCalendar() {
    await this.createCalendar();
  }

  async loadCalendarData() {
    const { asyncTimeJSON } = await chrome.storage.local.get('asyncTimeJSON');
    if (
      !asyncTimeJSON ||
      (asyncTimeJSON && new Date() - new Date(asyncTimeJSON) > 1000 * 60 * 60)
    ) {
      const info = await getInfo();
      this.assignmentData = info;
      await chrome.storage.local.set({
        asyncTimeJSON: new Date().toJSON(),
        info: JSON.stringify(info),
      });
      this.setRenderBtn(60);
      return;
    }

    const { info } = await chrome.storage.local.get('info');

    this.assignmentData = JSON.parse(info);
    this.assignmentData = this.assignmentData.map((data) => {
      return { ...data, dueDate: new Date(data.dueDate) };
    });

    await chrome.storage.local.set({
      asyncTimeJSON,
      info: JSON.stringify(this.assignmentData),
    });

    const timeInterval = (new Date() - new Date(asyncTimeJSON)) / 1000;
    this.setRenderBtn(timeInterval > 60 ? 0 : 60 - timeInterval);
  }
}
