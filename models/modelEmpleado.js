class Empleado{
    constructor(id, nombre, telefono, puesto, sueldo){
        this.id = id;
        this.nombre = nombre;
        this.telefono = telefono;
        this.puesto = puesto;
        this.sueldo = sueldo;
    }
    async getallEmpleados() {
        console.log("Dame empleados")    
     }
}

export default Empleado;