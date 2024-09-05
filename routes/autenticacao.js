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
        const user = new User(req.body);
       
        await user.save();

        console.log('Usuário cadastrado com sucesso: '+user._id);

        req.body.autorizacao = {};
        req.body._id = user._id;
        req.body.autorizacao.token = await gerarToken(req.body, '40m');

        res.status(200).send(req.body);

      } catch (error) {
        tratamentoErro(error, res);
      }
    });

    // http://localhost:3000/login      
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
          throw new Error("Não foi encontrado nenhum usuário com a credencial infomada");
        }

        const senhaCorreta = await bcrypt.compare(senha, user.senha);

        if (!senhaCorreta) {
          throw new Error("Usuário ou senha incorreta");
        }

        const dadosToken = {_id: user._id };
        req.body.autorizacao = {};
        req.body.autorizacao.token = await gerarToken(dadosToken, '40m');
        
        res.status(200).json(req.body);
      } catch (error) {
        error.code = 401;
        tratamentoErro(error,res);
      }
    });

    return router;
};