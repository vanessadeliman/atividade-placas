const express = require('express');
const mongoose = require('mongoose');
const cadastros = require('./routes/cadastros');
const cadastroUser = require('./routes/autenticacao');
const app = express();
const port = process.env.PORT || 3000;

// URL de conexão ao MongoDB
const uri = `mongodb+srv://vanessalima:${process.env.SENHA}@cluster0.qk4ag.mongodb.net/atividade-placas`;

async function main() {
  try {
    mongoose.connect(uri)
    .then(() => console.log('Conectado ao MongoDB...'))
    .catch(err => console.error('Não foi possível conectar ao MongoDB...', err));
      app.get('/', (req, res) => {
        res.json({ message: 'Bem-vindo' });
      });
      // Mapeamento das rotas
      app.use(express.json());
      app.use(cadastroUser());
      app.use(cadastros());
  
      // Iniciar o servidor Express
      app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
      });
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);

// Garantir que o cliente do MongoDB seja fechado quando o Node.js for encerrado
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit();
});

module.exports = app;