/* eslint-disable */

const showAlert = (message, type) => {
  hideAlert();
  const html = `<div class='alert alert--${type}'>${message}</div>`;
  document.body.insertAdjacentHTML('afterbegin', html);
  window.setTimeout(hideAlert, 4000);
};

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.remove();
};
