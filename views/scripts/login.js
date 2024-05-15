import server from './server.js';

document.querySelector('.authButton').addEventListener('click', e => {
    const login = document.querySelector('#loginInput').value;
    const password = document.querySelector('#passwordInput').value;

    server('/admin_login', { login, password }).then(result => {
        if(!result.error) {
            localStorage.setItem('token', result.token);
            window.location.assign('/');
        }
        else alert(result.message);
    })
})