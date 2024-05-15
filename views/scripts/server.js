import serverUrl from './server_url.js';

export default async function server(url, data = {}) {
    return fetch(serverUrl + url, {method: 'post', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(data)})
    .then(response => response.json())
}