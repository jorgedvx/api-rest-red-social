const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");


//Mensaje de bienvenida
console.log("API NODE para red social arrancada !!")

// Conexion a la bd 
connection();

//Crear servidor node

const app = express();
const puerto = 3900;


//Configurar cors
app.use(cors())


//Convertir los datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Cargar conf rutas
const UserRoutes = require("./routes/user")
const PublicationRoutes =require("./routes/publication")
const FollowRoutes = require("./routes/follow")

app.use("/api/user", UserRoutes);
app.use("/api/publication", PublicationRoutes);
app.use("/api/follow", FollowRoutes);

// Ruta de prueba
app.get("/ruta-prueba", (req, res) => {

    return res.status(200).json(

        {
            "id": 1,
            "nombre": "Jorge",
            "web": "jorgecongaweb.es"

        }


    );

})

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

//Poner servidor e escuchar peticiones http

app.listen(process.env.PORT || puerto, ()=>{
    console.log("Servidor de node corriendo en el puerto:", process.env.PORT || puerto);
})
