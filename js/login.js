// Funciones globales
function showLogin() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
}

function showRegister() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'flex';
    document.getElementById('registerFormRecolector').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
}

function showRegisterRecolector() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
}

// Función para iniciar sesión en modo offline
function iniciarSesionOffline() {
    // Comprobar si hay conexión a internet
    if (!navigator.onLine) {
        // Si no hay conexión, recuperar las credenciales almacenadas
        const authToken = localStorage.getItem('token');

        if (authToken) {
            try {
                const decodedToken = jwt.decode(authToken);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    console.log('Autenticado en modo offline con token guardado.');
                    // Redirigir a la aplicación o hacer acciones necesarias
                    window.location.href = decodedToken.tipo_usuario === 'restaurante' ? '../htmls/inicioRestaurante.html' : '../htmls/inicioRecolector.html';
                } else {
                    console.error('El token ha expirado.');
                }
            } catch (error) {
                console.error('Error al decodificar el token:', error);
            }
        } else {
            console.error('No hay token guardado. Necesitas estar online al menos una vez.');
        }
    } else {
        console.error('Estás en línea, intenta el login normal.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializa el Typewriter
    let app = document.getElementById('typewriter');
    if (app) {
        let typewriter = new Typewriter(app, {
            loop: true,
            delay: 200,
            cursor: "<span style='color:#50a88a;'>|</span>",
        });

        typewriter
            .pauseFor(2400)
            .typeString('<span style="color:#50a88a;">¡Por un planeta más limpio!</span>')
            .pauseFor(200)
            .deleteChars(15)
            .start();
    } else {
        console.error('El elemento con el ID "typewriter" no se encontró.');
    }

    // Llama a la función para iniciar sesión en modo offline
    iniciarSesionOffline();

    // Manejo del formulario de login
    const formLogin = document.getElementById('login');
    if (formLogin) {
        formLogin.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            const correo = formData.get('correo');
            const contrasenia = formData.get('contrasenia');

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ correo, contrasenia })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al iniciar sesión');
                }

                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    console.log('Inicio de sesión exitoso. Token guardado para modo offline.');
                    localStorage.setItem('foto_perfil', data.fotoPerfil || '../uploads');
                    localStorage.setItem('restaurantes_id', data.restaurantes_id);
                    localStorage.setItem('usuarios_id', data.id);
                    localStorage.setItem('direccion', data.direccion || null);

                    // Guardar recolector_id si el usuario es un recolector
                    if (data.tipo_usuario === 'recolector') {
                        localStorage.setItem('recolector_id', data.recolector_id); // Asegúrate de guardar recolector_id desde la respuesta
                        localStorage.setItem('recolector_nombre', data.nombreRecolector); // Guarda el nombre del recolector
                    } else if (data.tipo_usuario === 'restaurante') {
                        localStorage.setItem('restaurante_nombre', data.nombreRestaurante); 
                    }

                    // Redirigir a la página correspondiente según el tipo de usuario
                    const redirectPage = data.tipo_usuario === 'restaurante' ? '../htmls/inicioRestaurante.html' : '../htmls/inicioRecolector.html';
                    window.location.href = redirectPage;
                }
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                alert(error.message);
            }
        });
    }

    // Confirmación de cierre de sesión
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            const logoutForm = document.getElementById('logoutForm');
            if (logoutForm && confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                logoutForm.submit();
            } else {
                console.error('El formulario de cierre de sesión "logoutForm" no se encontró.');
            }
        });
    }

    // Registro Recolector
    const formRegistroRecolector = document.getElementById('formRegistroRecolector');
    if (formRegistroRecolector) {
        formRegistroRecolector.addEventListener('submit', async function(event) {
            event.preventDefault();

            try {
                const response = await fetch('/registroRecolector', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const successMessage = document.getElementById('successMessage');
                    successMessage.style.display = 'block';  // Muestra el mensaje de éxito

                    // Espera 3 segundos y luego oculta el mensaje y redirige al login
                    setTimeout(function() {
                        successMessage.style.display = 'none';  // Oculta el mensaje
                        window.location.href = '/login';  // Redirige al inicio de sesión
                    }, 3000); // 3000 milisegundos = 3 segundos
                }
            } catch (error) {
                console.error('Error:', error);
                window.alert('Hubo un error al intentar registrar el usuario.');
            }
        });
    }

    // Registro Restaurante
    const registerFormRestaurante = document.getElementById('registerFormRestaurante');
    const registerFormRecolector = document.getElementById('registerFormRecolector');
    if (registerFormRestaurante) {
        registerFormRestaurante.addEventListener('submit', async function(event) {
            event.preventDefault();
            const form = event.target; // Asegúrate de que 'form' es un elemento HTMLFormElement
            const formData = new FormData(form);
            try {
                const response = await fetch('/registroRestaurante', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    alert('Restaurante registrado correctamente');
                } else {
                    alert('Error al registrar el restaurante');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error interno del servidor');
            }
        });
    }
    if (registerFormRecolector) {
        registerFormRecolector.addEventListener('submit', async function(event) {
            event.preventDefault();
            const form = event.target; // Asegúrate de que 'form' es un elemento HTMLFormElement
            const formData = new FormData(form);
            try {
                const response = await fetch('/registroRecolector', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    alert('Recolector registrado correctamente');
                } else {
                    alert('Error al registrar el recolector');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error interno del servidor');
            }
        });
    }
});
