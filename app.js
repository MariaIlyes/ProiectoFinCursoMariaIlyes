import express from 'express';
import bodyParser from 'body-parser';
import {conexion} from './config/database.js';

const app = express();

const port = 5000;

app.use(express.static('views'));

app.use(bodyParser.urlencoded({ extended : true}));
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
    conexion.query('USE maitdb;',()=>{});
    // Verificar si el usuario ya existe en la tabla
    conexion.query(`SELECT COUNT(*) AS count FROM usuarios WHERE usuario = '${usuario}'`, (err, result) => {
        if (err) {
            console.error('Error al verificar el usuario:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        console.log(result.length );
        console.log(result[0].count);
        if (result.length > 0 && result[0].count > 0) {
            res.render('usuarioKO', {data: usuario});
        } else {
            // Insertar nuevo usuario en la tabla
            const sql = `INSERT INTO usuarios(nombre, apellidos, telefono, nif, email, contrasena, usuario) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
            conexion.query(sql, [nombre, apellidos, telefono, nif, email, contrasena, usuario], (err, result) => {
                if (err) {
                    console.error('Error al insertar el usuario:', err);
                    res.status(500).send('Error interno del servidor');
                    return;
                }
              
                res.render('usuarioOK', {data: usuario});
            });
        }
    });
});


app.get('/compania', ( req , res )=>{
    res.render('compania');
});

app.get('/crear', ( req , res )=>{
    res.render('crear');
});

app.get('/eliminar', ( req , res )=>{
    res.render('eliminar');
});

app.get('/', ( req , res )=>{
    res.render('index');
});

app.get('/modificar', ( req , res )=>{
    res.render('modificar');
});

app.get('/servicios', ( req , res )=>{
    res.render('servicios');
});

app.get('/usuarioLogado', ( req , res )=>{
    res.render('usuarioLogado',{data: req.query.usuario});
});

app.get('/views/usuarioNuevo', ( req , res )=>{
    res.render('usuarioNuevo');
});

app.get('/views/index', ( req , res )=>{
    res.render('index');
});

app.set('view engine' , 'ejs');
app.set('views' , './views');

app.listen(port , ()=>{
    console.log(`El server de tu app está levantado y escuchando en el ${port}`);
    console.log(`Accede http://localhost:${port}`);
});