const { useState, useEffect } = require('react');
const { useNavigate, Link } = require('react-router-dom');
const { server } = require('../server');

require('../styles/main.css');

export default function Main(props) {
    const { setError } = props;
    const navigate = useNavigate();

    const [admin, setAdmin] = useState();
    const [users, setUsers] = useState(null);
    const [defaultUsers, setDefaultUsers] = useState([]);
    const [sortedColumn, setSortedColumn] = useState({ column: '', dir: 'default' });
    const [searchedColumn, setSearchedColumn] = useState({ _id: '', name: '', email: '', sex: '', dateBirth: '', city: '', complaint: '', status: '' });

    useEffect(() => {
        server('/admin_auth', { token: localStorage.getItem('token') })
        .then(result => setAdmin({ auth: true, ...result }))
        .catch(e => setError([true, 'Ошибка при авторизации. Попробуйте позже']))
    }, [])

    useEffect(() => {
        if(admin == undefined) return;
        if(!admin.auth) navigate('/login');

        server('/getAllUsers')
        .then(result => {
            setDefaultUsers(result);
            setUsers(result);
        })
        .catch(e => setError([true, 'Ошибка при получении списка пользователей']))
    }, [admin])

    function signOut() {
        localStorage.removeItem('token');
        navigate('/login');
    }

    function blockUser(id, e) {
        server('/blockUser', { id })
        .then(result => {
            if(result == 'Заблокирован') e.target.innerHTML = 'Разблокировать';
            else e.target.innerHTML = 'Заблокировать';
            
            setUsers(users.map(user => {
                if(user._id == id) return { ...user, status: result };
                else return user;
            }))
        })
        .catch(e => setError([true, 'Ошибка при попытке заблокировать пользователя']))
    }

    function deleteUser(id) {
        server('/deleteUser', { id })
        .then(result => {
            if(result) setUsers(users.filter(user => user._id != id));
        })
        .catch(e => setError([true, 'Ошибка при попытке удалить пользователя']))
    }

    function sortColumn(column) {
        let dir;

        if(sortedColumn.column == column) dir = sortedColumn.dir == 'default' ? 'up' : sortedColumn.dir == 'up' ? 'down' : 'up';
        else dir = 'up';

        setSortedColumn({ column, dir });

        if(dir == 'up') setUsers(users.sort((a, b) => a[column] < b[column] ? 1 : -1));
        else if(dir == 'down') setUsers(users.sort((a, b) => a[column] > b[column] ? 1 : -1));
    }

    function searchColumn(column, search) {
        const curSearch = { ...searchedColumn, [column]: search };
        setSearchedColumn(curSearch)
        
        let searchUsers = [];
        for(let i = 0; i < defaultUsers.length; i++) {
            let isUser = true;
            for(const col in curSearch) {
                if(!String(defaultUsers[i][col]).includes(curSearch[col])) {
                    isUser = false;
                    break;
                }
            }
            if(isUser) searchUsers.push(defaultUsers[i]);
        }
        
        setUsers(searchUsers);
    }

    function reset() {
        setSearchedColumn({ _id: '', name: '', email: '', sex: '', dateBirth: '', city: '', complaint: '', status: '' });
        setSortedColumn({ column: '', dir: 'default' });
        setUsers(defaultUsers);
    }

    if(admin == undefined) {
        return(
            <div className='loading_wrapper'>
                <div className='loading_text'>Производится авторизация</div>
            </div>
        )
    }
    else if(admin.auth) {
        return(
            <div className='main_wrapper'>
                <div className='main_header'>
                    <div className='main_adminLogin'>_id: {admin._id} login: {admin.login}</div>
                    <Link className='main_button' to='/registration'>Зарегистрировать нового администратора</Link>
                    <div className='main_button' onClick={signOut}>Выйти</div>
                </div>

                <div className='main_table'>
                    <div className='main_tr'>
                        <div className='main_th main_table_header'>
                            _id
                        </div>
                        <div className='main_th main_table_header'>
                            Имя
                            <img onClick={() => sortColumn('name')} src={sortedColumn.column == 'name' && sortedColumn.dir == 'up' ? '/images/sortUp.png' : sortedColumn.column == 'name' && sortedColumn.dir == 'down' ? '/images/sortDown.png' : '/images/sortDefault.png'}/>
                        </div>
                        <div className='main_th main_table_header'>
                            Почта
                            <img onClick={() => sortColumn('email')} src={sortedColumn.column == 'email' && sortedColumn.dir == 'up' ? '/images/sortUp.png' : sortedColumn.column == 'email' && sortedColumn.dir == 'down' ? '/images/sortDown.png' : '/images/sortDefault.png'}/>
                        </div>
                        <div className='main_th main_table_header'>
                            Пол
                            <img onClick={() => sortColumn('sex')} src={sortedColumn.column == 'sex' && sortedColumn.dir == 'up' ? '/images/sortUp.png' : sortedColumn.column == 'sex' && sortedColumn.dir == 'down' ? '/images/sortDown.png' : '/images/sortDefault.png'}/>
                        </div>
                        <div className='main_th main_table_header'>
                            Дата рождения
                            <img onClick={() => sortColumn('dateBirth')} src={sortedColumn.column == 'dateBirth' && sortedColumn.dir == 'up' ? '/images/sortUp.png' : sortedColumn.column == 'dateBirth' && sortedColumn.dir == 'down' ? '/images/sortDown.png' : '/images/sortDefault.png'}/>
                        </div>
                        <div className='main_th main_table_header'>
                            Статус
                            <img onClick={() => sortColumn('status')} src={sortedColumn.column == 'status' && sortedColumn.dir == 'up' ? '/images/sortUp.png' : sortedColumn.column == 'status' && sortedColumn.dir == 'down' ? '/images/sortDown.png' : '/images/sortDefault.png'}/>
                        </div>
                        <div className='main_th main_table_header'>
                            Город
                            <img onClick={() => sortColumn('city')} src={sortedColumn.column == 'city' && sortedColumn.dir == 'up' ? '/images/sortUp.png' : sortedColumn.column == 'city' && sortedColumn.dir == 'down' ? '/images/sortDown.png' : '/images/sortDefault.png'}/>
                        </div>
                        <div className='main_th main_table_header'>
                            Жалобы
                            <img onClick={() => sortColumn('complaint')} src={sortedColumn.column == 'complaint' && sortedColumn.dir == 'up' ? '/images/sortUp.png' : sortedColumn.column == 'complaint' && sortedColumn.dir == 'down' ? '/images/sortDown.png' : '/images/sortDefault.png'}/>
                        </div>
                        <div className='main_th main_table_header'>
                            Действия
                        </div>
                    </div>

                    <div className='main_tr'>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['_id']} onChange={e => searchColumn('_id', e.target.value)}/></div>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['name']} onChange={e => searchColumn('name', e.target.value)}/></div>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['email']} onChange={e => searchColumn('email', e.target.value)}/></div>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['sex']} onChange={e => searchColumn('sex', e.target.value)}/></div>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['dateBirth']} onChange={e => searchColumn('dateBirth', e.target.value)}/></div>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['status']} onChange={e => searchColumn('status', e.target.value)}/></div>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['city']} onChange={e => searchColumn('city', e.target.value)}/></div>
                        <div className='main_th'><input placeholder='Поиск' value={searchedColumn['complaint']} onChange={e => searchColumn('complaint', e.target.value)}/></div>
                        <div className='main_th'><div className='main_button' onClick={reset}>Сбросить</div></div>
                    </div>

                    {users == null && <div className='loading_table'>Получение списка пользователей</div>}
                    {users != null && users.length != 0 && users.map((user, i) =>
                        <div key={i} className='main_tr'>
                            <div className='main_th'>{user._id}</div>
                            <div className='main_th'>{user.name}</div>
                            <div className='main_th'>{user.email}</div>
                            <div className='main_th'>{user.sex}</div>
                            <div className='main_th'>{user.dateBirth.split('T')[0]}</div>
                            <div className='main_th'>{user.status}</div>
                            <div className='main_th'>{user?.city}</div>
                            <div className='main_th'>{user.complaint}</div>
                            <div className='main_th'>
                                <div className='main_button' onClick={e => blockUser(user._id, e)}>Заблокировать</div>
                                <div className='main_button' onClick={() => deleteUser(user._id)}>Удалить</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}