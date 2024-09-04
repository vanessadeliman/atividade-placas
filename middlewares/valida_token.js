const jwt = require('jsonwebtoken');
require('dotenv').config();

// Exporte o router para ser usado em outro lugar
module.exports = function() {
    const verificarToken = (req, res, next) => {
        // Obtém o token do header da requisição
        const token = req.headers['authorization'];
      
        if (!token) {
          return res.status(403).send({ message: 'Token é necessário para autenticação' });
        }
      
        try {
          // Verifica o token
          const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET_KEY);
          req.user = decoded;
          return next();
          
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
              // Erro de token expirado
              return res.status(401).send({ message: "AcessToken expirado necessário realizar um novo login" });
            } else if (error instanceof jwt.JsonWebTokenError) {
              // Erro de token inválido
              return res.status(401).send({ message: "Token inválido" });
            } else {
              // Outros erros de verificação
              return res.status(401).send({ message: "Erro na autenticação" });
            }
        }
      };
    
    return verificarToken; 
};