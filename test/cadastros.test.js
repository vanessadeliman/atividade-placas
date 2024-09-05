const request = require('supertest');
const app = require('../server.js');
const { Placas } = require('../schemas/schemas'); 
const path = require('path');

let authToken;

// Testes para a rota /cadastro
describe('POST /cadastro', () => {
  it('Deve cadastrar um novo usuário', async () => {
    const res = await request(app)
      .post('/cadastro')
      .send({
        email: 'teste@gmail.com',
        senha: '123456789',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('autorizacao');

    authToken = res.body.autorizacao;
  });

  it('Deve falhar ao tentar cadastrar um usuário sem email', async () => {
    const res = await request(app)
      .post('/cadastro')
      .send({
        senha: '12345678',
      });

    expect(res.statusCode).toBe(400); 
    expect(res.body).toHaveProperty('error', 'E-mail é obrigatório');
  });
});

// Testes para a rota /login
describe('GET /login', () => {
  it('Deve fazer login com credenciais corretas', async () => {
    const res = await request(app)
      .get('/login')
      .set('Authorization', 'Basic ' + Buffer.from('teste@gmail.com:123456789').toString('base64'));

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('autorizacao');

    authToken = res.body.autorizacao;
  });

  it('Deve falhar ao fazer login com senha incorreta', async () => {
    const res = await request(app)
      .get('/login')
      .set('Authorization', 'Basic ' + Buffer.from('teste@gmail.com:senhaerrada').toString('base64'));

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Usuário ou senha incorreta');
  });

  it('Deve falhar ao fazer login com email não registrado', async () => {
    const res = await request(app)
      .get('/login')
      .set('Authorization', 'Basic ' + Buffer.from('emailnaoexiste@gmail.com:12345678').toString('base64'));

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', "Usuário não encontrado");
  });
});

// Testes para a rota /cadastroPlaca
describe('POST /cadastroPlaca', () => {
  it('deve cadastrar uma placa com sucesso', async () => {
    const response = await request(app)
      .post('/cadastroPlaca')
      .set('Authorization', 'Bearer ' + authToken)
      .field('cidade', 'crato')
      .attach('foto', path.join(__dirname, 'test-image.png')); 

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Placa cadastrada com sucesso!');
  });

  it('deve retornar erro se o arquivo não for enviado', async () => {
    const response = await request(app)
      .post('/cadastroPlaca')
      .set('Authorization', 'Bearer ' + authToken)
      .field('cidade', 'crato');

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Nenhum arquivo enviado');
  });
});

// Testes para a rota /relatorio/cidade/:cidade
describe('GET /relatorio/cidade/:cidade', () => {
  beforeAll(async () => {
    await Placas.create({
      placa: 'ABC123',
      cidade: 'crato',
      data: new Date(),
    });
  });

  it('deve gerar um PDF com sucesso', async () => {
    const response = await request(app)
      .get('/relatorio/cidade/crato')
      .set('Authorization', 'Bearer ' + authToken);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
  });

  it('deve retornar erro se nenhum registro for encontrado', async () => {
    const response = await request(app)
      .get('/relatorio/cidade/NonExistentCity')
      .set('Authorization', 'Bearer ' + authToken);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Nenhum registro encontrado para essa cidade.');
  });
});

// Testes para a rota /consulta/:placa
describe('GET /consulta/:placa', () => {
  beforeAll(async () => {
    await Placas.create({
      placa: 'PMR5G98',
      cidade: 'Rio de Janeiro',
      data: new Date(),
    });
  });

  it('deve encontrar uma placa com sucesso', async () => {
    const response = await request(app)
      .get('/consulta/PMR5G98')
      .set('Authorization', 'Bearer ' + authToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Placa encontrada no banco de dados.');
  });

  it('deve retornar erro se a placa não for encontrada', async () => {
    const response = await request(app)
      .get('/consulta/NonExistentPlate')
      .set('Authorization', 'Bearer ' + authToken);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Placa não encontrada no banco de dados.');
  });
});

// Testes para a rota /videoTutorial
describe('POST /videoTutorial', () => {
  it('deve enviar um vídeo com sucesso', async () => {
    const response = await request(app)
      .post('/videoTutorial')
      .set('Authorization', 'Bearer ' + authToken)
      .attach('video', path.join(__dirname, 'test-video.mp4')); 

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Vídeo enviado com sucesso');
  });

  it('deve retornar erro se o arquivo de vídeo não for enviado', async () => {
    const response = await request(app)
      .post('/videoTutorial')
      .set('Authorization', 'Bearer ' + authToken);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Nenhum arquivo enviado');
  });
});

// Testes para a rota /videoTutorial/:filename
describe('GET /videoTutorial/:filename', () => {
  beforeAll(async () => {
    await request(app)
      .post('/videoTutorial')
      .set('Authorization', 'Bearer ' + authToken)
      .attach('video', path.join(__dirname, 'test-video.mp4')); 
  });

  it('deve servir um vídeo com sucesso', async () => {
    const response = await request(app)
      .get('/videoTutorial/1725542454124.mp4') 
      .set('Authorization', 'Bearer ' + authToken);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('video/mp4');
  });

  it('deve retornar erro se o vídeo não for encontrado', async () => {
    const response = await request(app)
      .get('/videoTutorial/NonExistentVideo.mp4')
      .set('Authorization', 'Bearer ' + authToken);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Vídeo não encontrado');
  });
});
