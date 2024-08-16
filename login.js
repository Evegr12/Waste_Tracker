// Funciones globales
function showLogin() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'none';
}

function showRegister() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'flex';
    document.getElementById('registerFormRecolector').style.display = 'none';
}

function showRegisterRecolector() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'none';
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
            .typeString('<span style="color:#333;">¡Por un planeta más limpio!</span>')
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
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                const data = await response.json();
                if (data.tipo_usuario === 'restaurante') {
                    window.location.href = '/inicioRestaurante';
                } else if (data.tipo_usuario === 'recolector') {
                    window.location.href = '/inicioRecolector';
                } else {
                    alert('Tipo de usuario no válido');
                }
            } else {
                const errorMessage = await response.text();
                alert(errorMessage);
            }
        });
    } else {
        console.error('El elemento con el ID "login" no se encontró.');
    }

    // Manejo del formulario de registro para restaurante
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
                    alert('Restaurante registrado correctamente');
                } else {
                    alert('Error al registrar el restaurante');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error interno del servidor');
            }
        });
    } else {
        console.error('El elemento con el ID "registerFormRestaurante" no se encontró.');
    }

    // Manejo del formulario de registro para recolector
    const registerFormRecolector = document.getElementById('registerFormRecolector');
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
                    alert('Recolector registrado correctamente');
                } else {
                    alert('Error al registrar el recolector');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error interno del servidor');
            }
        });
    } else {
        console.error('El elemento con el ID "registerFormRecolector" no se encontró.');
    }

    // Manejo del botón de logout
    const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
        event.preventDefault();
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Asegúrate de incluir encabezados adicionales si es necesario (por ejemplo, token CSRF)
            },
            credentials: 'include' // Asegúrate de incluir credenciales si es necesario
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/'; // Redirigir a la página de inicio u otra página
            } else {
                alert('Error al cerrar sesión');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error interno del servidor');
        });
    });
} else {
    console.error('El elemento con el ID "logoutButton" no se encontró.');
}
});


// Confirmación de cierre de sesión
document.getElementById('logoutButton').addEventListener('click', function(event) {
    event.preventDefault();
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        document.getElementById('logoutForm').submit();
    }
});

// Cargar imagen de perfil
document.getElementById('cargar-foto-perfil').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('foto-perfil').setAttribute('src', event.target.result);
        }
        reader.readAsDataURL(file);
    }
});


