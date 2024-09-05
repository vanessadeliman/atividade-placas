const express = require('express');
const validaToken = require('../middlewares/valida_token');
const validaUsuario = require('../middlewares/valida_usuario');
const { Placas } = require('../schemas/schemas');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const PDFDocument = require('pdfkit');

const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../node_modules', 'tesseract.js-core');

// Configuração do Multer para armazenar arquivos na memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

fs.readdir(directoryPath, (err, files) => {
  if (err) {
      console.error('Erro ao listar arquivos:', err);
      return;
  }

  console.log('Arquivos no diretório:', files);
});

// Função para reconhecimento de texto com Tesseract
async function recognizeText(buffer) {
try {
  const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
    logger: info => console.log(info),
    wasmPath: "/wasm/tesseract-core-simd.wasm"
  });
  return text;
  } catch (error) {
    console.error('Erro ao reconhecer o texto:', error);
    throw error;
  }
}


// Diretório para armazenar vídeos (se necessário)
const videosDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir);
}

// Função para salvar o vídeo
function saveVideo(buffer, filename) {
  const filePath = path.join(videosDir, filename);
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
}

// Exporte o router para ser usado em outro lugar
module.exports = function() {
    const router = express.Router();

    router.post('/cadastroPlaca', [validaToken()], upload.single('foto'), async (req, res) => {
      try {
        const cidade = req.body.cidade;
        if (!req.file) {
          return res.status(400).json({ message: 'Nenhum arquivo enviado' });
        }

        const fileBuffer = req.file.buffer; // Buffer da imagem
    
        // Usar Tesseract para OCR na imagem
        const text = await recognizeText(fileBuffer).catch(err => {
          console.error('Erro ao reconhecer texto:', err);
          res.status(500).json({ message: 'Erro ao reconhecer texto' });
          return;
        });
    
        const placa = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); // Processar o texto OCR para extrair a placa
    
        // Preparar os dados para armazenar no MongoDB
        const dataPlaca = {
          placa: placa,
          cidade: cidade,
          data: new Date(),
        };
    
        await Placas.create(dataPlaca);
    
        res.status(201).json({ message: 'Placa cadastrada com sucesso!', data: dataPlaca });
      } catch (error) {
        console.error('Erro ao processar a imagem:', error);
        res.status(500).json({ message: 'Erro ao cadastrar a placa', error });
      }
    });


  // Rota para gerar o PDF com base na cidade
  router.get('/relatorio/cidade/:cidade', [validaToken()], async (req, res) => {
    try {
      const cidade = req.params.cidade;

      // Buscar os registros com base na cidade
      const registros = await Placas.find({ cidade: cidade });

      if (registros.length === 0) {
        return res.status(404).json({ message: 'Nenhum registro encontrado para essa cidade.' });
      }

      // Criar o documento PDF
      const doc = new PDFDocument();

      // Configurar a resposta HTTP para download do PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_${cidade}.pdf`);

      // Pipe do PDF para a resposta HTTP
      doc.pipe(res);

      // Adicionar conteúdo ao PDF
      doc.fontSize(18).text(`Relatório de Placas - Cidade: ${cidade}`, { align: 'center' });
      doc.moveDown();

      registros.forEach(registro => {
        doc.fontSize(12).text(`Placa: ${registro.placa}`);
        doc.text(`Cidade: ${registro.cidade}`);
        doc.text(`Data e Hora: ${new Date(registro.data).toLocaleString()}`);
        doc.moveDown();
      });

      // Finalizar o documento PDF
      doc.end();

    } catch (error) {
      console.error('Erro ao gerar o PDF:', error);
      res.status(500).json({ message: 'Erro ao gerar o PDF', error });
    }
  });

  router.get('/consulta/:placa', [validaToken()], async (req, res) => {
    try {
      const placa = req.params.placa.toUpperCase();

      const registro = await Placas.findOne({ placa: placa });

      if (registro) {
        res.status(200).json({ message: 'Placa encontrada no banco de dados.', registro });
      } else {
        res.status(404).json({ message: 'Placa não encontrada no banco de dados.' });
      }
    } catch (error) {
      console.error('Erro ao consultar a placa:', error);
      res.status(500).json({ message: 'Erro ao consultar a placa', error });
    }
  });

  // Rota POST para enviar o vídeo
  router.post('/videoTutorial', upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      const filename = Date.now() + path.extname(req.file.originalname);
      const filePath = await saveVideo(req.file.buffer, filename);

      res.status(201).json({ message: 'Vídeo enviado com sucesso', filePath });
    } catch (error) {
      console.error('Erro ao enviar o vídeo:', error)
      res.status(500).json({ message: 'Erro ao enviar o vídeo', error });
    }
  });


  // Rota para servir o vídeo
  router.get('/videoTutorial/:filename', (req, res) => {
    const filePath = path.join(videosDir, req.params.filename);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return res.status(404).json({ message: 'Vídeo não encontrado' });
      }

      res.sendFile(filePath);
    });
  });
    return router;
};