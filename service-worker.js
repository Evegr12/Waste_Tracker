const CACHE_NAME = 'waste-tracker-cache-v1.1.9';
const urlsToCache = [
    '/',
    '/htmls/login.html',
    '/htmls/mapaRecolector.html',
    '/htmls/ruta.html',
    '/htmls/calificaciones.html',
    '/htmls/calificacionesRecolector.html',
    '/htmls/historial.html',
    '/htmls/inicioRecolector.html',
    '/htmls/inicioRestaurante.html',
    '/htmls/notificaciones.html',
    '/htmls/notificacionesRecolector.html',
    '/htmls/perfilRecolector.html',
    '/htmls/perfilRestaurante.html',
    '/htmls/solicitudRecoleccion.html',
    '/htmls/quienesSomos.html',
    '/htmls/clasificacionResiduos.html',

    '/styles/calificaciones.css',
    '/styles/calificacionesRecolector.css',
    '/styles/historial.css',
    '/styles/inicioRecolector.css',
    '/styles/mapa.css',
    '/styles/notificaciones.css',
    '/styles/notificacionesRecolector.css',
    '/styles/solicitudRecoleccion.css',
    '/styles/styles.css',
    '/styles/stylesperfilRes.css',
    '/styles/stylesquienes.css',
    '/styles/stylesRestaurante.css',

    '/js/server.js',
    '/js/login.js',

    '/images/icono-blanco.svg',
    '/images/login.png',
    '/images/registroRestaurante.png',
    '/images/registroRecolector.png',
    '/images/logoWT.png',
    '/images/perfil-icon.png',
    '/images/home-icon.png',
    '/images/historial-icon.png',
    '/images/bote-icon.png',
    '/images/cero-desperdicios.webp',
    '/images/calif-icon.png',
    '/images/inicio-wasteT.png',
    '/images/kingfish.png',
    '/images/camara.png',
    '/images/notificaciones.png',
    '/images/img_inicioRecolector.png',
    '/images/ubicacion.png',
    '/images/ubicacionesAceptadas.png',
    '/images/califi-icon.png',
    '/images/marker-icon-blue.png',
    '/images/marker-icon-purple.png',
    '/images/marker-icon-red.png',
    '/images/marker-icon-green.png',
    '/images/reciclar.jpg',
    '/images/logo512x512.jpeg',
    '/images/logo192x192.jpeg'
];

// Instalación del service worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log('Archivos cacheados correctamente');
            return cache.addAll(urlsToCache);
        })
    );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
            return response || fetch(event.request);
        })
    );
});

// Activación del service worker
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames.map(function(cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
            }
            })
        );
        })
    );
});
