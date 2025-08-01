const request = require('supertest');
const app = require('../main');
const actionService = require('../services/actionService');
const { getBombCount, resetBombCount } = require('../middleware/middleware');

describe('GET /action', () => {
  // ✅ Réinitialiser le compteur de bombes avant chaque test
  beforeEach(() => {
    resetBombCount();
  });

        it('devrait retourner une action et un mouvement valides', async () => {
            const response = await request(app)
                .get('/action')
                .expect(200);

            expect(response.body).toHaveProperty('action');
            expect(response.body).toHaveProperty('move');
            expect(response.body).toHaveProperty('timestamp');

            // Vérifier que l'action est valide
            const validActions = ['COLLECT', 'NONE','BOMB'];
            expect(validActions).toContain(response.body.action);

            // Vérifier que le mouvement est valide
            const validMoves = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY'];
            expect(validMoves).toContain(response.body.move);
        });

        it('devrait accepter des paramètres via query string', async () => {
            const response = await request(app)
                .get('/action?action=COLLECT&move=UP')
                .expect(200);

            expect(response.body.action).toBe('COLLECT');
            expect(response.body.move).toBe('UP');
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


        describe('getAction', () => {
        it('devrait retourner une action par défaut si aucune n\'est fournie', () => {
            const result = actionService.getAction();
            
            expect(result).toHaveProperty('action');
            expect(result).toHaveProperty('move');
            
            const validActions = ['BOMB', 'COLLECT', 'NONE'];
            const validMoves = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY'];
            
            expect(validActions).toContain(result.action);
            expect(validMoves).toContain(result.move);
        });

        it('devrait utiliser les paramètres fournis s\'ils sont valides', () => {
            const result = actionService.getAction('COLLECT', 'UP');
            
            expect(result.action).toBe('COLLECT');
            expect(result.move).toBe('UP');
        });

        it('devrait corriger les paramètres invalides', () => {
            const result = actionService.getAction('INVALID_ACTION', 'INVALID_MOVE');
            
            const validActions = ['BOMB', 'COLLECT', 'NONE'];
            const validMoves = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY'];
            
            expect(validActions).toContain(result.action);
            expect(validMoves).toContain(result.move);
        });
    });