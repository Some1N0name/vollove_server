const { useEffect, useState } = require('react');
const { BrowserRouter, Route, Routes } = require('react-router-dom');
const { server } = require('./server');

require('./styles/app.css');

const Main = require('./components/main').default;
const Login = require('./components/login').default;
const Registration = require('./components/registration').default;
const Error = require('./components/error').default;

export default function App() {
    const [error, setError] = useState([false, '']);

    useEffect(() => {
        if(error[0]) {
            setTimeout(() => {
                setError([false, '']);
            }, 10000)
        }
    }, [error])

    return(
        <BrowserRouter>
            <Error state={error[0]} text={error[1]}/>
            <div className='App'>
                <Routes>
                    <Route path='/' element={<Main setError={setError}/>}/>
                    <Route path='/login' element={<Login setError={setError}/>}/>
                    <Route path='/registration' element={<Registration setError={setError}/>}/>
                </Routes>
            </div>
        </BrowserRouter>
    )
}