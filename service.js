const CACHE_NAME = 'waste-tracker-cache-v1.2.140';
const MAP_TILE_CACHE = 'map-tiles-cache';
const MAX_TILES = 1000;

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
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('Archivos cacheados correctamente');
            return cache.addAll(urlsToCache);
        })
    );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', function(event) {
    const requestUrl = new URL(event.request.url);

    // Interceptar solicitudes de tiles de mapas externos
    if (
        requestUrl.origin.includes('tile.openstreetmap.org') ||
        requestUrl.origin.includes('api.mapbox.com') ||
        requestUrl.origin.includes('tiles.mapbox.com')
    ) {
        event.respondWith(
            caches.open(MAP_TILE_CACHE).then(async function(cache) {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse.status === 200) {
                        await cache.put(event.request, networkResponse.clone());

                        // Limitar la cantidad de tiles en caché
                        const keys = await cache.keys();
                        if (keys.length > MAX_TILES) {
                            const toDelete = keys.slice(0, keys.length - MAX_TILES);
                            await Promise.all(toDelete.map(key => cache.delete(key)));
                        }
                    }
                    return networkResponse;
                } catch (error) {
                    console.warn('Error al obtener el tile:', error);
                    return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
                }
            })
        );
        return;
    }

    // Resto de archivos locales
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

// Activación del service worker
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME, MAP_TILE_CACHE];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
