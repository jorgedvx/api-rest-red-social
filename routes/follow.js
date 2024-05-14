const express = require("express");
const router = express.Router();
const followController = require("../controllers/follow");
const check = require("../middlewares/auth");
const { use } = require("./user");

// Definir rutas

router.get("/prueba-follow", followController.pruebaFollow);
router.post("/save", check.auth, followController.save)
router.delete("/unfollow/:id",check.auth, followController.unFollow);
router.get("/following/:id?/:page?",check.auth, followController.following);
router.get("/followers/:id?/:page?",check.auth, followController.followers);

// Exportar router
module.exports = router;