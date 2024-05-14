// importar dependecias y modulos
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

//Importar modelos
const User = require("../models/user");
const Follow = require("../models/follow");
const Publication = require("../models/publication");

//Importar servicios
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const validate = require("../helpers/validate");

// const { Collection } = require("mongoose")


// Acciones de prueba
const pruebaUser = (req, res) => {

    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    })

}

// Registro de usuarios
const register = (req, res) => {

    // Recoger datos de la peticion
    let params = req.body;


    // Comprobar que me llegue bien(+ validacion)

    if (!params.name || !params.email || !params.password || !params.nick) {

        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"

        });

    }

    // Validacion avanzada
    try{
        validate(params)


    }
    catch(error){
        return res.status(400).json({
            status: "error",
            message:"Validacion no superada"
        })

    }



    // Control usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() }
        ]
    }).exec().then(async (users) => {

        // if (error) return res.status(500).json({
        //     status: "error en la consulta",
        //     message: "Error en la consulta de usuarios"
        // })

        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })

        }

        // Cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10)

        params.password = pwd;

        //Crear objeto de usuario
        let user_to_save = new User(params);


        // Guardar resultados en la bd
        user_to_save.save().then((userStored) => {

            if (!userStored) {
                return res.status(500).json({
                    status: "error",
                    message: "Error al guardar el usuario"
                })

            }

            // Devolver resultados

            return res.status(200).json({
                status: "success",
                message: "Usario registrado correctamente",
                user: userStored

            });


        })
            .catch(error => {
                return res.status(500).json({
                    status: "error",
                    message: "Error al guardar el usuario"
                })
            })




    })

        .catch(error => {
            return res.status(500).json({
                status: "error",
                message: "Error en la consulta de usuarios"
            })
        })


}

const login = (req, res) => {

    // Recoger parametros body
    let params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "faltan datos por enviar"

        })
    }

    //Buscar en la bd si existe
    User.findOne({ email: params.email })
        // .select({"password":0})    // seleccionar quiero que lleguen y que no
        .exec().then((user) => {
            if (!user) {
                return res.status(400).send({
                    status: "error",
                    message: "No existe el usuario"
                })
            }

            //Comprobar contraseña 
            const pwd = bcrypt.compareSync(params.password, user.password)

            if (!pwd) {
                return res.status(400).send({
                    status: "error",
                    message: "No te has identificado correctamente"
                })
            }

            //Conseguir el token
            const token = jwt.createToken(user);


            //Devolver datos de usuario

            return res.status(200).send({
                status: "success",
                message: "Te has identificado correctamente",
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick
                },
                token
            })

        })
        .catch(error => {
            return res.status(500).json({
                status: "error",
                message: "Error en la consulta de login"
            })
        })


}

const profile = async (req, res) => {

    // Recibir el parametro del id usuario por la url
    const id = req.params.id;

    // Consultar para sacar los datos del usuario
    User.findById(id)
        .select({ password: 0, role: 0 })
        .exec().then(async (userProfile) => {

            if (!userProfile) {

                return res.status(400).send({
                    status: "error",
                    message: "El usuario no existe o hay un error"
                })
            }

            // Devolver el resultado
            const followInfo = await followService.followThisUser(req.user.id,id)

            



            // Posteriormente devolver informacion de follow
            return res.status(200).send({
                status: "success",
                user: userProfile,
                following: followInfo.following,
                follower: followInfo.follower
                
            })

        })

        .catch(error => {
            return res.status(500).json({
                status: "error",
                message: "Error en la consulta profile"
            })
        })




}





const list = (req, res) => {



    const options = {
        page: parseInt(req.params.page) || 1,
        limit: 5,
        select: "-password -role -email -__v",
        sort:  "_id" 

    }

    // if(req.params.page){
    //     options.page = parseInt(req.params.page)
    // }



    User.paginate({}, options).then(async (users) => {

        if (!users) {

            return res.status(400).send({
                status: "error",
                message: "La lista no existe o hay un error",
                error
            })

        }


        // Sacar un array de ids de los usuarios que me siguen y los que sigo como lua
        let followUserIds = await followService.followUserIds(req.user.id);

        // Devolver resultado (posteriormente-info-follow)
        return res.status(200).send({
            status: "success",
            users,
            totalDocs: users.totalDocs,
            page: users.page,
            limite: users.limit,
            totalPages: users.totalPages,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
            // totalDocs,
            // limit,
            // totalPages,
            // page

        })
    })



}

const update = (req, res) => {

    // Recoger info del usuario o actualizar
    let userIdentity = req.user;
    let userToUpdate = req.body;

    // Eliminar campos sobrantes
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;


    // Comprobar si el usuario ya existe
    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() }
        ]
    }).exec().then(async (users) => {


        let userIsset = false;

        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIdentity = true;

        });

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })

        }

        // Cifrar la contraseña - si me llega la password cifrarla
        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10)

            userToUpdate.password = pwd;

        }else{
            delete userToUpdate.password;
  
        }

        // Buscar y actualizar

        try {

            let userToUpdated = await User.findByIdAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true });

            if (!userToUpdated) {

                return res.status(400).json({
                    status: "error",
                    message: "Error al actualizar"

                })

            }

            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Metodo de actualizar usuario",
                user: userToUpdated
            })

        } catch (error) {

            return res.status(500).send({
                status: "error",
                message: "Error al actualizar usuario"

            })


        }



    });



}

const upload = (req, res) => {

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
    User.findByIdAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true }).then((userToUpdated) => {

        if (!userToUpdated) {

            return res.status(400).send({
                status: "error",
                message: "Error en la subida de imagen"
            })

        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            user: userToUpdated,
            file: req.file,




        })


    })

        .catch(error => {
            return res.status(500).send({
                status: "error",
                message: "Error en el metodo upload",
            })

        })



}

const avatar = (req, res) => {

    // Sacar el paramtro de una url
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = "./uploads/avatars/" + file

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

const counters = async (req, res) => {

    let userId = req.user.id

    if (req.params.id) {
        userId = req.params.id;
    }

    try {

        const following = await Follow.countDocuments({ "user": userId });

        const followed = await Follow.countDocuments({ "followed": userId });

        const publications = await Publication.countDocuments({"user": userId});
      
        return res.status(200).send({
            userId,
            following: following,
            followed: followed,
            publications: publications
        })

    } catch (error) {

        return res.status(400).send({
            status: "error",
            message: "Error en los contadores",
            error
        })

    }


}

// Exportar acciones

module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}