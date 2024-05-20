import express from 'express';
import bodyParser from 'body-parser';
import { conexion } from './config/database.js';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import dotenv from 'dotenv';

/**
 * importamos los modulos necesarios para la aplicación
 * 
 */

// cargamos las variables de entorno desde un archivo .env
dotenv.config();
// creamos una instancia de la aplicación Express
const app = express();
// establecemos el puerto en el que se ejecutará el servidor
const port = process.env.PORT;
// establecemos la carpeta views como expuesta para que los ficheros puedan ser accedidos por el cliente
app.use(express.static('views'));
// definimos el motor de vistas como ejs para poder utilizar javascript embebido
app.set('view engine', 'ejs');
// establecemos ./views como carpeta donde el motor ejs buscará las plantillas para renderizar
app.set('views', './views');
// indicamos a la aplicación que puede parsear datos de tipo urlencoded y json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * configuramos el middleware de sesiones para manejar sesiones de usuario
secret: 'secreto' es la clave que utilizamos para firmar la cookie de sesión,
y eso asegura que los datos de la sesión estan protegidos (en vez de 'secreto' habría que crear 
una clave aleatoria y referenciarla desde un fichero de configuración)
resave: true fuerza la sesión a ser guardada en la tienda de sesiones, incluso si no ha sido modificada
saveUninitialized: true permite que las sesiones nuevas pero no modificadas se guarden en la tienda de sesiones´*/
app.use(session({
    secret: 'secreto',
    resave: true,
    saveUninitialized: true
}));
//definimos ruta que se utilizará para la acción de cerrar session
app.get('/salir', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        } else { // si no hy error al destruír la session se renderiza/pinta la pagina index
            res.render('index');
        }
    });
});
// definimos la ruta para crear un usuario nuevo
app.post('/crearUsuario', (req, res) => {
    const { nombre, apellidos, telefono, nif, email, contrasena, usuario } = req.body;
    // comprobamos si el usuario ya existe en la tabla usuarios
    conexion.query(`SELECT COUNT(*) AS count FROM ${process.env.DATABASE}.usuarios WHERE usuario = '${usuario}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor (a la hora de intentar verificar el usuario)');
            return;
        }

        if (result.length > 0 && result[0].count > 0) {// si el usuario existe decimos que no permitimos su creación ya que lo duplicaríamos
            res.render('usuarioExistente');
        } else { // si el usuario que se desea crear no existe en la bd, lo insertamos en la tabla pero hasheando con sal su contrasena con bcryptjs
            bcrypt.hash(contrasena, 10)
                .then(hash => {
                    const sql = `INSERT INTO ${process.env.DATABASE}.usuarios(nombre, apellidos, telefono, nif, email, contrasena, usuario) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    conexion.query(sql, [nombre, apellidos, telefono, nif, email, hash, usuario], (err, result) => {
                        if (err) {
                            res.status(500).send('Error interno del servidor (al insertar el usuario)');
                            return;
                        }
                        res.render('usuarioOK', { data: usuario }); // informamos que el usuario se ha creado con éxito
                    });
                })
                .catch(err => {
                    console.error(err);
                });
        }
    });
});
// ruta para ver los componentes de la empresa/compania
app.get('/compania', (req, res) => {
    res.render('compania');
});
// ruta para ver el formulario de creación de usuario nuevo
app.get('/usuarioNuevo', (req, res) => {
    res.render('usuarioNuevo');
});
// ruta para ver el formulario de creación de empleado
app.post('/crear', (req, res) => {
    const user = req.body.user;
    res.render('crear', { user: user });
});
// ruta para ver los servicios de la empresa
app.get('/servicios', (req, res) => {
    res.render('servicios');
});
// ruta de la pagina inicial (donde el usuario no está logado todavia)
app.get('/', (req, res) => {
    res.render('index');
});
// ruta para renderizar/ver los datos del perfil del usuario
app.get('/perfil', (req, res) => {
    if (req.session.user && req.session.user.username) { //verificamos que hay session
        conexion.query(`SELECT * FROM ${process.env.DATABASE}.usuarios WHERE usuario = '${req.session.user.username}'`, (err, result) => {
            if (err) {
                res.status(500).send('Error interno del servidor (a la hora de intentar verificar el usuario)');
                return;
            }
            res.render('perfil', { user: req.session.user.username, data: result });
        });
    } else { // si no hay session enviamos al principio/home/inicio index
        res.redirect('/');
    }
});
// ruta para enviar los datos para crear un empleado nuevo
app.post('/crearEmpleado', (req, res) => {
    const { nombre, apellidos, telefono, puesto, sueldo } = req.body;
    const sql = `INSERT INTO ${process.env.DATABASE}.empleados(nombre, apellidos, telefono, puesto, sueldo, idUsuario) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    if (req.session && req.session.user.id) { // verificamos que hay session
        conexion.query(sql, [nombre, apellidos, telefono, puesto, sueldo, req.session.user.id], (err, result) => {
            if (err) {
                res.status(500).send('Error interno del servidor (al insertar el empleado)');
                return;
            }
            // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
            conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE idUsuario = '${req.session.user.id}'`, (err, result) => {
                if (err) {
                    res.status(500).send('Error interno del servidor');
                    return;
                } else {
                    res.render('usuarioLogado', { user: req.session.user.username, data: result });
                }
            });
        });
    } else {// si no hay session redirigimos al index
        res.redirect('/');
    }
});
// ruta para pintar la tabla de empleados del usuario logado
app.post('/usuarioLogado', (req, res) => {
    const usuario = req.body.usuario;
    const password = req.body.contrasena;
    if (req.session.user && req.session.user.username && req.session.user.id) { // si ya existe session recuperamos los empleados del usuario la bd
        conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE idUsuario = '${req.session.user.id}'`, (err, result) => {
            if (err) {
                res.status(500).send('Error interno del servidor (al recuperar los empleados)');
                return;
            } else { // recuperamos correctamente los empleados del usuario logado y los pintamos
                res.render('usuarioLogado', { user: req.session.user.username, data: result });
            }
        });
    } else { // si no hay session o no hay username procedemos a recuperar la contrasena del usuario (todavia no logado pero que ahora se está logando) de la bd
        conexion.query(`SELECT contrasena, id FROM ${process.env.DATABASE}.usuarios WHERE usuario = '${usuario}'`, (err, result) => {
            if (err) { // error al ejecutar la query de búsqueda de contrasena del usuario en la bd
                res.status(500).send('Error interno del servidor (al recuperar la contrasena)');
                return;
            } else { // usuario existe en la bd y recuperamos su contrasena
                if (result.length > 0) {
                    bcrypt.compare(password, result[0].contrasena)
                        .then(match => {
                            if (match) { // usuario logado; asignamos los valores usuario (al username) e result[0].id (id) a la req.session.user                                
                                req.session.user = { username: usuario, id: result[0].id }; // guardamos usuario en la session
                                conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE idUsuario = '${req.session.user.id}'`, (err, result) => {
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
// ruta para ver el formulario con los datos del empleado que queremos modificar
app.post('/modificar', (req, res) => {
    if (req.session.user && req.session.user.username) {
        const { id, nombre, apellidos, telefono, puesto, sueldo } = req.body;
        res.render('modificar', { user: req.session.user.username, id: id, nombre: nombre, apellidos: apellidos, telefono: telefono, puesto: puesto, sueldo: sueldo });
    } else {
        res.render('index');
    }
});
// ruta para ver el formulario con los datos del empleado que queremos eliminar
app.post('/eliminar', (req, res) => {
    const { id, nombre, apellidos, telefono, puesto, sueldo } = req.body;
    if (req.session && req.session.user.username) {
        res.render('eliminar', { user: req.session.user.username, id: id, nombre: nombre, apellidos: apellidos, telefono: telefono, puesto: puesto, sueldo: sueldo });
    } else {
        res.redirect('/');
    }
});
// ruta para eliminar empleado existente
app.post('/eliminarEmpleado', (req, res) => {
    const id = req.body.id;
    conexion.query(`DELETE FROM ${process.env.DATABASE}.empleados WHERE id='${id}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            if (req.session && req.session.user.id && req.session.user.username) {
                // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
                conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE idUsuario = '${req.session.user.id}'`, (err, result) => {
                    if (err) {
                        res.status(500).send('Error interno del servidor');
                        return;
                    } else {
                        res.render('usuarioLogado', { user: req.session.user.username, data: result });
                    }
                });
            } else {
                res.redirect('/');
            }
        }
    });
});
// ruta para modificar empleado existente
app.post('/modificarEmpleado', (req, res) => {
    const { id, nombre, apellidos, telefono, puesto, sueldo } = req.body;
    conexion.query(`UPDATE ${process.env.DATABASE}.empleados SET nombre='${nombre}', apellidos= '${apellidos}', telefono='${telefono}',puesto='${puesto}',sueldo='${sueldo}' WHERE id='${id}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            if (req.session && req.session.user.username && req.session.user.id) {
                // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
                conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE idUsuario = '${req.session.user.id}'`, (err, result) => {
                    if (err) {
                        res.status(500).send('Error interno del servidor');
                        return;
                    } else {
                        res.render('usuarioLogado', { user: req.session.user.username, data: result });
                    }
                });
            } else {
                res.redirect('/');
            }
        }
    });
});
// ruta para modificar los datos del usuario
app.post('/modificarUsuario', (req, res) => {
    const { usuario, nombre, apellidos, telefono, nif, email } = req.body;
    conexion.query(`UPDATE ${process.env.DATABASE}.usuarios SET nombre='${nombre}', apellidos= '${apellidos}', telefono='${telefono}', nif='${nif}',email='${email}' WHERE usuario='${usuario}'`, (err, result) => {
        if (err) {
            res.status(500).send('Error interno del servidor');
            return;
        } else {
            if (req.session && req.session.user.username && req.session.user.id) {
                // recuperamos los datos de la tabla empleados para renderizarlos en usuarioLogado
                conexion.query(`SELECT * FROM ${process.env.DATABASE}.empleados WHERE idUsuario = '${req.session.user.id}'`, (err, result) => {
                    if (err) {
                        res.status(500).send('Error interno del servidor');
                        return;
                    } else {
                        res.render('usuarioLogado', { user: req.session.user.username, data: result });
                    }
                });
            } else {
                res.redirect('/');
            }
        }
    });
});

app.listen(port, () => {
    console.log(`Server de tu app levantado y escuchando en el puerto ${port}`);
    console.log(`Accede a tu app http://localhost:${port}`);
});