// Importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");


// Importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

// MIDDLEWERE - Funcion de autentificacion
exports.auth = (req, res, next) => {

    // Comprobar si me llego la cabecera de auth
    if (!req.headers.authorization) {
        return res.status(400).send({
            status: "error",
            message: "La peticion no tiene la cabecera de autentificacion"
        })
    }

    // Limpiar token
    let token = req.headers.authorization.replace(/['"]+/g, '') //expresion-regular //quitar-comillas-S/D

    // decodificar el token
    try {
        let payload = jwt.decode(token, secret);

        // Comprobar la expiracion del token
        if (payload.exp <= moment().unix()) {
            return req.status(401).send({
                status: "error",
                message: "Token expirado"

            });

        }

        // Agregar datos de usuario e request
        req.user = payload;

    } catch (error) {
        return req.status(404).send({
            status: "error",
            message: "Token invalido",
            error
        });
    }

    // Pasar a ejecucion de accion

    next();

}

