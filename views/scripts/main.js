import server from './server.js';

function auth() {
    server('/admin_auth', { token: localStorage.getItem('token') }).then(result => {
        if(!result) window.location.assign('/login_adm');
        else document.querySelector('#admin_login').innerHTML = result;
    })
}

auth();

const buttons = document.querySelectorAll('button');

buttons.forEach(button => {
    if(button.id.split('_')[0] == 'block') button.addEventListener('click', blockUser);
    else if(button.id.split('_')[0] == 'delete') button.addEventListener('click', deleteUser);
})

function blockUser(e) {
    const id = e.target.id.split('_')[1];

    server('/blockUser', { id }).then(result => {
        if(result == 'Заблокирован') e.target.innerHTML = 'Разблокировать';
        else e.target.innerHTML = 'Заблокировать';
        document.querySelector('#status_' + id).innerHTML = result;
    })
}

function deleteUser(e) {
    const id = e.target.id.split('_')[1];

    server('/deleteUser', { id }).then(result => {
        if(result) document.querySelector('#user_' + id).remove();
    })
}

document.querySelector('#reg_admin').addEventListener('click', e =>{
    window.location.assign('/reg_adm')
})

document.querySelector('#logOut').addEventListener('click', e =>{
    localStorage.removeItem('token')
    window.location.assign('/login_adm')
})