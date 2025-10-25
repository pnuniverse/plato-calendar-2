class Modal {
  createModalContent(assignment) {
    const link = document.createElement('a');
    const img = document.createElement('img');
    const contentDiv = document.createElement('div');
    let typeImg = chrome.runtime.getURL(`/assets/img/${assignment.type}.png`);
    if (assignment.isDone)
      typeImg = chrome.runtime.getURL(`/assets/img/${assignment.type}Done.png`);

    link.className = 'modal-content-card';
    if (assignment.isDone) link.classList.add('done-modal-card');
    link.href = assignment.link;
    link.target = '_blank';
    img.src = typeImg;
    img.alt = `${assignment.type} icon`;
    contentDiv.innerHTML = `
      <div style="overflow:hidden">${assignment.title}</div>
      <div style="overflow:hidden">${assignment.courseName}</div>
      <div> 마감일 ${assignment.dueDate.getFullYear()}-${assignment.dueDate.getMonth() + 1}-${assignment.dueDate.getDate()}  ${assignment.dueDate.getHours().toString().padStart(2, '0')}:${assignment.dueDate.getMinutes().toString().padStart(2, '0')}</div>
    `;
    link.appendChild(img);
    link.appendChild(contentDiv);
    return link;
  }

  openModal(data) {
    const modal = document.querySelector('#calendarModal');
    const modalContent = document.querySelector('.modal-content');
    const closeBtn = document.createElement('span');
    const DoneData = data.filter((item) => item.isDone);
    const NotDoneData = data.filter((item) => !item.isDone);

    modalContent.innerHTML = '';
    closeBtn.className = 'modal-content-header';
    closeBtn.innerText = 'x';
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    modalContent.appendChild(closeBtn); // 닫기 버튼 추가

    NotDoneData.forEach((assignment) => {
      const linkObj = this.createModalContent(assignment);
      modalContent.appendChild(linkObj);
    });
    DoneData.forEach((assignment) => {
      const linkObj = this.createModalContent(assignment);
      modalContent.appendChild(linkObj);
    });
    modal.style.display = 'flex';
  }
}

export default Modal;
