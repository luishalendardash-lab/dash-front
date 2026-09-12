/**
 * Service worker da dash.
 *
 * Faz três coisas: permite instalar como app, guarda a interface para
 * abrir rápido, e recebe as notificações de push.
 *
 * O que ele NÃO faz: guardar dados do lançamento. Número de lead em
 * cache é pior que número nenhum — a pessoa olharia um valor velho
 * pensando que é o de agora.
 */

const VERSAO = 'dash-v1';
const CASCA = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icones/icone-192.png',
  '/icones/icone-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSAO)
      .then((cache) => cache.addAll(CASCA))
      // se algum arquivo falhar, a instalação continua: melhor um app
      // sem cache que um app que não instala
      .catch(() => null)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(
        chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);

  // Chamada de dados nunca sai do cache. Um lead a mais ou a menos
  // muda decisão de verba: valor velho é pior que tela vazia.
  const eDado = url.pathname.startsWith('/api/')
    || url.hostname.includes('workers.dev')
    || url.hostname.includes('supabase');

  if (eDado || evento.request.method !== 'GET') return;

  // A interface vem do cache primeiro, para abrir instantâneo, e é
  // atualizada em segundo plano.
  evento.respondWith(
    caches.match(evento.request).then((guardado) => {
      const daRede = fetch(evento.request)
        .then((resposta) => {
          if (resposta && resposta.status === 200) {
            const copia = resposta.clone();
            caches.open(VERSAO).then((c) => c.put(evento.request, copia));
          }
          return resposta;
        })
        .catch(() => guardado);

      return guardado || daRede;
    }),
  );
});

/**
 * Notificação de push.
 *
 * O corpo vem do Worker. Sem corpo legível, mostramos algo genérico em
 * vez de nada: notificação vazia parece defeito.
 */
self.addEventListener('push', (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { corpo: evento.data ? evento.data.text() : '' };
  }

  const titulo = dados.titulo || 'Dashboard do Perito';
  const opcoes = {
    body: dados.corpo || 'Toque para ver como está a captação.',
    icon: '/icones/icone-192.png',
    badge: '/icones/mascara-192.png',
    // a mesma tag substitui a notificação anterior: dez avisos de
    // captação empilhados na barra não ajudam ninguém
    tag: dados.tag || 'captacao',
    renotify: true,
    data: { url: dados.url || '/' },
    timestamp: Date.now(),
  };

  evento.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || '/';

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((janelas) => {
        // se a dash já está aberta, traz para frente em vez de abrir
        // uma segunda aba
        for (const j of janelas) {
          if (j.url.includes(self.location.origin)) {
            return j.focus().then(() => j.navigate(destino).catch(() => null));
          }
        }
        return self.clients.openWindow(destino);
      }),
  );
});
