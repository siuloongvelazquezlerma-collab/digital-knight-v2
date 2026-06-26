// Función para abrir la página de Pro
function openProPage() {
    document.getElementById("proPage").style.display = "block";
}

// Función para cerrar la página de Pro
function closeProPage() {
    document.getElementById("proPage").style.display = "none";
}



// Función para manejar la selección de archivo de imagen
function handleFileSelect(event) {
var file = event.target.files[0]; // Obtiene el archivo seleccionado
if (file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        // Obtener la URL de la imagen seleccionada
        var newImageUrl = e.target.result;
        
        // Cambiar la imagen de perfil en todas las instancias correspondientes
        document.getElementById('editableProfile').src = newImageUrl;
        document.getElementById('editableProfileInModal').src = newImageUrl;
        document.getElementById('profileImage').src = newImageUrl;
        
        // Guardar la nueva imagen de perfil en localStorage
        localStorage.setItem('profileImage', newImageUrl);

        // Actualizar también la imagen en el footer
        updateProfileImage(newImageUrl);
    };
    reader.readAsDataURL(file); // Leer el archivo como una URL de datos
}
}

// Función para actualizar la imagen de perfil en el footer
function updateProfileImage(imageUrl) {
// Actualizar la imagen del perfil en el footer (suponiendo que el footer tiene una imagen con id 'footerProfileImage')
document.getElementById('footerProfileImage').src = imageUrl;
}

    // Prevenir gestos táctiles no deseados
document.addEventListener('touchmove', function (event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

// Función para abrir la página de compartir
function openSharePage() {
    document.getElementById('sharePage').style.display = 'block';
}

// Función para cerrar la página de compartir
function closeSharePage() {
    document.getElementById('sharePage').style.display = 'none';
}

    // Función para mostrar la página de "Sugerencias y soporte"
function openSuggestionsPage() {
    document.getElementById("suggestionsPage").style.display = "block";
}

// Función para cerrar la página de "Sugerencias y soporte"
function closeSuggestionsPage() {
    document.getElementById("suggestionsPage").style.display = "none";
}

// Función para mostrar la página de "Cómo transmitir a TV"
function openCastToTvPage() {
    document.getElementById("castToTvPage").style.display = "block";
}

// Función para cerrar la página de "Cómo transmitir a TV"
function closeCastToTvPage() {
    document.getElementById("castToTvPage").style.display = "none";
}

window.addEventListener('load', function () {
const overlay = document.querySelector('.overlay');
const loader = document.getElementById('loader');

// Se mantiene el loader visible por 1 segundo
setTimeout(() => {
    // Hacer que el loader desaparezca rápidamente
    loader.style.opacity = '0'; // Desvanecer loader
    setTimeout(() => {
        loader.style.display = 'none'; // Eliminarlo del flujo

        // Se añade clase "hidden" al overlay para que se desvanezca lentamente
        overlay.classList.add('hidden');
    }, 300); // Tiempo de transición de 300ms para el loader
}, 1000); // Mantener el loader visible durante 1 segundo

});

let initialProfileImage = document.getElementById('editableProfile').src;
let initialBackgroundImage = document.getElementById('editableBackground').src;
let notificationCount = 0;  // Inicializar contador de notificaciones

// Función para alternar la visibilidad del perfil editable
function toggleEditProfile() {
document.getElementById('editProfileSection').classList.toggle('visible');
}

// Función para mostrar o esconder el modal
function toggleModal(modalId) {
document.getElementById(modalId).classList.toggle('visible');
}

// Función para seleccionar la imagen de fondo y resaltar la imagen seleccionada
function selectBackgroundImage(imageUrl, imgElement) {
// Cambiar la imagen de fondo en la sección de edición
document.getElementById('editableBackground').src = imageUrl;
document.getElementById('editableBackgroundInModal').src = imageUrl;
document.getElementById('backgroundImage').src = imageUrl;

// Guardar la imagen seleccionada en localStorage para que persista después de cerrar la página
localStorage.setItem('backgroundImage', imageUrl);  

// Resaltar la imagen seleccionada
const allImages = document.querySelectorAll('.image-option-background');
allImages.forEach(img => img.classList.remove('selected-image-background'));
imgElement.classList.add('selected-image-background');

checkForChanges();
}

// Función para seleccionar la imagen de perfil y resaltar la imagen seleccionada
function selectProfileImage(imageUrl, imgElement) {
// Create a new Image object to handle loading
const profileImage = new Image();

// Set the image source and handle loading events
profileImage.src = imageUrl;
profileImage.onload = function() {
// Actualizar las imágenes mostradas
document.getElementById('editableProfile').src = imageUrl;
document.getElementById('editableProfileInModal').src = imageUrl;
document.getElementById('profileImage').src = imageUrl;

// Guardar la imagen seleccionada en localStorage
// Continue with existing logic
localStorage.setItem('profileImage', imageUrl);
const allImages = document.querySelectorAll('.image-option-profile');
allImages.forEach(img => img.classList.remove('selected-image-profile'));
imgElement.classList.add('selected-image-profile');
updateProfileImage(imageUrl);
checkForChanges();
};

// Handle potential errors during image loading
profileImage.onerror = function() {
// Optional: Show an error message or a placeholder image
console.error('Error loading profile image:', imageUrl);
};
}


window.onload = function () {
// Cargar imagen de perfil si existe
const savedProfileImage = localStorage.getItem('profileImage');
if (savedProfileImage) {
    document.getElementById('editableProfile').src = savedProfileImage;
    document.getElementById('editableProfileInModal').src = savedProfileImage;
    document.getElementById('profileImage').src = savedProfileImage;

    // Actualizar la imagen en el footer
    updateProfileImage(savedProfileImage);
}

// Cargar imagen de fondo si existe
const savedBackgroundImage = localStorage.getItem('backgroundImage');
if (savedBackgroundImage) {
    document.getElementById('backgroundImage').src = savedBackgroundImage;
    document.getElementById('editableBackground').src = savedBackgroundImage;
}

// Cargar nombre de usuario si existe
const savedUserName = localStorage.getItem('userName');
if (savedUserName) {
    document.getElementById('userNameDisplay').textContent = savedUserName;
    document.getElementById('usernameInput').value = savedUserName;
}
// Llamar a la función para actualizar el contador de notificaciones
updateNotificationCounter();

// Verificar si hay cambios
checkForChanges();
};


// Función para guardar los cambios y cerrar la sección de edición
function saveChanges() {
document.getElementById('saveButton').classList.remove('active');
toggleEditProfile();  // Cerrar la sección de edición de perfil
}

// Función para verificar y habilitar el botón de guardar si hay cambios
function checkForChanges() {
const userName = document.getElementById('usernameInput').value;
const profileImage = document.getElementById('editableProfile').src;
const backgroundImage = document.getElementById('editableBackground').src;

const userNameChanged = userName !== localStorage.getItem('userName');
const profileImageChanged = profileImage !== initialProfileImage;
const backgroundImageChanged = backgroundImage !== initialBackgroundImage;

if (userNameChanged || profileImageChanged || backgroundImageChanged) {
    document.getElementById('saveButton').classList.add('active');
} else {
    document.getElementById('saveButton').classList.remove('active');
}
}

// Cargar imágenes y nombre guardados si existen
window.onload = function() {
// Cargar imagen de perfil si existe
if (localStorage.getItem('profileImage')) {
    let profileImageUrl = localStorage.getItem('profileImage');
    document.getElementById('profileImage').src = profileImageUrl;
    document.getElementById('editableProfile').src = profileImageUrl;
    document.getElementById('editableProfileInModal').src = profileImageUrl;
    
    // También actualiza la imagen en el footer
    updateProfileImage(profileImageUrl);
}

// Cargar imagen de fondo si existe
if (localStorage.getItem('backgroundImage')) {
    let backgroundImageUrl = localStorage.getItem('backgroundImage');
    document.getElementById('backgroundImage').src = backgroundImageUrl;
    document.getElementById('editableBackground').src = backgroundImageUrl;
}

// Cargar nombre de usuario si existe
const savedUserName = localStorage.getItem('userName');
if (savedUserName) {
    document.getElementById('userNameDisplay').textContent = savedUserName;
    document.getElementById('usernameInput').value = savedUserName;
}

// Actualizar el contador de notificaciones al cargar la página
updateNotificationCounter();

checkForChanges();
}

// Función para actualizar el nombre de usuario en tiempo real
function updateUserName() {
const userNameInput = document.getElementById('usernameInput').value;
document.getElementById('userNameDisplay').textContent = userNameInput;
localStorage.setItem('userName', userNameInput);  // Guardar el nombre en localStorage
checkForChanges();
}

// Guardar el nombre en localStorage y desactivar el botón
function saveUserName() {
const userName = document.getElementById('usernameInput').value;
localStorage.setItem('userName', userName);  // Guardar el nombre en localStorage
document.getElementById('saveButton').classList.remove('active');
}

// Cerrar el modal
function closeModal() {
toggleModal('profileModal');
}

// Función para mostrar la página de Notificaciones
function openNotifications() {
updateNotificationCounter();  // Llamar para actualizar el contador cuando se abre la página de notificaciones
document.getElementById("notificationsPage").style.display = "block";
updateDeleteButton();
}

// Función para cerrar la página de Notificaciones
function closeNotifications() {
document.getElementById("notificationsPage").style.display = "none";
}

// Función para añadir una notificación y actualizar el contador
function addNotification() {
const newNotification = document.createElement('a');
newNotification.classList.add('notification-item');
newNotification.href = 'go:venom3';
newNotification.innerHTML = `        
    <img src="https://image.tmdb.org/t/p/original/jiWlhrR0jAQPy0zwfIYa2gqgMuA.jpg" alt="Nuevo Contenido" class="notification-image">
    <div class="notification-text">
        <h3>Nuevo Contenido</h3>
        <p>Descripción de la nueva notificación.</p>
    </div>
`;
document.getElementById('notificationsContainer').appendChild(newNotification);
updateNotificationCounter();  // Actualizar contador después de agregar una notificación
updateDeleteButton();  // Actualizar estado del botón
}

// Función para eliminar una notificación y actualizar el contador
function removeNotification() {
const notificationsContainer = document.getElementById("notificationsContainer");
const notificationItems = notificationsContainer.querySelectorAll(".notification-item");

// Eliminar la última notificación
if (notificationItems.length > 0) {
    notificationItems[notificationItems.length - 1].remove();
    updateNotificationCounter();  // Actualizar contador después de eliminar una notificación
    updateDeleteButton();  // Actualizar estado del botón
}
}

// Función para eliminar todas las notificaciones
function deleteAllNotifications() {
const notificationsContainer = document.getElementById("notificationsContainer");
notificationsContainer.innerHTML = "";
updateNotificationCounter();
updateDeleteButton();
}

// Función para actualizar el contador de notificaciones
function updateNotificationCounter() {
const notificationsContainer = document.getElementById("notificationsContainer");
const notificationItems = notificationsContainer.querySelectorAll(".notification-item");
const notificationCounter = document.getElementById("notificationCounter");

// Si hay más de 0 notificaciones, mostrar el contador
if (notificationItems.length > 0) {
    notificationCounter.style.display = "inline";
    notificationCounter.textContent = notificationItems.length;  // Actualizamos el número de notificaciones
} else {
    notificationCounter.style.display = "none";
    // Mostrar mensaje de que no hay notificaciones
    if (notificationsContainer.querySelectorAll('.notification-item').length === 0) {
        const noNotificationsMessage = document.createElement('p');
        noNotificationsMessage.textContent = 'No tienes ninguna notificación nueva. Te enviaremos una notificación cuando tengamos alguna novedad que compartir!';
        notificationsContainer.appendChild(noNotificationsMessage);
    }
}
}

// Función para actualizar la imagen del perfil en el footer
function updateProfileImage(imageUrl) {
const footerIcon = document.getElementById("footerIconImg");
footerIcon.src = imageUrl;
}

function openPrivacyPolicy() {
document.getElementById("privacyPolicyPage").style.display = "block";
}

function closePrivacyPolicy() {
document.getElementById("privacyPolicyPage").style.display = "none";
}

