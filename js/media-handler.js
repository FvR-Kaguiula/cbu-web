// Función para la vista previa de medios
function handleMediaPreview() {
    const mediaUrl = document.getElementById('postMedia').value;
    const previewContainer = document.getElementById('mediaPreview');
    
    if (!mediaUrl) {
        previewContainer.classList.add('hidden');
        return;
    }

    const mediaType = getMediaType(mediaUrl);
    
    if (!mediaType) {
        previewContainer.classList.remove('hidden');
        previewContainer.classList.add('error');
        previewContainer.innerHTML = 'URL inválida. La URL debe terminar en .jpg, .jpeg, .png, .gif, .webp para imágenes o .mp4, .webm, .ogg para videos.';
        return;
    }

    previewContainer.classList.remove('hidden', 'error');
    
    if (mediaType === 'image') {
        previewContainer.innerHTML = `
            <img src="${mediaUrl}" alt="Vista previa" 
                 onerror="handleMediaError(this)" 
                 onload="handleMediaLoad(this)">
        `;
    } else if (mediaType === 'video') {
        previewContainer.innerHTML = `
            <video controls 
                   onerror="handleMediaError(this)" 
                   onloadeddata="handleMediaLoad(this)">
                <source src="${mediaUrl}" type="video/${mediaUrl.split('.').pop()}">
                Tu navegador no soporta el elemento de video.
            </video>
        `;
    }
}

// Manejar error de carga de medios
function handleMediaError(element) {
    const previewContainer = document.getElementById('mediaPreview');
    previewContainer.classList.add('error');
    previewContainer.innerHTML = 'Error al cargar el medio. Por favor, verifica la URL.';
}

// Manejar carga exitosa de medios
function handleMediaLoad(element) {
    const previewContainer = document.getElementById('mediaPreview');
    previewContainer.classList.remove('error');
}

// Función modificada para crear post
async function handleCreatePost(event) {
    event.preventDefault();

    if (!auth.currentUser) {
        alert('Debes iniciar sesión para crear una publicación');
        return;
    }

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const mediaUrl = document.getElementById('postMedia').value;

    // Validar URL de media si existe
    if (mediaUrl && !getMediaType(mediaUrl)) {
        alert('El formato de la URL de media no es válido');
        return;
    }

    // Mostrar loader
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<div class="loading-spinner"></div>';
    submitButton.disabled = true;

    try {
        const success = await createPostWithMedia(title, content, mediaUrl);
        
        if (success) {
            document.getElementById('postForm').reset();
            document.getElementById('mediaPreview').classList.add('hidden');
            alert(appState.isAdmin ? '¡Publicación creada!' : '¡Publicación enviada para aprobación!');
            loadFeed();
        } else {
            alert('Error al crear la publicación. Por favor, intenta de nuevo.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear la publicación. Por favor, intenta de nuevo.');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}