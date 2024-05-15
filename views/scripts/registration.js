import server from './server.js';

function auth() {
    server('/admin_auth', { token: localStorage.getItem('token') }).then(result => {
        if(!result) window.location.assign('/login_adm');
    })
}

auth();

document.querySelector('.regButton').addEventListener('click', e => {
    const login = document.querySelector('#loginInput').value;
    const password = document.querySelector('#passwordInput').value;
    const repeatPassword = document.querySelector('#rPasswordInput').value;

    server('/admin_reg', { login, password, repeatPassword }).then(result => {
        if(!result.error) {
            window.location.assign('/');
        }
        else alert(result.message);
    })
})