# Dash de Lançamento — Frontend

HTML estático servido pelo Cloudflare Pages. Sem build, sem dependência.

## Estrutura

```
index.html      <- a dash (login + home)
captura.html    <- página de captura de leads
```

## Configuração

Nenhuma chave vive aqui. Só o endereço do Worker, no topo do script:

**index.html**
```js
var API = 'https://dash.luishalendardash.workers.dev';
```

**captura.html**
```js
var WORKER   = 'https://dash.luishalendardash.workers.dev';
var SECRET   = 'seu WEBHOOK_SECRET';   // só monta o link do grupo
var LANCAMENTO = 'lanc-2026-09';       // trocar a cada lançamento
```

## Deploy no Pages

| Campo | Valor |
|---|---|
| Build command | (vazio) |
| Build output directory | `/` |
| Root directory | (vazio) |

Depois do primeiro deploy, pegue a URL de produção e cadastre em
`ORIGENS_PERMITIDAS` no Worker — **sem barra no final**.

## Atenção com URLs de preview

Cada deploy gera uma URL própria (`https://a1b2c3.dashperito.pages.dev`).
Essas não estão na lista de origens permitidas, então a dash não funciona
nelas. Teste sempre pela URL de produção.
