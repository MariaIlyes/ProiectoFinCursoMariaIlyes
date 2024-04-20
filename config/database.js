import mysql from'mysql2';
import dotenv from 'dotenv';
dotenv.config();

export const conexion = mysql.createConnection({
    host: process.env.HOST_NAME,
    user: 'root',
    password:'',
    database:process.env.DATABASE
});

conexion.connect(function(error){
    if(error){
        throw error;
    }else{
        console.log(`La conexión a la base de datos ${conexion.config.database} se ha realizado con éxito!`);
    }

});