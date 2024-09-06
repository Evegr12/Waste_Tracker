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
                    body: JSON.stringify({ correo, contrasenia })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al iniciar sesión');
                }

                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('restaurantes_id', data.restaurantes_id);
                    if (data.tipo_usuario === 'recolector') {
                        localStorage.setItem('recolector_id', data.id);  // Cambiar data.recolector_id por data.id
                    }
                    localStorage.setItem('usuarios_id', data.id);  // Cambiar data.usuarios_id por data.id
                    localStorage.setItem('direccion', data.direccion);
                    window.location.href = data.tipo_usuario === 'restaurante' ? 'inicioRestaurante.html' : 'inicioRecolector.html';
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

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/registroRecolector', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (result.success) {
                    window.alert(result.message);
                    //Redirigir o hacer algo después de un registro exitoso
                    alert('Registro exitoso. ¡Ahora puedes iniciar sesión!');
                } else {
                    window.alert(result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                window.alert('Hubo un error al intentar registrar el usuario.');
            }
        });
    }

    // Registro Restaurante
    const formRegistroRestaurante = document.getElementById('formRegistroRestaurante');
        if (formRegistroRestaurante) {
            formRegistroRestaurante.addEventListener('submit', async function(event) {  // Cambié `formRegistroRecolector` a `formRegistroRestaurante`
                event.preventDefault();

                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch('/registroRestaurante', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();
                    if (result.success) {
                        window.alert(result.message);
                        // Redirigir o hacer algo después de un registro exitoso
                        alert('Registro exitoso. ¡Ahora puedes iniciar sesión!');
                    } else {
                        window.alert(result.message);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    window.alert('Hubo un error al intentar registrar el usuario.');
                }
            });
        }
    });

