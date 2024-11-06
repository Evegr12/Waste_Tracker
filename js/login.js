// Funciones globales
function showLogin() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
}

function showRegister() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'block';
    document.getElementById('registerFormRecolector').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
}

function showRegisterRecolector() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
}

// Función para mostrar mensajes emergentes
function mostrarMensajeEmergente(mensaje, duracion = 3000, tipo = 'success') {
    const mensajeContainer = document.getElementById('mensajeEmergenteContainer');
    mensajeContainer.textContent = mensaje;
    mensajeContainer.style.display = 'block';
    mensajeContainer.style.backgroundColor = tipo === 'success' ? '#c8e6c9' : '#ffcdd2';
    mensajeContainer.style.color = tipo === 'success' ? '#388e3c' : '#d32f2f';

    // Ocultar el mensaje después de `duracion` milisegundos
    setTimeout(() => {
        mensajeContainer.style.display = 'none';
    }, duracion);
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
                    body: JSON.stringify({ correo, contrasenia }),
                    credentials: 'include'  // Asegurar que las cookies se envíen con la solicitud
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al iniciar sesión');
                }

                const data = await response.json();

                // Redirigir a la página correspondiente según el tipo de usuario
                const redirectPage = data.tipo_usuario === 'restaurante' ? '../htmls/inicioRestaurante.html' : '../htmls/inicioRecolector.html';
                window.location.href = redirectPage;

            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                mostrarMensajeEmergente(error.message, 3000, 'error');
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
                    mostrarMensajeEmergente('Recolector registrado correctamente', 3000, 'success');
                    setTimeout(() => {
                        window.location.href = '../htmls/login.html';
                    }, 3000);
                } else {
                    mostrarMensajeEmergente('Error al registrar el recolector', 3000, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensajeEmergente('Hubo un error al intentar registrar el usuario.', 3000, 'error');
            }
        });
    }

    // Registro Restaurante
    const registerFormRestaurante = document.getElementById('registerFormRestaurante');
    if (registerFormRestaurante) {
        registerFormRestaurante.addEventListener('submit', async function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            try {
                const response = await fetch('/registroRestaurante', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    mostrarMensajeEmergente('Restaurante registrado correctamente', 3000, 'success');
                    setTimeout(() => {
                        window.location.href = '../htmls/login.html';
                    }, 3000);
                } else {
                    mostrarMensajeEmergente('Error al registrar el restaurante', 3000, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensajeEmergente('Error interno del servidor', 3000, 'error');
            }
        });
    }

    if (registerFormRecolector) {
        registerFormRecolector.addEventListener('submit', async function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            try {
                const response = await fetch('/registroRecolector', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    mostrarMensajeEmergente('Recolector registrado correctamente', 3000, 'success');
                } else {
                    mostrarMensajeEmergente('Error al registrar el recolector', 3000, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensajeEmergente('Error interno del servidor', 3000, 'error');
            }
        });
    }
});
