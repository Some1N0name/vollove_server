const { useState } = require('react');
const { useNavigate, Link } = require('react-router-dom');
const { server } = require('../server');

require('../styles/form.css');

export default function Registration(props) {
    const { setError } = props;
    const navigate = useNavigate();

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [errorText, setErrorText] = useState('');

    function reg() {
        server('/admin_reg', { login, password, repeatPassword })
        .then(result => {
            if(result.error) setErrorText(result.message);
            else navigate('/');
        })
        .catch(e => setError([true, 'Ошибка при запросе к серверу']))
    }

    return(
        <div className='form_wrapper'>
            <div className='form'>
                <div className='form_title'>Регистрация</div>
                <input className='form_input' type='text' placeholder='Логин' value={login} onChange={e => setLogin(e.target.value)}/>
                <input className='form_input' type='password' placeholder='Пароль' value={password} onChange={e => setPassword(e.target.value)}/>
                <input className='form_input' type='password' placeholder='Повторите пароль' value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)}/>
                <div className='form_error'>{errorText}</div>
                <div className='form_button' onClick={reg}>Зарегистрироваться</div>
                <Link className='form_switch' to={'/'}>Вернуться</Link>
            </div>
        </div>
    )
}