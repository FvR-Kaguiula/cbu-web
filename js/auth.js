// Configuración de Google Sign-In
function initGoogleAuth() {
    // Cargar la API de Google
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
        // Inicializar el cliente de Google
        google.accounts.id.initialize({
            client_id: 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com', // Necesitarás crear esto en Google Cloud Console
            callback: handleGoogleSignIn
        });

        // Renderizar el botón de Google
        google.accounts.id.renderButton(
            document.getElementById('googleSignIn'),
            { theme: 'outline', size: 'large', width: '100%' }
        );
    };
}

// Manejar el inicio de sesión con Google
async function handleGoogleSignIn(response) {
    if (response.credential) {
        // Decodificar el token JWT que Google nos da
        const userData = JSON.parse(atob(response.credential.split('.')[1]));
        
        // Verificar el dominio del correo (opcional)
        if (!userData.email.endsWith('@gmail.com')) {
            alert('Por favor, usa tu correo de Gmail');
            return;
        }

        const user = {
            id: userData.sub,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
            role: 'user',
            approved: false,
            registeredAt: new Date().toISOString()
        };

        // Si es el primer inicio de sesión del administrador
        if (userData.email === 'TU_CORREO_ADMIN@gmail.com') {
            user.role = 'admin';
            user.approved = true;
        }

        // Guardar usuario en localStorage
        const data = storage.getData();
        const existingUser = data.users.find(u => u.id === user.id);

        if (existingUser) {
            // Actualizar datos del usuario existente
            Object.assign(existingUser, user);
        } else {
            // Agregar nuevo usuario
            data.users.push(user);
        }

        data.currentUser = user;
        storage.saveData(data);

        // Redirigir según el estado del usuario
        if (user.approved) {
            window.location.href = '../index.html';
        } else {
            alert('Tu cuenta será revisada por un administrador.');
            window.location.href = '../index.html';
        }
    }
}

// El resto del código de storage permanece igual...
const storage = {
    init() {
        if (!localStorage.getItem('cbu-data')) {
            localStorage.setItem('cbu-data', JSON.stringify({
                users: [],
                posts: [],
                currentUser: null
            }));
        }
    },
    // ... resto de métodos de storage
};