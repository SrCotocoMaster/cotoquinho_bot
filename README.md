# Cotoquinho: Ecossistema de Bot para Discord 🐻🚀

Este é um ecossistema completo e profissional para gerenciamento de um Bot de Discord, incluindo um Backend modular, Banco de Dados persistente e um Dashboard Web premium com login real via Discord.

## 🚀 Estrutura do Projeto

- **`server/`**: Backend em Node.js (Discord.js v14 + Express).
  - Sistema modular de comandos (Slash Commands) e eventos.
  - Banco de Dados MongoDB para persistência de comandos customizados.
  - API de autenticação OAuth2 e integração segura para n8n.
- **`client/`**: Dashboard Frontend em React (Vite).
  - UI de alta qualidade com Glassmorphism e tema escuro.
  - Totalmente responsivo (Mobile-First).
  - Controle de status, envio de mensagens e gerenciador de comandos.
- **`docker-compose.yml`**: Orquestração completa (Node + React + MongoDB).

---

## ⚙️ Guia de Configuração (.env)

Para o sistema funcionar, você deve criar um arquivo `.env` na raiz da pasta `app/`. Abaixo explicamos onde encontrar cada informação:

| Variável | Descrição | Onde buscar? |
| :--- | :--- | :--- |
| **`DISCORD_TOKEN`** | O token secreto do seu bot. | [Developer Portal](https://discord.com/developers/applications) > Selecione seu App > **Bot** > Reset Token. |
| **`CLIENT_ID`** | ID de aplicação do seu bot. | [Developer Portal](https://discord.com/developers/applications) > Selecione seu App > **General Information** > Application ID. |
| **`GUILD_ID`** | ID do servidor onde o bot operará. | No Discord: Configurações > Avançado > **Modo Desenvolvedor (Ativar)**. Clique com o botão direito no seu Servidor > **Copiar ID**. |
| **`DISCORD_CLIENT_SECRET`** | Chave secreta para login (OAuth2). | [Developer Portal](https://discord.com/developers/applications) > Selecione seu App > **OAuth2** > General > Reset Secret. |
| **`REDIRECT_URI`** | URL de retorno após o login. | Deve ser exatamente: `http://localhost:3000/api/auth/discord/callback`. (Cadastre esta URL em **OAuth2 > Redirects** no Portal). |
| **`INTERNAL_API_KEY`** | Chave de segurança sua. | Crie qualquer frase/senha forte. Será usada para validar o **n8n** e gerar sessões no painel. |
| **`MONGODB_URI`** | Link de conexão do banco. | Mantenha o padrão: `mongodb://mongodb:27017/cotoquinho`. |

---

## 🐳 Como Executar (Docker)

Com o Docker instalado, execute na pasta `app/`:

```bash
docker-compose up -d --build
```

### Acesso ao Sistema:
- **Dashboard Web:** [http://localhost](http://localhost) (Porta 80)
- **Status da API:** [http://localhost:3000/health](http://localhost:3000/health)

---

## 🔗 Integração com n8n

Você pode disparar mensagens pelo bot via n8n enviando um POST:

- **Endpoint:** `POST http://localhost:3000/api/send-message`
- **Auth:** Header `x-api-key` com o valor da sua `INTERNAL_API_KEY`.
- **Exemplo de Payload:**
  ```json
  {
    "channelId": "ID_DO_CANAL_AQUI",
    "message": "Mensagem vinda do n8n!"
  }
  ```

---

## 🛡️ Segurança & Boas Práticas

- **Segredos Protegidos:** Nenhuma chave está no código; tudo via `.env`.
- **UX Responsiva:** O painel foi desenhado primeiro para celulares e adaptado para desktop.
- **Sincronização:** Comandos criados no site são registrados automaticamente como Slash Commands no Discord.

---
*Desenvolvido pela equipe Cotoquinho com foco em escalabilidade e UX Premium.*
