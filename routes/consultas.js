const express = require('express');


// Exporte o router para ser usado em outro lugar
module.exports = function() {
    const router = express.Router();
    router.use([validaToken(), validaUsuario()]);

};


