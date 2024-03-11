class Loading {
  static show() {
    const loader = document.createElement('span');
    loader.className = 'loader';
    document.querySelector('.calendar-content').appendChild(loader);
  }

  static hide() {
    document.querySelector('.loader').remove();
  }
}

export default Loading;
