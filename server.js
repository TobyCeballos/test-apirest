const express = require('express')
const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')
const Contenedor = require('./src/controllers/contenedorMsg.js')
const Container = require('./src/controllers/contenedorProd.js')
const carts = require('./src/controllers/contenedorCarts')
const app = express()
const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)
const usersList = require('./src/controllers/contenedorUsers')
const session = require('express-session')
const connectMongo = require('connect-mongo')
const cookieParser = require('cookie-parser')
const ruta1 = require('./src/router/routes')
const ruta2 = require('./src/router/routeCarrito')
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }
const MongoStorage = connectMongo.create({
    mongoUrl: 'mongodb+srv://tobyceballos:coderhouse@cluster0.erpbj.mongodb.net/Cluster0?retryWrites=true&w=majority',
    mongoOptions: advancedOptions,
    ttl: 600
})
const minimist = require('./src/config/minimist')


app.use(
    session({
        store: MongoStorage,
        secret: 'shhhhhhhhhhhhhh',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60000 * 60
        },
    })
);

//---------------------------------------------------//
const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
//---------------------------------------------------//


passport.use('register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    const usuario = await usersList.getUser(email)
    console.log(usuario)
    if (usuario) {
        return done(null, false)
    } else {
        const user = req.body.user
        const age = req.body.age
        const avatar = req.body.avatar
        const phone = req.body.phone
        const direction = req.body.direction
        const saved = await usersList.saveUser({ user, email, age, avatar, phone, password, direction });
        done(null, saved);
    }
}));

passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    const user = await usersList.getUser(email);
    if (user.email != email) {
        return done(null, false);
    }
    if (password != user.password) {
        return done(null, false);
    }
    return done(null, user);
}));
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.use(passport.initialize())
app.use(passport.session())
app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('./src/public'))
app.use(ruta1)
app.use('/carritos',ruta2)


io.on('connection', async (sockets) => {

    sockets.emit('product', await Container.getProds())
    console.log('Un cliente se ha conectado!: ' + sockets.id)
    // div
    sockets.emit('messages', await Contenedor.getMsg())

    sockets.on('new-product', async data => {
        const name = data.name
        const description = data.description
        const price = data.price
        const stock = data.stock
        const thumbnail = data.thumbnail
        await Container.saveProd({ name, description, price, stock, thumbnail })


        io.sockets.emit('product', await Container.getProds())
    })
    sockets.on('new-message', async dato => {
        console.log(dato)
        const email = dato.email
        const text = dato.text
        const fecha = dato.fecha
        const hora = dato.hora

        await Contenedor.saveMsj(email, text, fecha, hora)

        io.sockets.emit('messages', await Contenedor.getMsg())
    })
})

const PORT = minimist.datosArgs.puerto
httpServer.listen(PORT, () => console.log('Iniciando en el puerto: ' + PORT))