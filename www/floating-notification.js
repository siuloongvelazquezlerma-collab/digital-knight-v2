window.showFloatingNotification = function(data){

    const box =
        document.getElementById("dynamicFloatingNotification");

    if(!box) return;

    const overlay =
        document.getElementById("notificationOverlay");

    document.getElementById("dynamicNotificationImage").src =
        data.image;

    document.getElementById("dynamicNotificationTitle").innerHTML =
        data.title;

    document.getElementById("dynamicNotificationMessage").innerHTML =
        data.message;

    const button =
        document.getElementById("dynamicNotificationButton");

    const logo =
        document.querySelector(".notification-logo");

    button.href =
        (data.action || "").replace(/^\//,"");

    switch(data.type){

        case "new_movie":

            logo.src = "imagenes/nuevo-pelicula.png";
            button.textContent = "VER PELÍCULA";
            break;

        case "new_series":

            logo.src = "imagenes/nuevo-serie.png";
            button.textContent = "VER SERIE";
            break;

        case "movie":

            logo.src = "imagenes/recomendacion.png";
            button.textContent = "VER AHORA";
            break;

        case "series":

            logo.src = "imagenes/recomendacion.png";
            button.textContent = "VER AHORA";
            break;

        case "season":

            logo.src = "imagenes/temporada.png";
            button.textContent = "VER TEMPORADA";
            break;

        case "collection":

            logo.src = "imagenes/coleccion.png";
            button.textContent = "VER COLECCIÓN";
            break;

        case "update":

            logo.src = "imagenes/update.png";
            button.textContent = "ACTUALIZAR";
            break;

        default:

            logo.src =
                "https://od.lk/s/M18zMTIxODI5MjVf/Knight.png";

            button.textContent =
                data.button_text || "VER AHORA";
    }

    box.style.display = "block";

    if(overlay){
        overlay.style.display = "block";
    }

    const close = ()=>{

        if(data.show_once && data.notificationKey){

            localStorage.setItem(
                data.notificationKey,
                "true"
            );

        }

        box.style.display = "none";

        if(overlay){
            overlay.style.display = "none";
        }

    };

    box.querySelectorAll("[data-close]").forEach(btn=>{

        btn.onclick = close;

    });

    if(overlay){

        overlay.onclick = close;

    }

}