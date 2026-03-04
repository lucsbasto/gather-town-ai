Gather AI Clone - MVP
1. Visão Geral
Este projeto é um MVP de uma plataforma de interação espacial 2D, inspirado no Gather Town. O objetivo principal é permitir que avatares se movam em um mapa e ativem fluxos de áudio e vídeo automaticamente por proximidade.

2. Tecnologias Principais
Motor de Jogo: Phaser 3 para renderização e física de grid.

Comunicação: Socket.io para sincronização multijogador em tempo real.

Mídia (SFU): LiveKit para streaming de áudio e vídeo espacial.

Backend: Node.js (v16.20.0) e Express.

Banco de Dados: CockroachDB com Prisma ORM.

3. Pré-requisitos
Node.js: Versão exata 16.20.0. Recomendado usar nvm.

Yarn: Versão 3.2.4, ativado via corepack.

LiveKit Server: Instalado localmente para testes de vídeo.

Doppler CLI: Para gerenciamento de segredos e variáveis de ambiente.

4. Estrutura de Pastas Sugerida
/assets: Imagens, tilesets e áudios.

/src/scenes: Cenas do Phaser (Login, WaitingRoom, GameScene) .

/src/utils: Lógicas de colisão e cálculos de distância.

/server: Lógica do servidor Node.js e Socket.io .

5. Configuração e Instalação
Instale as dependências:

Bash
yarn install
Configure as variáveis de ambiente (LiveKit):

Snippet de código
LIVEKIT_API_KEY=<sua_key>
LIVEKIT_API_SECRET=<seu_secret>
LIVEKIT_WS_URL=wss://<seu-projeto>.livekit.cloud
``` [10]
Inicie o servidor de desenvolvimento:

Bash
yarn start
``` [11]

6. Contexto para IA (Prompting)
Este repositório utiliza arquivos Markdown específicos para guiar assistentes de IA (como Cursor e Claude):

Design.md: Regras de negócio e mecânicas de proximidade.

Architecture.md: Detalhes técnicos e fluxo de dados.

CLAUDE.md: Comandos de build e padrões de código.

Confirme para eu enviar o próximo arquivo (Architecture.md).
