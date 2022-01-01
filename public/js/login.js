/* eslint-disable */

const loginForm = document.querySelector('.form');
const logoutButton = document.getElementById('logout');

console.log(logoutButton);

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'Success') {
      showAlert('User logged in succesfully.', 'success');
      setTimeout(() => {
        location.assign('/');
      }, 2000);
    }
  } catch (e) {
    showAlert(e.response.data.message, 'error');
  }
};

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (email && password) login(email, password);
  });

if (logoutButton)
  logoutButton.addEventListener('click', async () => {
    try {
      const res = await axios({
        method: 'GET',
        url: '/api/v1/users/logout',
      });
      if (res.data.status === 'Success') {
        showAlert('User logged out successfully.', 'success');
      }
    } catch (e) {
      console.log(e);
      showAlert('Error logging out please try again.', 'error');
    }
  });
