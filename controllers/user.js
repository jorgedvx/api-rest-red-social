// importar dependecias y modulos
const bcrypt = require("bcrypt");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

//Importar modelos
const User = require("../models/user");
const Follow = require("../models/follow");
const Publication = require("../models/publication");

//Importar servicios
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const validate = require("../helpers/validate");
const { uploadImageUser, deleteImage } = require("../database/cloudinary");

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
    try {
        validate(params)


    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Validacion no superada"
        })

    }



    // Control usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() }
        ]
    }).exec().then(async (users) => {


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
            const followInfo = await followService.followThisUser(req.user.id, id)





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
        sort: "_id"

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

        } else {
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

const upload = async (req, res) => {

    // Recoger id del parametro


    // Recoger el fichero de imagen y comprobar que existe
    if (!req.files && !req.file) {

        return res.status(400).json({
            status: "error",
            mensaje: "Seleccione una imagen"
        });
    }

    // Conseguir el nombre del archivo
    let archivo = req.files.image.name


    // Sacar la extension del archivo
    const imageSplit = archivo.split("\.");
    const extension = imageSplit[1];

    // Comprobar extension Si no es correcto
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo diferent
        // const filePath = req.file.path;
        // const fileDeleted = fs.unlinkSync(filePath)
        
        fs.unlink(req.files.image.tempFilePath, (error) => {


            // Devolver respuesta negativa
            return res.status(400).send({
                status: "error",
                message: "Extension del fichero invalido"
            })
        })

    } else {

        try {



            if (req.files?.image) {

                const result = await uploadImageUser(req.files.image.tempFilePath)

                

                const userAntiguo = await User.findById({ _id: req.user.id })

                // console.log(req.files)
                

                // Si es correcto, guardar en la bd
                User.findOneAndUpdate({ _id: req.user.id }, { public_id: result.public_id, secure_url: result.secure_url, image: req.files.image.name }, { new: true }).then(async (userToUpdated) => {

                    if (!userToUpdated) {

                        return res.status(400).send({
                            status: "error",
                            message: "Error en la subida de imagen"
                        })

                    }


                    fse.unlinkSync(req.files.image.tempFilePath)
                    console.log(userAntiguo.image)
                    console.log(userAntiguo.public_id)

                    if (userAntiguo.image !== "default.png") {


                        await deleteImage(userAntiguo.public_id)



                    }



                    // Devolver respuesta
                    return res.status(200).send({
                        status: "success",
                        user: userToUpdated,
                        file: req.files,




                    })


                })

                    .catch((error) => {
                        return res.status(500).send({
                            status: "error",
                            message: "Error en el metodo upload",
                            error: error.message  // Message of error
                            
                        })

                    })

                // .catch(function(error){
                //     console.log(error)
                // })

            }

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }



}

const avatar = async(req, res) => {

    // // Sacar el paramtro de una url
    // const file = req.params.file;

    // // Montar el path real de la imagen
    // const filePath = "./uploads/avatars/" + file

    // // Comprobar que existe
    // fs.stat(filePath, (error, exists) => {

    //     if (!exists) {

    //         return res.status(400).send({
    //             status: "error",
    //             message: "No existe la imagen"
    //         })

    //     }

    //     // Devolver un file

    //     return res.sendFile(path.resolve(filePath));


    // })

    // Conseguir parametro file(id)
    let userId = req.params.file


    await User.findById({ _id: userId }).then(async (usuario) => {

        if(!usuario.secure_url){

            return res.status(402).json({
                status: "No existe la imagen",          
            })

        }

        let secure_url = await usuario.secure_url

        return res.status(200).json({
            secure_url

        })

    })

    .catch((error)=>{

        return res.status(400).json({
            status: "Accion fallida",
            error: error.message
        })
        
        
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

        const publications = await Publication.countDocuments({ "user": userId });

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