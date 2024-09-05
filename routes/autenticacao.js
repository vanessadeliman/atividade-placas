const express = require('express');
const { User } = require('../schemas/schemas');
const bcrypt = require('bcrypt'); 
const tratamentoErro = require('../tratamento_erro/tratamento');
const gerarToken = require('../middlewares/gera_token');

module.exports = function() {

  const router = express.Router();

    // http://localhost:3000/registro      
    // {
    //     "email":"vanessa@gmail.com",
    //     "senha":"12345678"
    // }
    router.post('/cadastro', async (req, res) => {
      try {

        console.log('Iniciando cadastro de novo usuário');
        const existingUser = await User.findOne({ email: req.body.email });
    
        if (existingUser) {
          return res.status(409).json({ error: 'Usuário já cadastrado' });
        }
        
        if(!req.body.email){
          return res.status(400).json({ error: 'E-mail é obrigatório' });
        }

        const user = new User(req.body);
       
        await user.save();

        console.log('Usuário cadastrado com sucesso: '+user._id);

        const token = await gerarToken(req.body, '40m');

        res.status(200).send({ autorizacao : token});

      } catch (error) {
        tratamentoErro(error, res);
      }
    });

  router.get('/login', async (req, res) => {
  // Obter o cabeçalho Authorization
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Cabeçalho de autenticação ausente' });
  }

  // Extrair o esquema e as credenciais
  const [scheme, credentials] = authHeader.split(' ');

  if (scheme !== 'Basic') {
    return res.status(401).json({ error: 'Esquema de autenticação não suportado' });
  }

  // Decodificar as credenciais
  const [email, senha] = Buffer.from(credentials, 'base64').toString().split(':');

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Verificar a senha
    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Usuário ou senha incorreta' });
    }

    // Gerar o token
    const dadosToken = { _id: user._id };
    const token = await gerarToken(dadosToken, '40m');

    // Retornar a resposta de sucesso
    res.status(200).json({autorizacao:token});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

    return router;
};