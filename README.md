# ProyectoFinCursoMariaIlyes

## Instrucciones de instalación del proyecto


Ejecuta en tu **Mysql** el siguiente script de base de datos que encuentras en la carpeta **config** que esta situada en el proyecto que te has descargado al clonar este git


    initialqueries.sql

Ejecuta en la carpeta **ProyectoFinCursoMariaIlyes** que te has descargado al clonar este proyecto git, en un terminal o ventana de sistema el comando


    npm install


**No olvides arrancar tu motor de base de datos Msql**


Ahora inicia tu server/aplicación con el comando


    npm start


Ahora accede a la siguiente URL para empezar a utilizar la aplicación


    http:/localhost:5000


Empieza por crear un Usuario y luego podrás crear, modificar, ver, o eliminar empleados.


 
## Historia del proyecto
Es un proiecto de fin de curso de DAW

## Hoja de ruta
[x]1	Portada con título del ciclo formativo, nombre del módulo y nombre del alumno.

        
[x]2	Descripción del tipo y del proyecto seleccionado.


[x]3	Motivación por la que se elige el proyecto.


[x]4	Relación de tecnologías a emplear.


    He subido  el documento con la portada el 23.03.2024

El enfoque del proyecto se va hacer creando las características fundamentales y luego, a medida que el tiempo lo permita, añadire las caracteristicas 
adicionales y mejorare la aplicación incluida su grafica.
  La aplicación tendrá una página de inicio llamada "index". Desde la página de inicio se podrá viajar a distintas páginas:
  compania, servicios, nuevoUsuario, usuarioLogado. También desde la página inicial se podrá contactar con la empresa a través de la cuenta de Linkedin,
  el email, e bien llamando al teléfono.

## Mockup plan
| Mockup  | Inicio  |  Fin   |
| :-----: | :-----: | :-----:|
| Empezado| 11.04.2024 | 15.04.2024 |
| paginas :                |
| index       |  19.04.2024|19.05.2024|
| compania        | 19.04.2024|19.05.2024|
| servicios       | 19.04.2024|19.05.2024|
| nuevoUsuario         | 19.04.2024|19.05.2024|
| usuarioLogado       | 19.04.2024|19.05.2024|
| crear     | 19.04.2024 |19.05.2024|
| modificar    |  19.04.2024 |19.05.2024|
| eliminar    |   19.04.2024 |19.05.2024|

## Configuracion proyecto
Inicializamos el proyecto en node.js

Para ello tenemos que tener instalado node.js  el npm (Node Package Manager).

Terminal: 


    npm init

Esto ha inicializado en package.json

Terminal:

    npm install express ejs body-parser mysql2
   
MVC

Modell view controller

Creamos 4 carpetas para separar conceptos:
 
  **config**
    
   
   **views**
   


Creamos el **app.js** en la raíz y un **index.ejs** en views.

Ejecutamos en terminal: 

   **node app.js**

Terminal: 

   **npm install nodemon**

Creamos las páginas vacías:

   **index**

   **compania** 

   **usuarioNuevo**

   **usuarioLogado**

   **servicios**

   **crear**

   **modificar**

   **eliminar** 
 He subido el proyecto Javascript el 20.04.2024 del local al Github.com


