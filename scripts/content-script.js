import sidePanel from './side-panel';
import getInfo from './getInfo';

console.log('content-script.js loaded');
sidePanel();
getInfo();

window.onload = () => {
  const container = document.createElement('div');
  container.id = 'plato_calendar-container';
  container.innerText = 'Plato Calendar 2';
  const root = document.querySelector('.front-box');
  root.insertBefore(container, root.firstChild);
};
