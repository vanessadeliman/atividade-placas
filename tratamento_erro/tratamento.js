const erroMongoose = require('../tratamento_erro/erro_mongoose');
const erroMongo = require('../tratamento_erro/erro_mongodb');
const { default: mongoose } = require('mongoose');
const { MongoError } = require('mongodb');

module.exports = function tratamentoErro(error, res) {
    console.error(error);
    if(error instanceof mongoose.Error.ValidationError) {
      erroMongoose(error, res);
    } else if(error instanceof MongoError) {
      erroMongo(error, res);
    } else{
        const codigo = error.code ?? 500;
        const erro = error.message;
        res.status(codigo).send({"error":erro});
    }
}