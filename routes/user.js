const express = require("express");
const router = express.Router();
const multer = require("multer");
const userController = require("../controllers/user");
const check = require("../middlewares/auth");

// Configuracion de subida
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "./uploads/avatars")

//     },
//     filename: (req, file, cb)=>{
//         cb(null, "avatar-"+Date.now()+"-"+file.originalname);

//     }
// });

// const upload = multer({storage});


// Definir rutas
router.get("/prueba-usuario", check.auth,  userController.pruebaUser);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile/:id", check.auth, userController.profile);
router.get("/list/:page?",check.auth, userController.list); // apge? parametro opcional
router.put("/update", check.auth, userController.update);
router.post("/upload", check.auth, userController.upload);
router.get("/avatar/:file", userController.avatar);
router.get("/counters/:id", check.auth, userController.counters);



// Exportar router
module.exports = router;