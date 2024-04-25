class Empleado{
    constructor(id, nombre, apellidos, telefono, nif, email, contrasena, usuario){
        this.id = id;
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.telefono = telefono;
        this.nif = nif;
        this.email = email;
        this.contrasena = contrasena;
        this.usuario = usuario;
    }
     getEmpleados() {
        return;     
     }
}

export default Empleado;