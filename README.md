# LIAr — Back-end

Back-end Node.js + Express para o projeto LIAr (Gerador de Vídeos com IA).

## Stack

- **Express** — servidor HTTP
- **Supabase** — autenticação (Auth) + banco de dados (histórico)
- **Magic Hour API** — geração de vídeo a partir de imagem (400 créditos grátis no cadastro!)

---

## Configuração

### 1. Instale as dependências

```bash
npm install
```

### 2. Crie o arquivo `.env`

```bash
cp .env.example .env
```

| Variável           | Onde pegar |
|--------------------|------------|
| `SUPABASE_URL`     | Supabase Dashboard → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY`| Supabase Dashboard → Project Settings → API → anon/public |
| `MAGICHOUR_KEY`    | [magichour.ai/settings/developer](https://magichour.ai/settings/developer) → Create API Key |

### 3. Crie a tabela no Supabase

No **Supabase Dashboard → SQL Editor**, execute o conteúdo do arquivo `supabase_migration.sql`.

### 4. Inicie o servidor

```bash
npm start       # produção
npm run dev     # desenvolvimento (auto-reload)
```

O servidor sobe em `http://localhost:3001`.

---

## Endpoints

### Auth

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/cadastro` | Cria conta |
| `POST` | `/api/auth/login`    | Login → retorna `access_token` |
| `POST` | `/api/auth/logout`   | Invalida sessão |

### Vídeos (requer `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/videos/gerar`     | Gera vídeo (multipart/form-data) |
| `GET`  | `/api/videos/historico` | Lista histórico do usuário |

**POST /api/videos/gerar — campos:**
- `imagem` — arquivo JPG/PNG/WEBP (obrigatório)
- `prompt` — descrição do vídeo (obrigatório)
- `duracao` — `"3 segundos"` / `"5 segundos"` / `"10 segundos"`
- `qualidade` — `"SD (480p)"` (free) / `"HD (720p)"` (pago)
- `fps` — `"24 FPS"` etc

---

## Sobre os créditos da Magic Hour

- Ao criar conta você ganha **400 créditos** de bônus + **100 créditos/dia**
- No plano gratuito a resolução máxima é **480p** e o modelo usado é **ltx-2.3**
- Um vídeo de 5 segundos consome aproximadamente **150 créditos**

---

## Observação

O front-end (`index.html`, `script.js`, `style.css`) fica na raiz do projeto.
Se o servidor rodar em outra URL, edite no topo do `script.js`:

```js
const API_BASE = 'http://localhost:3001/api';
```
