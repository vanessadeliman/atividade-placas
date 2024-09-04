const { User } = require('../schemas/schemas');

// Exporte o router para ser usado em outro lugar
module.exports = function() {
    const verificarUsuario = async (req, res, next) => {
        if (!req.user) {
          return res.status(403).send({ error: 'Usuário inválido ou ausente' });
        }
      
        try {
            const user = await User.findById(req.user.userId).exec();
            if (!user) {
                return res.status(403).send({ error: 'Usuário inválido ou não possui autorização de acesso' });
            }else{
                return next();
            }
        } catch (error) {
            return res.status(401).send({ error: "Usuário inválido ou não possui autorização de acesso" });
        }
      };
    
    return verificarUsuario; 
};