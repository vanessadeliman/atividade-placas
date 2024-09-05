const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const saltRounds = 10;

const userSchema = new mongoose.Schema({
    email: { type: String, required: [true, 'O campo email é obrigatório.'], unique: true },
    senha: {
        type: String,
        required: [true, 'O campo senha é obrigatório.'],
        minlength: [8, 'A senha deve ter no mínimo 8 caracteres']
      }
});

// Middleware para hashear a senha antes de salvar o usuário
userSchema.pre('save', function(next) {
    
    const user = this;

    // Somente hasheia a senha se ela foi modificada (ou é nova)
    if (!user.isModified('senha')) return next();

    // Gera um sal e hasheia a senha
    bcrypt.genSalt(saltRounds, function(err, salt) {
            if (err){
                console.log(err);
                return next(err);
            };

            bcrypt.hash(user.senha, salt, function(err, hash) {
            if (err){
                console.log(err);
                return next(err);
            };

            // Substitui a senha inserida pelo hash
            user.senha = hash;
            next();
            });
        });
    });


const placaSchema = new mongoose.Schema({
    placa: { type: String },
    cidade: { type: String },
    data: { type: Date }
});

module.exports = {
    User: mongoose.model('user', userSchema),
    Placas: mongoose.model('placa', placaSchema)
}
