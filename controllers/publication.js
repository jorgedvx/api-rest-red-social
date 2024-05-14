// Importar modulos
const fs = require("fs")
const path = require("path")

// Importar modelos
const Publication = require("../models/publication");
const { patch } = require("../routes/user");

//Importar servicios
const followService = require("../services/followService");
const publication = require("../models/publication");

// Acciones de prueba
const pruebaPublication = (req, res) => {

    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    })

}

// Guardar las publicaiones

const save = (req, res) => {

    // Recoger datos del body
    const params = req.body;

    // Si no me llega dar respuestas negativas
    if (!params.text) return res.status(400).send({ status: "error", message: "Debes enviar el texto de la publicacion" })

    // Crear y rellenar el objeto del modelo'
    let newPublication = new Publication(params);
    newPublication.user = req.user.id;

    // Guardar objeto en bbdd
    newPublication.save().then((publicationStared) => {

        if (!publicationStared) {

            return res.status(400).send({
                status: "error",
                message: "Debes enviar el texto de la publicacion"
            })


        }

        return res.status(200).send({
            status: "success",
            message: "Guardar publicacion",
            publicationStared
        })

    })

}

// Listar todas las publicaciones
// Sacar una publicacion
const detail = (req, res) => {

    //Sacar id de la publicaion de la url
    const publicationId = req.params.id;

    // Find con la condicion de id
    Publication.findById(publicationId).then((publicationStared) => {

        if (!publicationStared) {

            return res.status(400).send({
                status: "error",
                message: "No existe la publicacion"

            })

        }

        // Devover respuesta

        return res.status(200).send({
            status: "success",
            message: "Mostrar publicacion",
            publication: publicationStared

        })
    })




}

// Elliminar publicacion

const remove = (req, res) => {

    // Sacar el id de la publicacion a elimnar
    const publicationId = req.params.id;

    // Find y luego un remove
    Publication.deleteMany({ "user": req.user.id, "_id": publicationId }).then((publiDelete) => {

        if (!publiDelete) {

            return res.status(500).send({
                status: "error",
                message: "No se ha eliminado la publicacion",


            })

        }


        return res.status(200).send({
            status: "success",
            message: "Eliminar publicacion",
            publication: publicationId,
            publiDelete


        })
    })



}



// Listar publicaciones de un usuario
const user = (req, res) => {

    // Sacar el id de usuario
    let userId = req.params.id;

    // Controlar la pagina

    const options = {
        page: parseInt(req.params.page) || 1,
        limit: 5,
        sort: { created_at: -1 },
        populate: {
            path: "user",
            select: "-password -role -__v -email"
        }

    }

    // Find, populate, paginar
    Publication.paginate({ "user": userId }, options).then((publications) => {

        if (!publications || publications.docs.length <= 0) {

            return res.status(400).send({
                status: "error",
                message: "No hay publicaciones del usuario para mostrar",

            })

        }

        return res.status(200).send({
            status: "success",
            message: "Publicaciones del perfil de un usuario",
            page: publications.page,
            totalDoc: publications.totalDocs,
            Pages: publications.totalPages,
            publications: publications.docs

        })

    })



}


// Subir ficheros
const upload = (req, res) => {

    // Sacar publication id
    const publicationId = req.params.id

    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(400).send({
            status: "error",
            message: "Peticion no incluye la imagen"
        })

    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname;


    // Sacar la extension del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];

    // Comprobar extension Si no es correcto
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo diferent
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath)

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extension del fichero invalido"
        })

    }

    // Si es correcto, guardar en la bd
    Publication.findByIdAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }).then((publicationUpdated) => {

        if (!publicationUpdated) {

            return res.status(400).send({
                status: "error",
                message: "Error en la subida de imagen"
            })

        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file





        })


    })

        .catch(error => {
            return res.status(500).send({
                status: "error",
                message: "Error en el metodo upload",
            })

        })



}






// Devolver archivos multimedia imagenes
const media = (req, res) => {

    // Sacar el paramtro de una url
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = "./uploads/publications/" + file

    // Comprobar que existe
    fs.stat(filePath, (error, exists) => {

        if (!exists) {

            return res.status(400).send({
                status: "error",
                message: "No existe la imagen"
            })

        }

        // Devolver un file

        return res.sendFile(path.resolve(filePath));


    })


}


// Lista todas las publicaciones (FEED)
const feed = async (req, res) => {

    // Sacar la pagina actual
    // Establecer numero de elementos por pagina
    const options = {
        page: parseInt(req.params.page) || 1,
        limit: 5,
        sort: { created_at: -1 },
        populate: {
            path: "user",
            select: "-password -role -__v -email"

        }
    }

    // Sacar un array de identificadores de usuarios que yo sigo como usuario logeado

    try {

        const myFollows = await followService.followUserIds(req.user.id);

        //Find a publicaciones in, ordenar popular, paginar

        Publication.paginate({
            "user": myFollows.following
        }, options).then((publications) => {

            if (!publications) {

                return res.status(400).send({
                    status: "error",
                    message: "No hay publicaciones para mostrat"
                })

            }


            return res.status(200).send({
                status: "success",
                message: "Feed de publicaciones",
                myFollows: myFollows.following,
                page: publications.page,
                totalDoc: publications.totalDocs,
                Pages: publications.totalPages,
                publications: publications.docs
            })



        });


    } catch (error) {

        return res.status(500).send({
            status: "error",
            message: "No se han listado las publicaciones del feed"

        })


    }




}

module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed

}