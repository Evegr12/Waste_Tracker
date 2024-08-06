let app = document.getElementById('typewriter');
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

//Mostrar Log in y ocultar inicio(animación)
function showLogin() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'none';

}

//Mostrar registro restaurante y ocultar log in
function showRegister() {
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('contenido-principal').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'flex';
    document.getElementById('registerFormRecolector').style.display = 'none';
}

//Mostrar registro recolector y ocultar log in
function showRegisterRecolector(){
    document.getElementById('animacion').style.display = 'none';
    document.getElementById('registerFormRestaurante').style.display = 'none';
    document.getElementById('registerFormRecolector').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'none';
}

const formLogin = document.getElementById('login');

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

document.addEventListener('DOMContentLoaded', function() {
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
