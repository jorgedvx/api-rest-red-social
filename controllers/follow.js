// Importar modelo
const { Collection } = require("mongoose")
const Follow = require("../models/follow")
const User = require("../models/user")

//Importar servicios
const followService = require("../services/followService")
const { locale } = require("moment")

// Acciones de prueba
const pruebaFollow = (req, res) => {

    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    })

}

// Accion de guardar un follow (seguir)
const save = (req, res) => {

    //Conseguir datos por body
    const params = req.body;

    // Sacar id del usuario identificado
    const identity = req.user;

    // Crear objeto con modelo follow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed

    });


    //Guardar objeto en bbdd
    userToFollow.save().then((followed) => {

        if (!followed) {
            return res.status(400).send({
                status: "error",
                message: "No se ah podidio seguir al usuario"

            })

        }
    })

    return res.status(200).send({
        status: "success",
        message: "Seguido con exito",
        identity: req.user,
        userToFollow
    })
}

// Accion de borrar un follow (dejar de seguir)
const unFollow = (req, res) => {

    // Recoger el id del usuario identificado
    const userId = req.user.id;

    // Recoger el id del usuario que sigo y quiero dejar de seguir
    const followedId = req.params.id;

    // find de las coincidencias y hacer remove
    Follow.deleteMany({
        "user": userId,
        "followed": followedId
    }).then((followDelete) => {

        if (!followDelete) {
            return res.status(500).send({
                status: "error",
                message: "No has dejado de seguir a nadie"

            })

        }


        return res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente"

        })

    })

        .catch(error => {
            return res.status(500).send({
                status: "error",
                message: "Error en el metodo unFollow",
            })

        })


}

// Accion listado de usuarios que cualquier usuario esta (siguiendo)

const following = (req, res) => {

    // Sacar el id del usuario identificado
    let userId = req.user.id;

    // Comprobar si me llega el id por parametro url
    if (req.params.id) userId = req.params.id;

    // Comprobar si me llega la pagina, si no la pagina 1
    // Usuarios por pagina quiero mostrar

    const myCustomLabels = {
        totalDocs: 'itemCount',
        docs: 'FollowingList',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pageCount',
        pagingCounter: 'slNo',
        meta: 'paginator',
    };

    const options = {
        page: (req.params.page) || 1,
        limit: 5,
        select: "-_id -created_at -__v",
        populate:{
            path: "user followed",
            select: '-password -role -email -__v',
            
        },
        customLabels: myCustomLabels,     
  
    };


    // Find o follow popular datos de los usuario y paginar con mongoose paginate
  Follow.paginate({user: userId},options, async (error, follows)=> {


        // Sacar un array de ids de los usuarios que me siguen y los que sigo como lua
        let followUserIds = await followService.followUserIds(req.user.id);


        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que estoy siguiendo",
            follows: follows.FollowingList,
            totalDocs: follows.paginator.itemCount,
            page: follows.paginator.currentPage,
            limite: follows.paginator.perPage,
            totalPages: follows.paginator.pageCount,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers

        })
    })


}



// Accion de listado de usuarios que se (soy siguido x )


const followers = (req, res) => {

    // Sacar el id del usuario identificado
    let userId = req.user.id;

    // Comprobar si me llega el id por parametro url
    if (req.params.id) userId = req.params.id;

    // Comprobar si me llega la pagina, si no la pagina 1

    // Usuarios por pagina quiero mostrar
    const myCustomLabels = {
        totalDocs: 'itemCount',
        docs: 'FollowingList',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pageCount',
        pagingCounter: 'slNo',
        meta: 'paginator',
    };

    const options = {
        page: parseInt(req.params.page) || 1,
        limit: 5,
        select: "-_id -created_at -__v",
        populate:{
            path: "user",
            select: '-password -role -email -__v',
            
        },
        customLabels: myCustomLabels,     
  
    };


    // Find o follow popular datos de los usuario y paginar con mongoose paginate

    Follow.paginate({followed: userId},options, async (error, follows)=> {

        // Listado de usuarios de jack y soy lua
        // Sacar un array de ids de los usuarios que me siguen y los que sigo como lua
        let followUserIds = await followService.followUserIds(req.user.id);


        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que me estan siguiendo",
            follows: follows.FollowingList,
            totalDocs: follows.paginator.itemCount,
            page: follows.paginator.currentPage,
            limite: follows.paginator.perPage,
            totalPages: follows.paginator.pageCount,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers

        })
    })


}


// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unFollow,
    following,
    followers


}