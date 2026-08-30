const fs=require('fs');
const s=fs.readFileSync('www/peliculas/boda-sangrienta.html','utf8');
const lines=s.split('\n');
const pat=/<video|<\/video>|id="player"|freezeCanvas|nfMenu|video\.min\.js|player-peliculas|<canvas|<!-- Loader|class="controls"|<\/body>|<\/html>/i;
lines.forEach((l,i)=>{ if(pat.test(l)) console.log((i+1)+': '+l.trim().slice(0,90)); });