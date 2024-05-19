const serverUrl = require('./server_url.js');

const server = async (url, data = {}) => {
    return fetch(serverUrl + url, { method: 'post', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(data) })
    .then(response => response.json())
}

module.exports = { server };