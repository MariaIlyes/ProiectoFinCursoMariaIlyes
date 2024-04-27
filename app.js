import express from 'express';
import bodyParser from 'body-parser';
import { conexion } from './config/database.js';
import bcrypt from 'bcryptjs';

const app = express();

const port = 5000;

app.use(express.static('views'));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/crearUsuario', (req, res) => {
    console.log(req.body);
    const nombre = req.body.nombre;
    const apellidos = req.body.apellidos;
    const telefono = req.body.telefono;
    const nif = req.body.nif;
    const email = req.body.email;
    const contrasena = req.body.contrasena;
    const usuario = req.body.usuario;
    conexion.query('USE maitdb;', (err, result) => { });
    // Verificar si el usuario ya existe en la tabla
    conexion.query(`SELECT COUNT(*) AS count FROM usuarios WHERE usuario = '${usuario}'`, (err, result) => {
        if (err) {
            console.error('Error al verificar el usuario:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        console.log(result.length);
        console.log(result[0].count);
        if (result.length > 0 && result[0].count > 0) {
            // http 400
            res.render('usuarioKO', { data: usuario });
        } else {
            // Insertar nuevo usuario en la tabla
            bcrypt.hash(contrasena, 10)
                .then(hash => {
                    console.log('Hash resultado de aplicar bcryptjs a tu contraseña:', hash);
                    const sql = `INSERT INTO usuarios(nombre, apellidos, telefono, nif, email, contrasena, usuario) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    conexion.query(sql, [nombre, apellidos, telefono, nif, email, hash, usuario], (err, result) => {
                        if (err) {
                            console.error('Error al insertar el usuario:', err);
                            res.status(500).send('Error interno del servidor');
                            return;
                        }
                        //http 200
                        res.render('usuarioOK', { data: usuario });
                    });
                })
                .catch(err => {
                    console.error(err);
                });

        }
    });
});


app.get('/compania', (req, res) => {
    res.render('compania');
});

app.get('/crear', (req, res) => {
    res.render('crear');
});

app.get('/eliminar', (req, res) => {
    res.render('eliminar');
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/modificar', (req, res) => {
    res.render('modificar');
});

app.get('/servicios', (req, res) => {
    res.render('servicios');
});

app.get('/usuarioLogado', (req, res) => {
    console.log('Usuario:', req.query.usuario);
    console.log('Contrasena', req.query.contrasena);
    const usuario = req.query.usuario;
    const password = req.query.contrasena;
    // reicbo el req y de allí recogo el usuario y su contrasena // luego hago un select a la DB para ver si el usuario existe:
    // si no existe doy mensaje "usuario" no existe   // si existe cojo su contrasena hasheada guardada en la db y la comparo con la contrasena hasheada del req.body
    conexion.query('USE maitdb;', (err, result) => { });
    conexion.query(`SELECT contrasena FROM usuarios WHERE usuario = '${usuario}'`, (err, result) => {
        if (err) {
            throw err;
        } else {
            if (result.length > 0) {
                console.log('Hashul salvat in baza de date este:', result[0].contrasena);
                bcrypt.compare(password, result[0].contrasena)
                    .then(match => {
                        if (match) {
                            console.log('Contrasena OK (correcta)!');
                            res.render('usuarioLogado', { data: req.query.usuario });
                        } else {
                            console.log('Contrasena KO (incorrecta)!');
                            // fi atent ca renderul urmator e de proba doar
                            res.render('usuarioKO', { data: req.query.usuario });
                        }
                    })
                    .catch(err => console.error(err));
            } else {
                console.log('No existe este usuario!');
                // fi atent ca renderul urmator e de proba doar
                res.render('usuarioKO', { data: req.query.usuario });
            }
        }
    });

});

app.get('/views/usuarioNuevo', (req, res) => {
    res.render('usuarioNuevo');
});

app.get('/views/index', (req, res) => {
    res.render('index');
});

app.listen(port, () => {
    console.log(`El server de tu app está levantado y escuchando en el ${port}`);
    console.log(`Accede http://localhost:${port}`);
});