const request = require('supertest');
const app = require('../main');
const actionService = require('../services/actionService');
const { getBombCount, resetBombCount, clearManualQueue } = require('../middleware/middleware');

describe('GET /action', () => {
  // ✅ Réinitialiser le compteur de bombes ET la queue manuelle avant chaque test
  beforeEach(() => {
    resetBombCount();
    clearManualQueue(); // ← AJOUTÉ pour éviter les interférences
  });

  it('devrait retourner une action et un mouvement valides', async () => {
    const response = await request(app)
      .get('/action')
      .expect(200);

    expect(response.body).toHaveProperty('action');
    expect(response.body).toHaveProperty('move');
    expect(response.body).toHaveProperty('source'); // ← AJOUTÉ
    expect(response.body).toHaveProperty('timestamp'); // ← AJOUTÉ

    // Vérifier que l'action est valide
    const validActions = ['COLLECT', 'NONE', 'BOMB'];
    expect(validActions).toContain(response.body.action);

    // Vérifier que le mouvement est valide
    const validMoves = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY'];
    expect(validMoves).toContain(response.body.move);

    // Vérifier que la source est automatique par défaut
    expect(response.body.source).toBe('automatic');
  });

  it('devrait accepter des paramètres via query string', async () => {
    const response = await request(app)
      .get('/action?action=COLLECT&move=UP')
      .expect(200);

    expect(response.body.action).toBe('COLLECT');
    expect(response.body.move).toBe('UP');
    expect(response.body.source).toBe('request'); // ← AJOUTÉ
  });

  it('devrait gérer les actions invalides', async () => {
    const response = await request(app)
      .get('/action?action=INVALID&move=INVALID')
      .expect(200);

    // Les actions invalides devraient être corrigées
    const validActions = ['BOMB', 'COLLECT', 'NONE'];
    const validMoves = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY'];
    
    expect(validActions).toContain(response.body.action);
    expect(validMoves).toContain(response.body.move);
  });
});

describe('Limite de bombes', () => {
  beforeEach(() => {
    resetBombCount();
    clearManualQueue(); // ← AJOUTÉ
  });

  it('devrait permettre jusqu\'à 3 bombes', async () => {
    // Poser 3 bombes
    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .get('/action?action=BOMB')
        .expect(200);
      expect(response.body.action).toBe('BOMB');
    }

    expect(getBombCount()).toBe(3);
  });

  it('devrait rejeter la 4ème bombe', async () => {
    // Poser 3 bombes d'abord
    for (let i = 0; i < 3; i++) {
      await request(app)
        .get('/action?action=BOMB')
        .expect(200);
    }

    // La 4ème devrait être rejetée
    const response = await request(app)
      .get('/action?action=BOMB')
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Limite de bombes atteinte');
  });
});

// ← NOUVEAUX TESTS pour le mode manuel
describe('Mode manuel', () => {
  beforeEach(() => {
    resetBombCount();
    clearManualQueue();
  });

  it('devrait permettre d\'ajouter une action manuelle', async () => {
    const response = await request(app)
      .post('/action')
      .send({
        manualAction: true,
        action: 'BOMB',
        move: 'UP'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.action).toBe('BOMB');
    expect(response.body.move).toBe('UP');
    expect(response.body.queueLength).toBe(1);
  });

  it('devrait utiliser les actions manuelles en priorité', async () => {
    // Ajouter une action manuelle
    await request(app)
      .post('/action')
      .send({
        manualAction: true,
        action: 'COLLECT',
        move: 'LEFT'
      })
      .expect(200);

    // La prochaine requête GET devrait retourner l'action manuelle
    const response = await request(app)
      .get('/action')
      .expect(200);

    expect(response.body.action).toBe('COLLECT');
    expect(response.body.move).toBe('LEFT');
    expect(response.body.source).toBe('manual');
  });

  it('devrait permettre de vider la queue manuelle', async () => {
    // Ajouter des actions manuelles
    await request(app)
      .post('/action')
      .send({
        manualAction: true,
        action: 'BOMB',
        move: 'UP'
      });

    // Vider la queue
    const response = await request(app)
      .post('/action')
      .send({ clearQueue: true })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Queue manuelle vidée - retour au mode automatique');

    // La prochaine action devrait être automatique
    const nextResponse = await request(app)
      .get('/action')
      .expect(200);

    expect(nextResponse.body.source).toBe('automatic');
  });

  it('devrait permettre de voir le statut', async () => {
    const response = await request(app)
      .get('/action?status=true')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('hasManualActions');
    expect(response.body).toHaveProperty('queueLength');
    expect(response.body).toHaveProperty('bombsUsed');
  });

  it('devrait permettre un reset complet', async () => {
    // Ajouter une action et poser une bombe
    await request(app).post('/action').send({
      manualAction: true,
      action: 'BOMB',
      move: 'UP'
    });
    
    await request(app).get('/action?action=BOMB');

    // Reset complet
    const response = await request(app)
      .post('/action')
      .send({ reset: true })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.bombsUsed).toBe(0);

    // Vérifier que tout est réinitialisé
    const statusResponse = await request(app)
      .get('/action?status=true')
      .expect(200);

    expect(statusResponse.body.hasManualActions).toBe(false);
    expect(statusResponse.body.bombsUsed).toBe(0);
  });
});

// Tests du service mis à jour
describe('getAction Service', () => {
  beforeEach(() => {
    resetBombCount();
    clearManualQueue(); // ← AJOUTÉ
  });

  it('devrait retourner une action par défaut si aucune n\'est fournie', () => {
    const result = actionService.getAction();
    
    expect(result).toHaveProperty('action');
    expect(result).toHaveProperty('move');
    expect(result).toHaveProperty('source'); // ← AJOUTÉ
    expect(result).toHaveProperty('timestamp'); // ← AJOUTÉ
    
    const validActions = ['BOMB', 'COLLECT', 'NONE'];
    const validMoves = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY'];
    
    expect(validActions).toContain(result.action);
    expect(validMoves).toContain(result.move);
    expect(result.source).toBe('automatic'); // ← AJOUTÉ
  });

  it('devrait utiliser les paramètres fournis s\'ils sont valides', () => {
    const result = actionService.getAction('COLLECT', 'UP');
    
    expect(result.action).toBe('COLLECT');
    expect(result.move).toBe('UP');
    expect(result.source).toBe('request'); // ← AJOUTÉ
  });

  it('devrait corriger les paramètres invalides', () => {
    const result = actionService.getAction('INVALID_ACTION', 'INVALID_MOVE');
    
    const validActions = ['BOMB', 'COLLECT', 'NONE'];
    const validMoves = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY'];
    
    expect(validActions).toContain(result.action);
    expect(validMoves).toContain(result.move);
  });
});