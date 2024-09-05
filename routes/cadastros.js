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

// Exporte o router para ser usado em outro lugar
module.exports = function() {
    const router = express.Router();

    router.post('/cadastroPlaca', [validaToken(), validaUsuario()], upload.single('foto'), async (req, res) => {
      try {
        const cidade = req.body.cidade;
        const fileBuffer = req.file.buffer; // Buffer da imagem
    
        // Usar Tesseract para OCR na imagem
        const text = await recognizeText(fileBuffer);
        const placa = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); // Processar o texto OCR para extrair a placa
    
        // Preparar os dados para armazenar no MongoDB
        const dataPlaca = {
          placa: placa,
          cidade: cidade,
          data: new Date(),
        };
    
        await Placas.insertOne(dataPlaca);
    
        res.status(201).json({ message: 'Placa cadastrada com sucesso!', data: dataPlaca });
      } catch (error) {
        console.error('Erro ao processar a imagem:', error);
        res.status(500).json({ message: 'Erro ao cadastrar a placa', error });
      }
    });


  // Rota para gerar o PDF com base na cidade
  router.get('/relatorio/cidade/:cidade', [validaToken(), validaUsuario()], async (req, res) => {
    try {
      const cidade = req.params.cidade;

      // Buscar os registros com base na cidade
      const registros = await Placas.find({ cidade: cidade }).toArray();

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

  router.get('/consulta/:placa', [validaToken(), validaUsuario()], async (req, res) => {
    try {
      const placa = req.params.placas.toUpperCase();

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

    return router;
};