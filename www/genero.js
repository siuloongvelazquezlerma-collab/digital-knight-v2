
const params=new URLSearchParams(location.search);

const genre=params.get("genre");





const sortMode =
localStorage.getItem("genreSort") || "default";

document.addEventListener("DOMContentLoaded",()=>{

    const button=document.getElementById("sortButton");
    const menu=document.getElementById("sortOptions");

    button.onclick=()=>{

        menu.classList.toggle("show");

    };

    document.querySelectorAll("#sortOptions div").forEach(opcion=>{

        if(opcion.dataset.sort===sortMode){

            opcion.innerHTML="✔ "+opcion.innerHTML;

        }

        opcion.onclick=()=>{

            localStorage.setItem(
                "genreSort",
                opcion.dataset.sort
            );

            location.reload();

        };

    });

    document.addEventListener("click",(e)=>{

        if(
            !button.contains(e.target) &&
            !menu.contains(e.target)
        ){

            menu.classList.remove("show");

        }

    });

});


const genreNames={

accion:"Acción",
aventura:"Aventura",
comedia:"Comedia",
drama:"Drama",
terror:"Terror",
romance:"Romance",
fantasía:"Fantasía",
animacion:"Animación",
anime:"Anime"

};

const genreBackgrounds={

accion:
"https://od.lk/s/M18zMzE3ODI1MTJf/crear-fondo-cartel-pelicula-accion_1061150-3693.avif",

aventura:
"https://od.lk/s/M18zMzE3ODM0Nzlf/expanding-boundaries-high-quality-ultra-hd-8k-hdr-free-photo.jpg",

comedia:
"https://od.lk/s/M18zMzE3ODM5MjJf/file_00000000928c81fdb6f295e964cba074.png",

drama:
"https://od.lk/s/M18zMzE3ODI1MDZf/fondo-cuadros-negativos-pelicula-colores_875825-90424.jpg",

terror:
"https://od.lk/s/M18zMzE3ODI1MTNf/halloween-9112212_640.png",

romance:
"https://od.lk/s/M18zMzE3ODI1MTBf/gente-romantica-esta-enamorada_23-2151103220.avif",

fantasía:
"https://od.lk/s/M18zMzE3ODMxNjBf/aventura-espera-fondo_1015182-8515.avif",

animacion:
"https://od.lk/s/M18zMzE3ODMxNThf/ilustracion-vector-fondo-estilo-pelicula-dibujos-animados-retro_175838-2084.avif",



};



document.getElementById("genreTitle").innerHTML=

genreNames[genre] || genre;

const genreTitle = genreNames[genre] || genre;

document.getElementById("genreTitle").textContent = genreTitle;
document.getElementById("page-title").textContent = genreTitle;


const bg = genreBackgrounds[genre];


if(bg){

document.querySelector(".background").style.backgroundImage=

`
linear-gradient(
rgba(1,1,29,.55),
rgba(1,1,29,.95)
),
url("${bg}")
`;

}



function normalizar(texto){

return texto
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"");

}

function activarCarrusel(scroll){


if(window.innerWidth < 1024) return;



const wrapper=document.createElement("div");

wrapper.className="carousel-wrapper";


scroll.parentNode.insertBefore(wrapper,scroll);


wrapper.appendChild(scroll);



const left=document.createElement("button");

left.className="carousel-arrow carousel-left";

left.innerHTML="‹";


const right=document.createElement("button");

right.className="carousel-arrow carousel-right";

right.innerHTML="›";



wrapper.appendChild(left);

wrapper.appendChild(right);



left.onclick=()=>{

scroll.scrollBy({

left:-500,

behavior:"smooth"

});

};



right.onclick=()=>{

scroll.scrollBy({

left:500,

behavior:"smooth"

});

};



// DRAG CON MOUSE

let isDown=false;

let startX;

let scrollLeft;



scroll.addEventListener("mousedown",(e)=>{


isDown=true;

scroll.classList.add("dragging");


startX=e.pageX-scroll.offsetLeft;


scrollLeft=scroll.scrollLeft;


});



scroll.addEventListener("mouseleave",()=>{

isDown=false;

});



scroll.addEventListener("mouseup",()=>{

isDown=false;

});



scroll.addEventListener("mousemove",(e)=>{


if(!isDown)return;


e.preventDefault();


const x=e.pageX-scroll.offsetLeft;


const walk=(x-startX)*2;


scroll.scrollLeft=scrollLeft-walk;


});


}


fetch("movies.json")

.then(res=>res.json())

.then(data=>{


let resultado=data.filter(item=>{


return item.genres?.some(g=>

normalizar(g)==normalizar(genre)

);


});


// ==========================
// ORDEN ALEATORIO (SOLO UNA VEZ)
// ==========================

const storageKey = "genreOrder_" + genre;

let savedOrder = JSON.parse(localStorage.getItem(storageKey));

if (!savedOrder) {

    // Mezclar los IDs solo la primera vez
    savedOrder = resultado
        .map(item => item.id)
        .sort(() => Math.random() - 0.5);

    localStorage.setItem(storageKey, JSON.stringify(savedOrder));

}

// Ordenar según el orden guardado
resultado.sort((a, b) => {

    let ia = savedOrder.indexOf(a.id);
    let ib = savedOrder.indexOf(b.id);

    if (ia === -1) ia = 999999;
    if (ib === -1) ib = 999999;

    return ia - ib;

});

const modo =
localStorage.getItem("genreSort") || "default";

if(modo==="az"){

    resultado.sort((a,b)=>

        a.title.localeCompare(
            b.title,
            'es',
            {sensitivity:'base'}
        )

    );

}

if(modo==="za"){

    resultado.sort((a,b)=>

        b.title.localeCompare(
            a.title,
            'es',
            {sensitivity:'base'}
        )

    );

}


const contenedor=document.getElementById("sectionsContainer");



const grupos={

movie:"Películas",

animacion:"Animación",

series:"Series",

anime:"Anime"

};



Object.keys(grupos).forEach(tipo=>{


let lista=resultado.filter(x=>{


let tieneGenero=x.genres.some(g=>

normalizar(g)==normalizar(genre)

);



if(!tieneGenero) return false;



let esAnimacion=x.genres.some(g=>

normalizar(g)==="animacion"

);



let esAnime=

x.type==="anime" ||

x.genres.some(g=>

normalizar(g)==="anime"

);



if(tipo==="animacion"){

return esAnimacion;

}



if(tipo==="anime"){

return esAnime;

}



if(tipo==="movie"){

return x.type==="movie" && !esAnimacion && !esAnime;

}



if(tipo==="series"){

return x.type==="series";

}



});



if(lista.length===0)return;



let section=document.createElement("div");

section.className="movie-section";



section.innerHTML=`

<h2>${grupos[tipo]}</h2>

<div class="scroll-container"></div>

`;



let scroll=section.querySelector(".scroll-container");

activarCarrusel(scroll);

lista.forEach(movie=>{


let card=document.createElement("div");


card.className="movie-card";


card.innerHTML=`

<img src="${movie.poster}">


<div class="info">

<div class="title">
${movie.title}
</div>


<div class="details">
${movie.details}
</div>


</div>

`;



card.onclick=()=>{

location.href=movie.link;

};



scroll.appendChild(card);



});



contenedor.appendChild(section);



});



});

fetch("collections.json")

.then(res=>res.json())

.then(collections=>{


const container=document.getElementById("collectionsContainer");



fetch("movies.json")

.then(res=>res.json())

.then(movies=>{


collections.forEach(col=>{


let lista=movies.filter(movie=>{


return movie.type==="movie" &&

movie.collection===col.collection &&

col.genres.some(g=>

normalizar(g)==normalizar(genre)

);


});



if(lista.length===0)return;



let section=document.createElement("div");


section.className="collection-section";



section.innerHTML=`

<div class="collection-background"

style="background-image:url('${col.background}')">

</div>


<div class="collection-content">


<h2>
${col.title}
</h2>


<div class="collection-info">

${lista.length} películas para maratonear

</div>


<div class="scroll-container"></div>


</div>

`;



let scroll=section.querySelector(".scroll-container");

activarCarrusel(scroll);

lista.forEach(movie=>{


let card=document.createElement("div");


card.className="movie-card";


card.innerHTML=`

<img src="${movie.poster}">


<div class="info">

<div class="title">
${movie.title}
</div>


<div class="details">
${movie.details}
</div>


</div>

`;



card.onclick=()=>{

location.href=movie.link;

};



scroll.appendChild(card);



});



container.appendChild(section);



});


});


});

document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById('header');
    const pageTitle = document.getElementById('page-title');

    if (!header || !pageTitle) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const maxScroll = 300;

        const opacity = Math.min(scrollY / maxScroll, 1); // Gradiente del header
        const titleOpacity = scrollY > 150 ? Math.min(scrollY / maxScroll, 1) : 0; // El título aparece después de 150px

        header.style.backgroundColor = `rgba(1, 1, 29, ${opacity})`;
        pageTitle.style.opacity = titleOpacity;
    });
});

// Gestión de imágenes de perfil
const footerProfileIcon = document.getElementById("footerIconImg");
const headerProfileIcon = document.getElementById("headerProfileIcon"); // NUEVO
const profileImage = document.getElementById("profileImage");
const profilePageImage = document.getElementById("profilePageImage");

const defaultProfileIcon = document.getElementById("defaultProfileIcon");
const defaultProfileIconAlt = document.getElementById("defaultProfileIconAlt");

// Función para cambiar todas las imágenes de perfil
function updateProfileImage(src) {
  if (profileImage) profileImage.src = src;
  if (profilePageImage) profilePageImage.src = src;
  if (footerProfileIcon) footerProfileIcon.src = src;
  if (headerProfileIcon) headerProfileIcon.src = src;

  if (defaultProfileIcon) defaultProfileIcon.style.display = 'none';
  if (defaultProfileIconAlt) defaultProfileIconAlt.style.display = 'none';

  localStorage.setItem('profileImage', src);
}

// Restaurar la imagen de perfil guardada al cargar la página
window.addEventListener('load', function () {
  const storedProfileImage = localStorage.getItem('profileImage');
  if (storedProfileImage) {
    if (footerProfileIcon) footerProfileIcon.src = storedProfileImage;
    if (headerProfileIcon) headerProfileIcon.src = storedProfileImage;
    if (profileImage) profileImage.src = storedProfileImage;
    if (profilePageImage) profilePageImage.src = storedProfileImage;

    if (defaultProfileIcon) defaultProfileIcon.style.display = 'none';
    if (defaultProfileIconAlt) defaultProfileIconAlt.style.display = 'none';
  }
});
  
  // Ocultar footer al hacer scroll hacia abajo
  var lastScrollTop = 0;
  var footer = document.querySelector(".footer");
  
  window.addEventListener("scroll", function () {
      var currentScroll = window.scrollY;
  
      if (currentScroll > lastScrollTop) {
          footer.classList.add("hidden");
      } else {
          footer.classList.remove("hidden");
      }
  
      lastScrollTop = currentScroll;
  });