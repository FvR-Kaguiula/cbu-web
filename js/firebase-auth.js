// Configuración de Firebase
const firebaseConfig = {
    // Aquí irán las credenciales que te dará Firebase
    apiKey: "TU_API_KEY",
    authDomain: "cbu-ucsur.firebaseapp.com",
    projectId: "cbu-ucsur",
    storageBucket: "cbu-ucsur.appspot.com",
    messagingSenderId: "TU_MESSAGING_ID",
    appId: "TU_APP_ID"
};

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Autenticación con Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

async function signInWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Crear o actualizar usuario en Firestore
        const userDoc = {
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            role: 'user',
            approved: false,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Si es el primer inicio de sesión del administrador
        if (user.email === 'TU_CORREO_ADMIN@gmail.com') {
            userDoc.role = 'admin';
            userDoc.approved = true;
        }

        await db.collection('users').doc(user.uid).set(userDoc, { merge: true });

        if (userDoc.approved) {
            window.location.href = '../index.html';
        } else {
            alert('Tu cuenta será revisada por un administrador.');
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        alert('Error al iniciar sesión. Por favor, intenta de nuevo.');
    }
}

// Cerrar sesión
async function signOut() {
    try {
        await auth.signOut();
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Manejo de publicaciones
const postsDB = {
    async create(postData) {
        const user = auth.currentUser;
        if (!user) return false;

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        const newPost = {
            ...postData,
            authorId: user.uid,
            authorName: user.displayName,
            authorEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            approved: userData.role === 'admin'
        };

        await db.collection('posts').add(newPost);
        return true;
    },

    async delete(postId) {
        const user = auth.currentUser;
        if (!user) return false;

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (userData.role !== 'admin') return false;

        await db.collection('posts').doc(postId).delete();
        return true;
    },

    async getPosts() {
        const user = auth.currentUser;
        if (!user) return [];

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        let query = db.collection('posts');
        if (userData.role !== 'admin') {
            query = query.where('approved', '==', true);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Funciones de administración
const adminDB = {
    async approveUser(userId) {
        const admin = auth.currentUser;
        if (!admin) return false;

        const adminDoc = await db.collection('users').doc(admin.uid).get();
        const adminData = adminDoc.data();

        if (adminData.role !== 'admin') return false;

        await db.collection('users').doc(userId).update({
            approved: true
        });
        return true;
    },

    async deleteUser(userId) {
        const admin = auth.currentUser;
        if (!admin) return false;

        const adminDoc = await db.collection('users').doc(admin.uid).get();
        const adminData = adminDoc.data();

        if (adminData.role !== 'admin') return false;

        await db.collection('users').doc(userId).delete();
        return true;
    },

    async getUsers() {
        const admin = auth.currentUser;
        if (!admin) return [];

        const adminDoc = await db.collection('users').doc(admin.uid).get();
        const adminData = adminDoc.data();

        if (adminData.role !== 'admin') return [];

        const snapshot = await db.collection('users').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Observador de estado de autenticación
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        // Actualizar UI según el rol del usuario
        document.querySelectorAll('.auth-only').forEach(el => el.classList.remove('hidden'));
        
        if (userData.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        }
        
        document.querySelectorAll('.guest-only').forEach(el => el.classList.add('hidden'));
        
        // Ocultar botón de unirse
        const joinButtons = document.querySelectorAll('button[onclick*="join.html"]');
        joinButtons.forEach(btn => btn.classList.add('hidden'));
        
        // Ocultar sección CTA de unirse en la página principal
        const ctaSection = document.querySelector('.cta-section');
        if (ctaSection) {
            ctaSection.classList.add('hidden');
        }
    } else {
        document.querySelectorAll('.auth-only, .admin-only').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.guest-only').forEach(el => el.classList.remove('hidden'));
        
        // Mostrar botón de unirse
        const joinButtons = document.querySelectorAll('button[onclick*="join.html"]');
        joinButtons.forEach(btn => btn.classList.remove('hidden'));
        
        // Mostrar sección CTA de unirse en la página principal
        const ctaSection = document.querySelector('.cta-section');
        if (ctaSection) {
            ctaSection.classList.remove('hidden');
        }
    }
});