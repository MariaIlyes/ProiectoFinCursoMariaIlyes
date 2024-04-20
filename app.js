import express from'express';
import bodyParser  from'body-parser';
import {conexion} from'./config/database.js';
const app = express();

const port = 3000;

app.use(express.static('views'));
app.set('view engine' , 'ejs');
app.set('views', './views');

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/compania', ( req, res )=>{
    res.render('compania');
});

app.get('/crear' , ( req, res )=>{
    res.render('crear');
});

app.get('/eliminar' , ( req, res )=>{
    res.render('eliminar');
});

app.get('/' , ( req, res )=>{
    res.render('index');
});

app.get('/modificar' , ( req, res )=>{
    res.render('modificar');
});

app.get('/servicios' , ( req, res )=>{
    res.render('servicios');
});

app.get('/usuarioLogado' , ( req, res )=>{
    res.render('usuarioLogado');
});

app.get('/views/usuarioNuevo' ,( req, res )=>{
    res.render('usuarioNuevo');
});

app.get('/views/index' ,( req, res )=>{
    res.render('index');
});

app.listen(port , ()=>{
console.log(`El server de tu app esta levantado y escuchado en el ${port}`);
console.log(`Accede http://localhost:${port}`);

});