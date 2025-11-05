// Validación de URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Validación de tipo de archivo multimedia
function getMediaType(url) {
    if (!url) return null;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    
    const extension = url.toLowerCase().match(/\.[a-z0-9]+$/);
    if (!extension) return null;
    
    if (imageExtensions.includes(extension[0])) return 'image';
    if (videoExtensions.includes(extension[0])) return 'video';
    
    return null;
}

// Crear elemento multimedia
function createMediaElement(url, type) {
    if (type === 'image') {
        return `<img src="${url}" alt="Imagen de la publicación" 
                    style="margin-top: 1rem; border-radius: 0.5rem; width: 100%; max-height: 400px; object-fit: cover;"
                    onerror="this.style.display='none'">`;
    } else if (type === 'video') {
        return `<video controls style="margin-top: 1rem; border-radius: 0.5rem; width: 100%; max-height: 400px;">
                    <source src="${url}" type="video/${url.split('.').pop()}">
                    Tu navegador no soporta el elemento de video.
                </video>`;
    }
    return '';
}

// Crear un post con media
async function createPostWithMedia(title, content, mediaUrl) {
    try {
        const user = auth.currentUser;
        if (!user) return false;

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        const mediaType = mediaUrl ? getMediaType(mediaUrl) : null;
        
        const newPost = {
            title,
            content,
            media: mediaUrl && mediaType ? {
                url: mediaUrl,
                type: mediaType
            } : null,
            authorId: user.uid,
            authorName: user.displayName,
            authorEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            approved: userData.role === 'admin',
            likes: 0,
            comments: []
        };

        await db.collection('posts').add(newPost);
        return true;
    } catch (error) {
        console.error('Error al crear post:', error);
        return false;
    }
}

// Renderizar post con media
function renderPost(post) {
    const formattedDate = new Date(post.createdAt.toDate()).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    let mediaContent = '';
    if (post.media && post.media.url) {
        mediaContent = createMediaElement(post.media.url, post.media.type);
    }

    return `
        <div class="post">
            <!-- Header del post -->
            <div class="post-header">
                <div>
                    <h4 style="font-weight: 700; color: #1f2937;">${post.authorName}</h4>
                    <p style="font-size: 0.875rem; color: #6b7280;">${formattedDate}</p>
                </div>
                ${appState.isAdmin ? `
                    <div style="display: flex; gap: 0.5rem;">
                        ${!post.approved ? `
                            <button onclick="approvePost('${post.id}')" class="btn-icon" style="color: #10b981;" title="Aprobar">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            </button>
                        ` : ''}
                        <button onclick="deletePost('${post.id}')" class="btn-icon" style="color: #ef4444;" title="Eliminar">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- Contenido del post -->
            <div class="post-content">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem;">
                    ${post.title}
                </h3>
                <p style="color: #374151; white-space: pre-wrap; line-height: 1.6;">
                    ${post.content}
                </p>
                ${mediaContent}
                ${!post.approved ? `
                    <div class="pending-badge">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        Pendiente de aprobación
                    </div>
                ` : ''}
            </div>

            <!-- Acciones -->
            <div class="post-actions">
                <button class="action-btn" onclick="handleLike('${post.id}')">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span>${post.likes}</span>
                </button>
                <button class="action-btn">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <span>${post.comments.length}</span>
                </button>
            </div>

            <!-- Comentarios -->
            ${post.comments.length > 0 ? `
                <div style="padding: 0 1rem 1rem;">
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <p style="font-weight: 700; font-size: 0.875rem; color: #1f2937; margin-bottom: 0.25rem;">
                                ${comment.authorName}
                            </p>
                            <p style="color: #374151; font-size: 0.875rem;">
                                ${comment.text}
                            </p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Agregar comentario -->
            ${appState.isAuthenticated ? `
                <div style="padding: 0 1rem 1rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" 
                               id="comment-${post.id}" 
                               placeholder="Escribe un comentario..." 
                               style="flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem;"
                               onkeypress="if(event.key === 'Enter') handleComment('${post.id}')">
                        <button onclick="handleComment('${post.id}')" 
                                style="background: #a855f7; color: white; border: none; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer;">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}