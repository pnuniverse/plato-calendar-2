import Calendar from './common/components/Calendar';
import Loading from './loading';

window.onload = async () => {
  if (!document.getElementsByClassName('front-box front-box-pmooc').length)
    return;
  const selectedDate = new Date();
  const calendar = new Calendar(selectedDate);
  await calendar.initCalendar();
  Loading.show();
  calendar.loadCalendarData().then(() => {
    calendar.loadCalendarDate({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
    });
    Loading.hide();
  });
};
