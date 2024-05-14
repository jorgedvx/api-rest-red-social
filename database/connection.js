const mongoose = require("mongoose");
require('dotenv').config()

const connectionMongoDB = process.env.MONGODB_URL

const connection = async() =>{

    try{

        // await mongoose.connect("mongodb://127.0.0.1:27017/mi_redsocial");

        await mongoose.connect(connectionMongoDB)
        
        console.log("conectado corretamente a bd: mi_redsocial")

    }  
    catch(error){
        console.log(error)
        throw new Error("No se ha podido conectar a la base de datos");
    }
}

module.exports = connection