import express from 'express';
import bodyParser from 'body-parser';
import { conexion } from './config/database.js';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const port = process.env.PORT;

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

app.get('/salir', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        } else {
            res.render('index');
        }
    });
});

app.post('/crearUsuario', (req, res) => {
    const { nombre, apellidos, telefono, nif, email, contrasena, usuario } = req.body;
    // Comprobamos si el usuario ya existe en la tabla
    conexion.query(`SELECT COUNT(*) AS count FROM ${process.env.DATABASE}.usuarios WHERE usuario = '${usuario}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor (a la hora de intentar verificar el usuario)');
            return;
        }
        // si el usuario existe decimos que no permitimos su creación ya que lo duplicaríamos
        if (result.length > 0 && result[0].count > 0) {
            res.render('usuarioExistente');
        } else {
            // si el usuario que se desea crear no existe en la bd, lo insertamos en la tabla
            bcrypt.hash(contrasena, 10)
                .then(hash => {
                    const sql = `INSERT INTO ${process.env.DATABASE}.usuarios(nombre, apellidos, telefono, nif, email, contrasena, usuario) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    conexion.query(sql, [nombre, apellidos, telefono, nif, email, hash, usuario], (err, result) => {
                        if (err) {
                            res.status(500).send('Error interno del servidor (al insertar el usuario)');
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

app.get('/eliminar', (req, res) => {
    const user = req.body.user;
    res.render('eliminar', { user: user });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/modificar', (req, res) => {
    const user = req.body.user;
    res.render('modificar', { user: user });
});

app.get('/servicios', (req, res) => {
    res.render('servicios');
});

app.get('/perfil', (req, res) => {
    if (req.session.user && req.session.user.username) {
        console.log("User logged session:", req.session.user.username);
        conexion.query(`SELECT * FROM ${process.env.DATABASE}.usuarios WHERE usuario = '${req.session.user.username}'`, (err, result) => {
            if (err) {
                res.status(500).send('Error interno del servidor (a la hora de intentar verificar el usuario)');
                return;
            }
            // si el usuario existe decimos que no permitimos su creación ya que lo duplicaríamos
            res.render('perfil', { user: req.session.user.username, data: result });

        });

    } else {
        console.log("No user logged in session");
    }
});

app.post('/crearEmpleado', (req, res) => {
    // no olvides hacer viajar el nombre del usuario de usuarioLogado a crear para que pueda viajar de vuelta
    const { nombre, apellidos, telefono, puesto, sueldo } = req.body;
    const sql = `INSERT INTO ${process.env.DATABASE}.empleados(nombre, apellidos, telefono, puesto, sueldo, usuario) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    conexion.query(sql, [nombre, apellidos, telefono, puesto, sueldo, req.session.user.username], (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor (al insertar el empleado)');
            return;
        }
        // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
        conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE usuario = '${req.session.user.username}'`, (err, result) => {
            if (err) {
                res.status(500).send('Error interno del servidor');
                return;
            } else {
                res.render('usuarioLogado', { user: req.session.user.username, data: result });
            }
        });
    });
});

app.post('/usuarioLogado', (req, res) => {
    const usuario = req.body.usuario;
    const password = req.body.contrasena;
    if (req.session.user && req.session.user.username) { // si ya existe session y username recuperamos los empleados del usuario la bd
        conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE usuario = '${req.session.user.username}'`, (err, result) => {
            if (err) {
                res.status(500).send('Error interno del servidor (al recuperar los empleados)');
                return;
            } else { // recuperamos correctamente los empleados del usuario logado
                res.render('usuarioLogado', { user: req.session.user.username, data: result });
            }
        });
    } else { // si no hay session o no hay username procedemos a recuperar la contrasena del usuario (todavia no logado) de la bd
        conexion.query(`SELECT contrasena FROM ${process.env.DATABASE}.usuarios WHERE usuario = '${usuario}'`, (err, result) => {
            if (err) { // error al ejecutar la query de búsqueda de contrasena del usuario en la bd
                res.status(500).send('Error interno del servidor (al recuperar la contrasena)');
                return;
            } else { // usuario existe en la bd y recuperamos su contrasena
                if (result.length > 0) {
                    bcrypt.compare(password, result[0].contrasena)
                        .then(match => {
                            if (match) { // usuario logado; asignamos valor a la req.session.user                                 
                                req.session.user = { username: usuario }; // guardamos usuario en la session
                                conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE usuario = '${req.session.user.username}'`, (err, result) => {
                                    if (err) {
                                        res.status(500).send('Error interno del servidor (al recuperar los empleados, habiendo recuperado la contrasena)');
                                        return;
                                    } else { // recuperados los empleados del usuario pintamos su tabla                              
                                        res.render('usuarioLogado', { user: req.session.user.username, data: result });
                                    }
                                });
                            } else { // la contrasena no coincide
                                res.render('usuarioKO');
                            }
                        })
                        .catch(err => console.error(err));
                } else { // usuario no existe
                    res.render('usuarioKO');
                }
            }
        });
    }
});

app.post('/crear', (req, res) => {
    const user = req.body.user;
    res.render('crear', { user: user });
});

app.post('/modificar', (req, res) => {
    if (req.session.user && req.session.user.username) {
        const { id, nombre, apellidos, telefono, puesto, sueldo } = req.body;
        res.render('modificar', { user: req.session.user.username, id: id, nombre: nombre, apellidos: apellidos, telefono: telefono, puesto: puesto, sueldo: sueldo });
    } else {
        res.render('index');
    }
});

app.post('/eliminar', (req, res) => {
    const { id, nombre, apellidos, telefono, puesto, sueldo } = req.body;
    res.render('eliminar', { user: req.session.user.username, id: id, nombre: nombre, apellidos: apellidos, telefono: telefono, puesto: puesto, sueldo: sueldo });
});

app.post('/eliminarEmpleado', (req, res) => {
    const id = req.body.id;
    conexion.query(`DELETE FROM ${process.env.DATABASE}.empleados WHERE id='${id}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
            conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE usuario = '${req.session.user.username}'`, (err, result) => {
                if (err) {
                    res.status(500).send('Error interno del servidor');
                    return;
                } else {
                    res.render('usuarioLogado', { user: req.session.user.username, data: result });
                }
            });
        }
    });
});

app.post('/modificarEmpleado', (req, res) => {
    const { id, nombre, apellidos, telefono, puesto, sueldo } = req.body;
    conexion.query(`UPDATE ${process.env.DATABASE}.empleados SET nombre='${nombre}', apellidos= '${apellidos}', telefono='${telefono}',puesto='${puesto}',sueldo='${sueldo}' WHERE id='${id}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
            conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE usuario = '${req.session.user.username}'`, (err, result) => {
                if (err) {
                    res.status(500).send('Error interno del servidor');
                    return;
                } else {
                    res.render('usuarioLogado', { user: req.session.user.username, data: result });
                }
            });
        }
    });
});

app.post('/modificarUsuario', (req, res) => {
    const { usuario, nombre, apellidos, telefono, nif, email } = req.body;
    conexion.query(`UPDATE ${process.env.DATABASE}.usuarios SET nombre='${nombre}', apellidos= '${apellidos}', telefono='${telefono}', nif='${nif}',email='${email}' WHERE usuario='${usuario}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
            conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE usuario = '${req.session.user.username}'`, (err, result) => {
                if (err) {
                    res.status(500).send('Error interno del servidor');
                    return;
                } else {
                    res.render('usuarioLogado', { user: req.session.user.username, data: result });
                }
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server de tu app levantado y escuchando en el puerto ${port}`);
    console.log(`Accede a tu app http://localhost:${port}`);
});