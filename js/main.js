// Estructura inicial de datos
const initialData = {
    users: [
        {
            email: 'admin@cbu.com',
            password: 'admin123',
            name: 'Administrador CBU',
            role: 'admin',
            approved: true,
            id: 'admin-1'
        }
    ],
    posts: [],
    currentUser: null
};

// Funciones de manejo de datos locales
const storage = {
    // Inicializar datos si no existen
    init() {
        if (!localStorage.getItem('cbu-data')) {
            localStorage.setItem('cbu-data', JSON.stringify(initialData));
        }
    },

    // Obtener todos los datos
    getData() {
        return JSON.parse(localStorage.getItem('cbu-data'));
    },

    // Guardar datos
    saveData(data) {
        localStorage.setItem('cbu-data', JSON.stringify(data));
    },

    // Obtener usuario actual
    getCurrentUser() {
        const data = this.getData();
        return data.currentUser;
    }
};

// Funciones de autenticación
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const data = storage.getData();
    const user = data.users.find(u => u.email === email && u.password === password);

    if (user) {
        if (!user.approved && user.role !== 'admin') {
            alert('Tu cuenta está pendiente de aprobación por un administrador.');
            return;
        }

        data.currentUser = user;
        storage.saveData(data);
        window.location.href = '../index.html';
    } else {
        alert('Correo o contraseña incorrectos');
    }
}

function handleLogout() {
    const data = storage.getData();
    data.currentUser = null;
    storage.saveData(data);
    window.location.href = '../index.html';
}

// Funciones de registro
function handleRegistration(event) {
    event.preventDefault();
    
    const newUser = {
        id: 'user-' + Date.now(),
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        name: document.getElementById('regName').value,
        phone: document.getElementById('regPhone').value,
        university: document.getElementById('regUniversity').value,
        career: document.getElementById('regCareer').value,
        role: 'user',
        approved: false,
        registeredAt: new Date().toISOString()
    };

    const data = storage.getData();
    
    // Verificar si el correo ya existe
    if (data.users.some(u => u.email === newUser.email)) {
        alert('Este correo ya está registrado');
        return;
    }

    data.users.push(newUser);
    storage.saveData(data);

    alert('¡Registro exitoso! Tu cuenta será revisada por un administrador.');
    window.location.href = 'login.html';
}

// Funciones de publicaciones
function createPost(postData) {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return false;

    const data = storage.getData();
    const newPost = {
        id: 'post-' + Date.now(),
        ...postData,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString(),
        approved: currentUser.role === 'admin'
    };

    data.posts.push(newPost);
    storage.saveData(data);
    return true;
}

function deletePost(postId) {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return false;

    const data = storage.getData();
    data.posts = data.posts.filter(post => post.id !== postId);
    storage.saveData(data);
    return true;
}

// Funciones de administración
function approveUser(userId) {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return false;

    const data = storage.getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        data.users[userIndex].approved = true;
        storage.saveData(data);
        return true;
    }
    return false;
}

function deleteUser(userId) {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return false;

    const data = storage.getData();
    data.users = data.users.filter(u => u.id !== userId);
    storage.saveData(data);
    return true;
}

// Inicializar datos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    storage.init();
    
    // Actualizar UI según el usuario actual
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
        // Mostrar elementos específicos para usuarios autenticados
        document.querySelectorAll('.auth-only').forEach(el => el.classList.remove('hidden'));
        
        // Mostrar elementos de administrador si corresponde
        if (currentUser.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        }
        
        // Ocultar botones de login/registro
        document.querySelectorAll('.guest-only').forEach(el => el.classList.add('hidden'));
    } else {
        // Mostrar solo elementos para invitados
        document.querySelectorAll('.auth-only, .admin-only').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.guest-only').forEach(el => el.classList.remove('hidden'));
    }
});