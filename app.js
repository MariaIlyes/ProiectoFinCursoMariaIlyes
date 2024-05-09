import express from 'express';
import bodyParser from 'body-parser';
import { conexion } from './config/database.js';
import bcrypt from 'bcryptjs';
import session  from 'express-session';
import dotenv from 'dotenv';



dotenv.config();

const app = express();

const port = 5000;

app.use(express.static('views'));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'secreto',
    resave: true,
    saveUninitialized: true
}));

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
    // Comprobamos si el usuario ya existe en la tabla
    conexion.query(`SELECT COUNT(*) AS count FROM usuarios WHERE usuario = '${usuario}'`, (err, result) => {
        if (err) {
            console.error('Error al verificar el usuario:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        console.log(result.length);
        console.log(result[0].count);
        // si el usuario existe decimos que no permitimos su creación ya que lo duplicaríamos
        if (result.length > 0 && result[0].count > 0) {
            res.render('usuarioKO', { data: usuario });
        } else {
            // si el usuario que se desea crear no existe en la bd, lo insertamos en la tabla
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
                        // e informamos que el usuario se ha creado con éxito
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

app.get('/usuarioNuevo', (req, res) => {
    res.render('usuarioNuevo');
});

app.post('/crear', (req, res) => {
    const user = req.body.user;
    res.render('crear', {user:user});
});

app.get('/eliminar', (req, res) => {
    const user = req.body.user;
    res.render('eliminar', {user: user});
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/modificar', (req, res) => {
    const user = req.body.user;
    res.render('modificar', {user: user});
});

app.get('/servicios', (req, res) => {
    res.render('servicios');
});

app.post('/crearEmpleado', (req, res) => {
    // no olvides hacer viajar el nombre del usuario de usuarioLogado a crear para que pueda viajar de vuelta
    const user = req.body.user;
    const nombre = req.body.nombre;
    const telefono = req.body.telefono;
    const puesto = req.body.puesto;
    const sueldo = req.body.sueldo;
    conexion.query('USE maitdb;', (err, result) => { });
    const sql = `INSERT INTO empleados(nombre, telefono, puesto, sueldo) 
                    VALUES (?, ?, ?, ?)`;
    conexion.query(sql, [nombre, telefono, puesto, sueldo], (err, result) => {
        if (err) {
            console.error('Error al insertar el empleado(técnico):', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
        conexion.query(`SELECT * FROM empleados`, (err, result) => {
            if (err) {
                console.error('Error técnico al verificar el usuario:', err);
                res.status(500).send('Error interno del servidor');
                return;
            } else {
                console.log('Result:', result);
                res.render('usuarioLogado', { user: user, data: result });
            }
        });
    });
});

app.get('/usuarioLogado', (req, res) => {
    console.log('Usuario:', req.query.usuario);
    console.log('Contrasena', req.query.contrasena);
    const usuario = req.query.usuario;
    const password = req.query.contrasena;
    // recibo el req y de allí recogo el usuario y su contrasena // luego hago un select a la DB para ver si el usuario existe:
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
                            // usuario este logat; acum recuperam datele din tabla empleados
                            req.session.user = { username: usuario };//guardamos usuario en la session
                            conexion.query(`SELECT * FROM empleados`, (err, result) => {
                                if (err) {
                                    console.error('Error al verificar el usuario:', err);
                                    res.status(500).send('Error interno del servidor');
                                    return;
                                } else {
                                    console.log('Result:', result);
                                    // no olvides hacer la prueba en vacío
                                    res.render('usuarioLogado', { user: req.query.usuario, data: result });
                                }
                            });
                        } else {
                            console.log('Contrasena KO (incorrecta)!');
                            // fi atent ca renderul urmator e de proba doar
                            const proba =req.query.usuario + ' contraseña incorrecto ';
                            res.render('usuarioKO', { data: proba });
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

app.get('/proba', (req,res) => {
    if(req.session.user && req.session.user.username){
        console.log("User logged session:", req.session.user.username);
        res.render('proba', {user:req.session.user.username});
    }else{
        console.log("No user logged in session");
    }  
});

app.post('/modificar', (req, res) => {
    const user = req.body.user;
    const id = req.body.id;
    const nombre = req.body.nombre;
    const telefono = req.body.telefono;
    const puesto = req.body.puesto;
    const sueldo = req.body.sueldo;
    res.render('modificar', { user:user, id: id, nombre: nombre, telefono: telefono, puesto: puesto, sueldo: sueldo });
});

app.post('/eliminar', (req, res) => {
    const user = req.body.user;
    const id = req.body.id;
    const nombre = req.body.nombre;
    const telefono = req.body.telefono;
    const puesto = req.body.puesto;
    const sueldo = req.body.sueldo;
    res.render('eliminar', { user: user, id: id, nombre: nombre, telefono: telefono, puesto: puesto, sueldo: sueldo });
});

app.post('/eliminarEmpleado', (req, res) => {
    const user = req.body.user;
    const id = req.body.id;
    conexion.query('USE maitdb;', (err, result) => { });
    conexion.query(`DELETE FROM empleados WHERE id='${id}'`, (err, result) => {
        if (err) {
            console.error('Error técnico:', err);
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            console.log('Deletion result:', result);
            // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
            conexion.query(`SELECT * FROM empleados`, (err, result) => {
                if (err) {
                    console.error('Error técnico al verificar el usuario:', err);
                    res.status(500).send('Error interno del servidor');
                    return;
                } else {
                    console.log('Result:', result);
                    res.render('usuarioLogado', { user: user,data: result });
                }
            });
        }
    });
});

app.post('/modificarEmpleado', (req, res) => {
    const user = req.body.user;
    const id = req.body.id;
    const nombre = req.body.nombre;
    const telefono = req.body.telefono;
    const puesto = req.body.puesto;
    const sueldo = req.body.sueldo;
    conexion.query('USE maitdb;', (err, result) => { });
    conexion.query(`UPDATE empleados SET nombre='${nombre}',telefono='${telefono}',puesto='${puesto}',sueldo='${sueldo}' WHERE id='${id}'`, (err, result) => {
        if (err) {
            console.error('Error técnico:', err);
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            console.log('Update result:', result);
            // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
            conexion.query(`SELECT * FROM empleados`, (err, result) => {
                if (err) {
                    console.error('Error técnico al verificar el usuario:', err);
                    res.status(500).send('Error interno del servidor');
                    return;
                } else {
                    console.log('Result:', result);
                    res.render('usuarioLogado', { user: user,data: result });
                }
            });
        }
    });
});

// verifica si realmente lo utilizamos o estamos servidos con app.get('/'....)
app.get('/views/index', (req, res) => {
    res.render('index');
});

app.listen(port, () => {
    console.log(`El server de tu app está levantado y escuchando en el ${port}`);
    console.log(`Accede http://localhost:${port}`);
    console.log('Hay usuario (logado?):', process.env.LOGADO);
});