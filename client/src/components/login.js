const { useState } = require('react');
const { useNavigate } = require('react-router-dom');
const { server } = require('../server');

require('../styles/form.css');

export default function Login(props) {
    const { setError } = props;
    const navigate = useNavigate();

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [errorText, setErrorText] = useState('');

    function signIn() {
        server('/admin_login', { login, password })
        .then(result => {
            if(result.error) setErrorText(result.message);
            else {
                localStorage.setItem('token', result.token);
                navigate('/');
            }
        })
        .catch(e => setError([true, 'Ошибка при запросе к серверу']))
    }

    return(
        <div className='form_wrapper'>
            <div className='form'>
                <div className='form_title'>Вход</div>
                <input className='form_input' type='text' placeholder='Логин' value={login} onChange={e => setLogin(e.target.value)}/>
                <input className='form_input' type='password' placeholder='Пароль' value={password} onChange={e => setPassword(e.target.value)}/>
                <div className='form_error'>{errorText}</div>
                <div className='form_button' onClick={signIn}>Войти</div>
            </div>
        </div>
    )
}