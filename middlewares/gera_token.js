require('dotenv').config();
const jwt = require('jsonwebtoken');

async function gerarToken(user, tempo){
    console.log("Gerando acessToken");
    const acessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: tempo });
    console.log('AcessToken: '+acessToken);

    return acessToken;
}

module.exports = gerarToken;