const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require("path");
const str_rand = require('./str_rand');
const nodemailer = require('nodemailer');
require('dotenv').config();

const User = require('./models/User');
const Chat = require('./models/Chat');
const Admin = require('./models/Admin');
const Message = require('./models/Message');
const { error } = require('console');

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.static('public'));
app.use(express.static('./client/build'));
app.use(express.json());

const transporter = nodemailer.createTransport({
    service: 'yandex',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

const start = async () => {
    try {
        const dir = ['./public', './public/chats', './public/users'];
        for(let i = 0; i < dir.length; i++) {
            if(!fs.existsSync(dir[i])) fs.mkdirSync(dir[i]);
        }

        await mongoose.connect(process.env.URL_DB);
        server.listen(process.env.PORT, () => console.log(`server started on port ${process.env.PORT}`));
    }
    catch(e) {
        console.log(e);
    }
}
start();

setInterval(() => {
    let mailCodes = JSON.parse(fs.readFileSync('mailCodes.json'));
    
    for(let i = 0; i < mailCodes.length; i++) {
        if(new Date(mailCodes[i].date) <= new Date()) mailCodes.splice(i, 1);
    }

    fs.writeFileSync('mailCodes.json', JSON.stringify(mailCodes));
}, 3600000)

app.get('/check_server', (req, res) => {
    console.log('try connect ' + req.ip);
    res.send(true);
})

app.get('*', (req, res) => res.sendFile(__dirname + '/client/build/index.html'));

app.post('/admin_auth', async (req, res) => {
    try {
        const { token } = req.body;

        const decodedData = jwt.verify(token, process.env.SECRET_KEY);
        const admin = await Admin.findOne({ _id: decodedData.id }, { password: 0 });
        if(admin == null) return res.json({ auth: false });

        res.json(admin);
    }
    catch(e) {
        res.json({ auth: false });
    }
})

app.post('/admin_login', async (req, res) => {
    try {
        const { login, password } = req.body;

        const admin = await Admin.findOne({login});
        if(!admin) return res.json({ error: true, message: `Администратора ${login} не существует` });
        
        const adminPassword = bcrypt.compare(password,admin.password);
        if(!adminPassword) return res.json({ error: true, message: 'Пароль неверен' });

        const token = generateAccessToken(admin._id);
        return res.json({ error: false, token });
    }
    catch(e) {
        res.json({ error: true, message: 'Ошибка сервера' });
    }
})

app.post('/admin_reg', async (req, res) => {
    try {
        const { login, password, repeatPassword } = req.body;

        if(login.trim() == '') return res.json({ error: true, message: 'Логин администратора не может быть пустым' });
        if(login.length > 20) return res.json({ error: true, message: 'Логин администратора не может быть длиннее 20 символов' });
        if(password.length < 5) return res.json({ error: true, message: 'Пароль должен быть длиннее 4 символов' });
        if(password.length > 20) return res.json({ error: true, message: 'Пароль не может быть длиннее 20 символов' });
        if(password != repeatPassword) return res.json({ error: true, message: 'Пароли не совпадают' });

        const candidate = await User.findOne({ login });
        if(candidate) return res.json({ error: true, message: 'Администратор с таким логином уже существует' });

        const hashPassword = bcrypt.hashSync(password, 7);

        const admin = new Admin({ login, password: hashPassword });
        await admin.save();

        const token = generateAccessToken(admin._id);
        return res.json({ error: false, token });
    }
    catch(e) {
        console.log(e);
        res.json({ error: true, message: 'Ошибка сервера' });
    }
})

app.post('/blockUser', async (req, res) => {
    const { id } = req.body;

    const user = await User.findOne({ _id: id }, { status: 1 });

    if(user.status != 'Заблокирован') {
        await User.updateOne({ _id: id }, { $set: { status: 'Заблокирован' } });
        return res.json('Заблокирован');
    }
    else {
        await User.updateOne({ _id: id }, { $set: { status: 'Не в сети' } });
        return res.json('Не в сети');
    }
})

app.post('/deleteUser', async (req, res) => {
    const { id } = req.body;

    await User.deleteOne({ _id: id });

    res.json(true);
})

app.post('/getAllUsers', async (req, res) => {
    const users = await User.find({}, { password: 0 });
    res.json(users);
})

app.post('/startReg', async (req, res) => {
    try {
        const { Name, Csex, Email, password, ppassword, date } = req.body;

        if(Name.trim() == '') return res.json({ error: true, message: 'Имя пользователя не может быть пустым' });
        if(Name.length > 20) return res.json({ error: true, message: 'Имя пользователя не может быть длиннее 20 символов' });
        if(password.length < 5) return res.json({ error: true, message: 'Пароль должен быть длиннее 4 символов' });
        if(password.length > 20) return res.json({ error: true, message: 'Пароль не может быть длиннее 20 символов' });
        if(password != ppassword) return res.json({ error: true, message: 'Пароли не совпадают' });

        const candidate = await User.findOne({email: Email});
        if(candidate) return res.json({ error: true, message: 'Пользователь с такой почтой уже существует' });

        const code = str_rand(6);

        const html = `
            <div style="width: 100%; display: grid;">
                <h2>Код подтверждения электронной почты</h2>
                <h1 style="justify-self: center;">${code}</h1>
            </div>
        `

        await transporter.sendMail({
            from: `VolLove <${process.env.EMAIL}@yandex.ru>`,
            to: Email,
            subject: 'VolLove Код подтверждения',
            html: html
        })

        let mailCodes = JSON.parse(fs.readFileSync('mailCodes.json'));
        const d = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours() + 1, new Date().getMinutes(), new Date().getSeconds());
        
        for(let i = 0; i < mailCodes.length; i++) {
            if(mailCodes[i].email == Email) mailCodes.splice(i, 1);
        }

        const hashPassword = bcrypt.hashSync(password, 7);
        
        mailCodes.push({ email: Email, code, date: d, name: Name, password: hashPassword, sex: Csex, datebirth: date });
        fs.writeFileSync('mailCodes.json', JSON.stringify(mailCodes));

        res.json({ error: false });
    }
    catch(e) {
        console.log(e);
        res.json(false);
    }
})

app.post('/registration', async (req, res) => {
    try {
        const { Email, code } = req.body;

        let name = '', sex = '', datebirth = '', password = '';
        let mailCodes = JSON.parse(fs.readFileSync('mailCodes.json'));
    
        for(let i = 0; i < mailCodes.length; i++) {
            if(mailCodes[i].email == Email) {
                if(new Date(mailCodes[i].date) <= new Date()) {
                    mailCodes.splice(i, 1);
                    return res.json({ error: true, message: 'Время действия кода истекло' });
                }
                else {
                    if(mailCodes[i].code != code) return res.json({ error: true, message: 'Код неверный' });
                    else {
                        name = mailCodes[i].name;
                        sex = mailCodes[i].sex;
                        datebirth = mailCodes[i].datebirth;
                        password = mailCodes[i].password;

                        mailCodes.splice(i, 1);
                        break;
                    }
                }
            }

            if(i == mailCodes.length - 1) return res.json({ error: true, message: 'Почта неверна' });
        }

        fs.writeFileSync('mailCodes.json', JSON.stringify(mailCodes));

        const avatar = str_rand(10);
        const user = new User({name, sex, email: Email, password, dateBirth: datebirth, avatar});

        fs.mkdirSync("./public/users/" + user._id, { recursive: true });
        fs.mkdirSync(`./public/users/${user._id}/avatar`);
        fs.mkdirSync(`./public/users/${user._id}/photo`);
        fs.copyFileSync("./img/defaultAvatar.png", `./public/users/${user._id}/avatar/${avatar}.png`);

        await user.save();

        const token = generateAccessToken(user._id);
        return res.json({ error: false, token });
    }
    catch(e) {
        console.log(e);
        res.json(false);
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({email});
        if(!user) return res.json(`Пользователь ${email} не найден`);

        const validPassword = bcrypt.compareSync(password, user.password);
        if(!validPassword) return res.json('Введен неверный пароль');

        const token = generateAccessToken(user._id);
        return res.json({token});
    }
    catch(e) {
        console.log(e);
        res.json(false);
    }
})

app.post('/token_check', async (req, res) => {
    try {
        const { token } = req.body;

        const decodedData = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findOne({_id: decodedData.id}, {password: 0, lastActive: 0});
        if(user == null) return res.json(false);

        if(user) return res.json(user);
        else return res.json(false);
    }
    catch(e) {
        console.log(e);
        res.json(false);
    }
})

app.post('/change_acc', async (req, res) => {
    try {
        const { id, Name, Csex, dateBirth, aboutMe } = req.body;

        if(Name.trim() == '') return res.json('Имя не должно быть пустым')

        await User.updateOne({ _id: id }, {$set: {name: Name, dateBirth: dateBirth, sex: Csex, aboutMe: aboutMe}});
        const user = await User.findOne({ _id: id }, { password: 0, lastActive: 0 });

        res.json({ error: false, user });
    }
    catch(e) {
        console.log(e);
        res.json({ error: true });
    }
})

const generateAccessToken = (id) => {
    const payload = { id };
    return jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: '30d'});
}

app.post('/getUsers', async (req, res) => {
    const { id } = req.body;
    const user = await User.findOne({_id: id}, { password: 0 });

    if(user?.city != undefined) {
        const first = await User.find({_id: {$ne: id}, requests: {$ne: id}, like: {$ne: id}, sex:{$ne: user.sex}, city: user.city }, { password: 0 });
        const second = await User.find({_id: {$ne: id}, requests: {$ne: id}, like: {$ne: id}, sex:{$ne: user.sex}, city: {$ne: user.city} }, { password: 0 });
        
        const users = [...first, ...second];
        return res.json(users);
    }
    else {
        const allUsers = await User.find({_id: {$ne: id}, requests: {$ne: id}, like: {$ne: id}, sex:{$ne: user.sex}}, { password: 0 });
        return res.json(allUsers)
    }
})

app.post('/getMessages', async (req, res) => {
    const { chat } = req.body;

    const messages = await Message.find({ chat }).sort({ $natural: -1 });

    res.json(messages);
})

app.post('/loadAvatarky', async (req, res) => {
    try {
        const { id, avatar } = req.body;

        const name = str_rand(10);
        const directory = `./public/users/${id}/avatar`;
        fs.readdir(directory, (err, files) => {
            if(err) throw err;
            for(const file of files) fs.unlinkSync(path.join(directory, file));
        })

        let buff = new Buffer.from(avatar, 'base64').toString('binary');
        fs.writeFileSync(`./public/users/${id}/avatar/${name}.png`, buff, 'binary');

        await User.updateOne({ _id: id }, { $set: { avatar: name } });
        const user = await User.findOne({ _id: id }, { password: 0, lastActive: 0 });

        res.json({ error: false, user });
    }
    catch(e) {
        console.log(e);
        res.json({ error: true, message: 'Произошла ошибка при изменении аватара' });
    }
})

app.post('/loadPhoto', async (req,res) => {
    try {
        const name = str_rand(10);
        const { id, photo} = req.body
        let buff = new Buffer.from(photo, 'base64').toString('binary');
        fs.writeFileSync(`./public/users/${id}/photo/${name}.png`, buff, 'binary');
        res.json({error: false})
    }
    catch(e) {
        console.log(e);
        res.json({ error: true, message: 'Произошла ошибка при добавление фото' });
    }
})

app.post('/getPhoto', async (req,res) =>{
    const {id} = req.body
    let photos = []

    fs.readdirSync(`./public/users/${id}/photo/`).forEach(file => {
        photos.push({path: file})
    });
    res.json({error:false, photo: photos})
})

app.post('/complain', async (req,res) =>{
    const {myId, complainUser} = req.body
    const repeatComplain = await User.findOne({_id: myId, complaintUsers: complainUser })
    if(repeatComplain) return res.json ({error:false, repet: true})
    await User.updateOne({ _id: myId }, {$push: {complaintUsers: complainUser}});
    await User.updateOne({ _id: complainUser }, {$inc: {complaint: 1}});
    res.json({error:false, repet: false})
})

app.post('/setCity', async (req, res) => {
    const { user, city } = req.body;

    await User.updateOne({ _id: user }, { $set: { city } });

    res.json({ city });
})

app.post('/deletePhoto', async (req, res) => {
    const { id,user } = req.body;

    fs.unlinkSync(`./public/users/${user}/photo/${id}`)

    res.json({error:false, id});
})

io.on('connection', socket => {
    console.log('connect', socket.id)

    socket.on('online', async id => {
        await User.updateOne({_id: id}, {$set: {status: 'В сети'}});
        socket.join(id);

        const chats = await Chat.find({contact: id});
        chats.forEach(chat => socket.join(chat._id.toString()));

        socket.on('disconnect', async () => {
            console.log('disconnect', socket.id)
            await User.updateOne({_id: id}, {$set: {status: 'Не в сети'}});
        })
    })

    socket.on('getChats', async id => {
        let chats = await Chat.find({contact: id});

        for(let i = 0; i < chats.length; i++) {
            chats[i] = await formChat(chats[i], id);
        }

        socket.emit('getChats', chats);
    })

    socket.on('likeUser', async ({ myID, userID }) => {
        await User.updateOne({_id: userID}, {$push: {requests: myID}});

        const user1 = await User.findOne({_id: myID});
        const user2 = await User.findOne({_id: userID});

        socket.emit('likeUser', user2);
        socket.to(myID).emit('likeUser', user1);
    })

    socket.on('getLike', async id =>{
        const requestUsers = await User.findOne({_id: id},{requests:1});
        const likeUsers = await User.find({_id:{$in : requestUsers.requests}});
        socket.emit('getLike', likeUsers);
    })

    socket.on('accept', async({myID, userID}) =>{
        const chat = new Chat({contact:[myID,userID]})
        await User.updateOne({_id: myID}, {$pull: {requests:userID}}, {$push:{like:userID}})
        await User.updateOne({_id: userID}, {$push:{like:myID}})
        await User.updateOne({_id: myID}, {$push:{like:userID}})
        fs.mkdirSync(`./public/chats/${chat._id}`)
        await chat.save();
        socket.join(chat._id.toString());
        socket.emit('accept', { chat: await formChat(chat, myID), user: userID });
    })

    socket.on('sendMessage', async ({ text, chat, user, type }) => {
        let message;
        if(type == "text"){
        message = new Message({ text, chat, user, created: new Date(), type: type });
        await message.save();
        }
        if(type == "photo"){
            const name = str_rand(10);
            let buff = new Buffer.from(text, 'base64').toString('binary');
            fs.writeFileSync(`./public/chats/${chat}/${name}.png`, buff, 'binary');
            message = new Message({ text: name, chat: chat, created: new Date(), type: type, user})
            await message.save();
        }
        io.to(chat).emit('getMessage', message);
    })

    socket.on('deleteMessage', async ({id,chat}) => {
        await Message.deleteOne({_id: id})
        io.to(chat).emit('deleteMessage', { id })
    })

    socket.on('editMessage', async ({text,id,chat}) => {
        await Message.updateOne({_id: id}, {$set:{text}})
        io.to(chat).emit('editMessage', { id, text })
    })
})

async function formChat(chat, id) {
    const user = await User.findOne({ $and: [{ _id: { $in: chat.contact } }, { _id: { $ne: id } }] }, { password: 0, requests: 0 });
    return { _id: chat.id, avatar: `/users/${user._id}/avatar/${user.avatar}.png`, name: user.name, lastActive: user.lastActive, online: user.online };
}