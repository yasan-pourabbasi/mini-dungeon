const menu=document.getElementById('menu');
const game=document.getElementById('game');
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;

const W=canvas.width,H=canvas.height,T=48;
let hero,enemies,keys={},particles=[],attackTimer=0,gameState='menu',lastTime=0;
let coins=0, armorLevel=0, potions=0, attackDamage=1, currentWeapon='starter';
let stage=3, wave=0, wavesTotal=3;
const weapons={starter:{name:'STARTER BLADE',price:0,damage:1,range:65},sword:{name:'IRON SWORD',price:15,damage:2,range:76},axe:{name:'BATTLE AXE',price:20,damage:3,range:84},mace:{name:'IRON MACE',price:25,damage:4,range:70},staff:{name:'ARCANE STAFF',price:30,damage:3,range:115}};
const rand=(a,b)=>Math.random()*(b-a)+a;

function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function tile(x,y,base,seed){
  rect(x,y,T,T,base);
  const shades=['#343c4c','#414958','#252d3a','#566071'];
  for(let i=0;i<5;i++){let xx=x+((seed*13+i*17)%39)+4, yy=y+((seed*19+i*11)%37)+4;rect(xx,yy,rand(4,10),rand(3,7),shades[(seed+i)%shades.length])}
  rect(x,y,T,3,'#151822');rect(x,y,3,T,'#151822');
  if(seed%4===0){rect(x+12,y+20,19,2,'#171c27');rect(x+28,y+20,2,12,'#171c27')}
}
function candle(x,y,s=1){
  rect(x-4*s,y,8*s,19*s,'#d8c69b');rect(x-4*s,y,8*s,3*s,'#f5e6bd');
  rect(x-1*s,y-8*s,3*s,8*s,'#ffc34e');rect(x-3*s,y-12*s,6*s,6*s,'#ff8c2d');
  rect(x-8*s,y-17*s,16*s,15*s,'#ff9b2e22');
}
function drawDungeon(){
  rect(0,0,W,H,'#171520');
  for(let y=0;y<H;y+=T)for(let x=0;x<W;x+=T){
    let edge=x<48||x>W-96||y<48||y>H-48;
    tile(x,y,edge?'#292632':'#343c4b',Math.floor(x/T)*7+Math.floor(y/T)*11);
  }
  // perimeter masonry and floor trim
  for(let x=0;x<W;x+=48){rect(x,0,46,10,'#17141e');rect(x,H-12,46,12,'#211a27');rect(x+5,5,35,3,'#4a414b')}
  for(let y=0;y<H;y+=48){rect(0,y,10,46,'#17141e');rect(W-10,y,10,46,'#17141e')}
  // wall torches
  [180,480,780].forEach(x=>{rect(x,44,12,26,'#6a482e');candle(x+6,48,1.2)});
  // pillars and barrels
  [[112,170],[830,170],[130,480],[820,470]].forEach(([x,y])=>{
    rect(x-13,y-12,27,28,'#625344');rect(x-10,y-9,21,21,'#88735a');rect(x-7,y-5,15,13,'#4a4140');rect(x-13,y+13,27,5,'#302833');
  });
  // scattered candles
  [[80,160],[145,270],[870,150],[870,300],[100,500],[855,500],[290,110],[680,110]].forEach(([x,y],i)=>candle(x,y,i%3===0?1.1:.8));
  // floor cracks
  [[280,270],[640,410],[390,500],[730,250],[190,390]].forEach(([x,y],i)=>{
    ctx.strokeStyle='#202733';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+12,y+10);ctx.lineTo(x+7,y+23);ctx.stroke();
  });
  // dark portal decoration
  rect(820,350,70,82,'#17121d');rect(826,356,58,70,'#51306a');rect(832,362,46,58,'#160f20');
  ctx.fillStyle='#a34de2';ctx.beginPath();ctx.ellipse(855,391,18,26,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#271335';ctx.beginPath();ctx.ellipse(855,391,10,17,0,0,Math.PI*2);ctx.fill();
  // vignette
  const g=ctx.createRadialGradient(W/2,H/2,170,W/2,H/2,600);g.addColorStop(0,'#00000000');g.addColorStop(1,'#08060dbb');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawHero(){
  const x=hero.x,y=hero.y;
  // Shadow
  ctx.fillStyle='#08091099';ctx.beginPath();ctx.ellipse(x,y+18,20,8,0,0,Math.PI*2);ctx.fill();
  // Back cape and hood
  rect(x-13,y-5,26,29,'#493064');
  rect(x-16,y+13,32,8,'#2b203d');
  rect(x-11,y-28,22,12,'#242033');
  // Boots
  rect(x-12,y+17,10,9,'#28212c');rect(x+3,y+17,10,9,'#28212c');
  rect(x-12,y+23,10,3,'#b8874d');rect(x+3,y+23,10,3,'#b8874d');
  // Legs and belt
  rect(x-10,y+7,20,13,'#34414b');
  rect(x-13,y+2,26,5,'#b17b42');rect(x-3,y+2,6,5,'#f0c56c');
  // Detailed chest armor
  rect(x-14,y-13,28,22,'#263b49');
  rect(x-10,y-12,20,18,'#58717a');
  rect(x-7,y-10,14,13,'#344d5b');
  rect(x-14,y-12,6,10,'#c49a60');rect(x+8,y-12,6,10,'#c49a60');
  rect(x-3,y-8,6,10,'#d7ad62');
  // Shoulder guards
  rect(x-17,y-12,8,8,'#b38b55');rect(x+9,y-12,8,8,'#b38b55');
  rect(x-15,y-14,5,4,'#e0c17c');rect(x+10,y-14,5,4,'#e0c17c');
  // Face and hair
  rect(x-9,y-29,18,17,'#c98e65');
  rect(x-10,y-31,20,7,'#211c2b');rect(x-9,y-28,5,5,'#211c2b');rect(x+4,y-28,5,5,'#211c2b');
  rect(x-7,y-20,3,3,'#20202b');rect(x+4,y-20,3,3,'#20202b');
  rect(x-3,y-14,6,2,'#704638');
  // Weapon
  if(attackTimer>0){
    ctx.save();ctx.translate(x,y);
    const angle=hero.facing==='left'?-1.1:hero.facing==='up'?-2.3:hero.facing==='down'?.3:.5;
    ctx.rotate(angle);
    rect(9,-25,6,42,'#dce4ed');rect(7,-3,10,5,'#d49a4d');rect(10,-31,4,7,'#fff0c8');
    ctx.restore();
    ctx.strokeStyle='#d9d5ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,43,-.8,1.0);ctx.stroke();
  }else{
    if(currentWeapon==='sword'||currentWeapon==='starter'){rect(x+12,y-8,4,28,'#cbd5e1');rect(x+9,y+1,10,4,'#c99550')}
    else if(currentWeapon==='axe'){rect(x+12,y-8,5,29,'#8b5b36');rect(x+10,y-12,17,13,'#b9c5ce');rect(x+19,y-14,8,9,'#e7edf0')}
    else if(currentWeapon==='mace'){rect(x+12,y-8,5,29,'#8b5b36');rect(x+7,y-17,17,14,'#8995a3');rect(x+5,y-15,20,4,'#c9d1d9')}
    else {rect(x+12,y-8,5,29,'#79502f');rect(x+10,y-20,11,11,'#a65ce0');rect(x+12,y-23,7,5,'#fff0a6')}
  }
}
function drawSlime(e){
  const x=e.x,y=e.y+Math.sin(performance.now()/180+e.phase)*2;
  ctx.fillStyle='#09081177';ctx.beginPath();ctx.ellipse(x,y+14,20,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.hit>0?'#f3a6ff':(e.kind==='brute'?'#b65b36':e.kind==='swift'?'#4b9b80':'#7139a0');ctx.beginPath();ctx.ellipse(x,y,17,16,0,Math.PI,Math.PI*2);ctx.lineTo(x+17,y+8);ctx.quadraticCurveTo(x,y+24,x-17,y+8);ctx.closePath();ctx.fill();
  rect(x-12,y-2,5,6,'#f8e6b7');rect(x+7,y-2,5,6,'#f8e6b7');rect(x-10,y,2,4,'#24132e');rect(x+9,y,2,4,'#24132e');
  rect(x-15,y-25,30,4,'#221820');rect(x-14,y-24,28*Math.max(0,e.hp/e.maxHp),2,'#b94ce6');
  e.hit=Math.max(0,e.hit-.04);
}
function drawBoss(e){
  const x=e.x,y=e.y+Math.sin(performance.now()/230)*3;
  // Large shadow
  ctx.fillStyle='#080610aa';ctx.beginPath();ctx.ellipse(x,y+27,39,13,0,0,Math.PI*2);ctx.fill();
  // Crown and horns
  rect(x-25,y-36,50,9,'#292039');
  rect(x-24,y-45,8,15,'#c4a1e8');rect(x-4,y-51,8,21,'#e1c7ff');rect(x+16,y-45,8,15,'#c4a1e8');
  // Body / armor
  rect(x-29,y-27,58,45,'#3c234f');rect(x-23,y-23,46,37,'#713b83');
  rect(x-34,y-19,12,27,'#4b2c60');rect(x+22,y-19,12,27,'#4b2c60');
  rect(x-18,y-17,36,25,'#292d48');rect(x-7,y-14,14,20,'#b34fe0');
  // Face and glowing eyes
  rect(x-17,y-34,34,20,'#211b32');rect(x-12,y-28,7,5,'#ff5c89');rect(x+5,y-28,7,5,'#ff5c89');
  // Legs
  rect(x-22,y+15,15,17,'#30213e');rect(x+7,y+15,15,17,'#30213e');
  rect(x-25,y+28,19,6,'#b18a58');rect(x+6,y+28,19,6,'#b18a58');
  // Boss health bar
  rect(x-40,y-61,80,7,'#211722');rect(x-39,y-60,78*Math.max(0,e.hp/e.maxHp),5,'#e34f79');
  ctx.fillStyle='#f5d9ff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('SHADOW KING',x,y-67);
  if(e.hit>0){ctx.strokeStyle='#f3c8ff';ctx.lineWidth=3;ctx.strokeRect(x-35,y-39,70,75)}
}

function drawEclipseBoss(e){
  const x=e.x,y=e.y+Math.sin(performance.now()/170)*4;
  const rage=e.hp<=e.maxHp*.5;
  ctx.fillStyle='#05040cbb';ctx.beginPath();ctx.ellipse(x,y+31,48,15,0,0,Math.PI*2);ctx.fill();
  // Floating shadow mantle
  rect(x-34,y-27,68,54,'#17152d');
  rect(x-27,y-35,54,56,'#30264f');
  rect(x-20,y-30,40,45,'#514078');
  // Crown
  rect(x-29,y-47,58,10,'#171326');
  rect(x-28,y-60,8,17,'#72e6e0');rect(x-5,y-67,10,24,'#b8fff5');rect(x+20,y-60,8,17,'#72e6e0');
  // Face and eyes
  rect(x-19,y-30,38,22,'#0d1025');
  rect(x-13,y-22,9,5,rage?'#ff4c6a':'#71fff0');rect(x+4,y-22,9,5,rage?'#ff4c6a':'#71fff0');
  // Chest core
  rect(x-10,y-5,20,25,rage?'#ff426b':'#55dcd6');rect(x-5,y,10,7,'#d7ffff');
  // Floating shoulder blades
  rect(x-43,y-23,13,31,'#282244');rect(x+30,y-23,13,31,'#282244');
  rect(x-48,y-15,8,15,'#70e8e1');rect(x+40,y-15,8,15,'#70e8e1');
  // Lower robe
  rect(x-26,y+18,52,15,'#201a38');rect(x-31,y+29,18,8,'#5b477c');rect(x+13,y+29,18,8,'#5b477c');
  // Health bar and name
  rect(x-48,y-79,96,8,'#171321');rect(x-47,y-78,94*Math.max(0,e.hp/e.maxHp),6,rage?'#ff426b':'#5be7df');
  ctx.fillStyle='#e5ffff';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(rage?'ECLIPSE WARDEN · RAGE':'ECLIPSE WARDEN',x,y-85);
  if(e.hit>0){ctx.strokeStyle='#a8fff8';ctx.lineWidth=3;ctx.strokeRect(x-39,y-40,78,79)}
}

function drawParticles(){
  particles.forEach(p=>{rect(p.x,p.y,4,4,p.color);p.x+=p.vx;p.y+=p.vy;p.life--});
  particles=particles.filter(p=>p.life>0);
}
function spawnBurst(x,y,color='#d88cff'){for(let i=0;i<12;i++)particles.push({x,y,vx:rand(-3,3),vy:rand(-3,3),life:rand(10,24),color})}
function resetGame(){
  coins=0;armorLevel=0;potions=0;attackDamage=1;currentWeapon='starter';stage=3;wave=0;
  document.getElementById('shopOverlay').classList.add('hidden');
  hero={x:W/2,y:H-145,hp:100,maxHp:100,speed:2.7,facing:'up',invuln:0};
  enemies=[
    {x:W/2-100,y:220,hp:3,maxHp:3,phase:1,hit:0},
    {x:W/2+95,y:270,hp:3,maxHp:3,phase:2,hit:0},
    {x:W/2,y:120,hp:4,maxHp:4,phase:3,hit:0}
  ];
  particles=[];attackTimer=0;gameState='playing';
  document.getElementById('gameOver').classList.add('hidden');
  document.getElementById('gameMessage').textContent='STAGE 04 — DEFEAT THE DUNGEON SLIMES!';
  updateHud();draw();
}
function updateHud(){
  const hp=Math.max(0,hero.hp);
  document.getElementById('heroHealth').style.width=(hp/hero.maxHp*100)+'%';
  document.getElementById('heroHealthText').textContent=hp+' / '+hero.maxHp;
  document.getElementById('objective').textContent=(stage===5?'WAVE '+wave+'/'+wavesTotal+' · ENEMIES: ':stage===6?'SHADOW KING · ENEMIES: ':'STAGE 04 · SLIMES: ')+enemies.length+' · COINS: '+coins;
}
function attack(){
  if(gameState!=='playing'||attackTimer>0)return;
  attackTimer=.22;
  let hitAny=false;
  enemies=enemies.filter(e=>{
    const d=Math.hypot(e.x-hero.x,e.y-hero.y);
    if(d<weapons[currentWeapon].range+(e.kind==='boss'?18:0)){e.hp-=attackDamage;e.hit=.18;spawnBurst(e.x,e.y,e.kind==='boss'?'#ff78a8':'#d88cff');hitAny=true;if(e.hp<=0){coins+=e.kind==='boss'?100:10;spawnBurst(e.x,e.y,'#f5c46b');return false}}
    return true;
  });
  if(hitAny)document.getElementById('gameMessage').textContent='NICE HIT!';
  updateHud();
  if(enemies.length===0){if(stage===3)openShop();else if(stage===5)completeWave();else if(stage===6)startStageSeven();else if(stage===7)finish(true);}
}
function openShop(){
  gameState='shop';
  document.getElementById('shopOverlay').classList.remove('hidden');
  document.getElementById('gameMessage').textContent='THE MERCHANT HAS ARRIVED';
  updateShop();
}
function updateShop(){
  document.getElementById('shopCoins').textContent=coins;
  ['sword','axe','mace','staff'].forEach(id=>{const slot=document.getElementById('inv'+id[0].toUpperCase()+id.slice(1));if(slot)slot.classList.toggle('owned',currentWeapon===id);});
  document.querySelectorAll('.inventory-slot').forEach(slot=>slot.classList.remove('selected'));
  document.querySelectorAll('.weapon-card').forEach(card=>card.classList.remove('equipped'));
  const equippedCard=document.getElementById('weaponCard'+currentWeapon[0].toUpperCase()+currentWeapon.slice(1));if(equippedCard)equippedCard.classList.add('equipped');
  document.querySelectorAll('[data-weapon]').forEach(btn=>{const id=btn.dataset.weapon;btn.disabled=coins<weapons[id].price;btn.textContent=id===currentWeapon?'EQUIPPED':weapons[id].price+' ✦'});
  document.getElementById('armorLevel').textContent='Level '+armorLevel;
  document.getElementById('potionCount').textContent='Potions: '+potions;
  document.getElementById('buyArmor').disabled=coins<20||armorLevel>=3;
  document.getElementById('buyPotion').disabled=coins<10||hero.hp>=hero.maxHp;
  document.getElementById('buyArmor').textContent=armorLevel>=3?'MAX LEVEL':'20 ✦';
}
function spawnWave(number){
  wave=number;
  const count=2+number*2;
  enemies=[];
  for(let i=0;i<count;i++){
    const angle=(Math.PI*2*i/count)+rand(-.25,.25);
    const radius=230+rand(-25,35);
    const kind=(number>=2&&i%3===0)?'brute':(number>=2&&i%2===0?'swift':'slime');
    const hp=kind==='brute'?7+number:kind==='swift'?3+number:3+number;
    enemies.push({x:W/2+Math.cos(angle)*radius,y:H/2+Math.sin(angle)*radius,
      hp,maxHp:hp,phase:i+number,hit:0,kind});
  }
  document.getElementById('gameMessage').textContent='WAVE '+number+' — DEFEAT THEM ALL!';
  updateHud();
}
function completeWave(){
  if(wave<wavesTotal){
    coins+=5*wave;
    spawnWave(wave+1);
  }else{
    coins+=30;
    updateHud();
    startStageSix();
  }
}
function startStageFive(){
  document.getElementById('shopOverlay').classList.add('hidden');
  stage=5;wave=0;gameState='playing';
  hero.hp=Math.min(hero.maxHp,hero.hp+15);
  spawnWave(1);
  document.getElementById('gameMessage').textContent='STAGE 05 — THE GAUNTLET';
  updateHud();
}
function startStageSix(){
  stage=6;wave=0;gameState='playing';
  hero.hp=Math.min(hero.maxHp,hero.hp+20);
  hero.speed=2.9;
  enemies=[
    {x:W/2,y:155,hp:65,maxHp:65,phase:1,hit:0,kind:'boss'},
    {x:W/2-185,y:245,hp:7,maxHp:7,phase:2,hit:0,kind:'swift'},
    {x:W/2+185,y:245,hp:9,maxHp:9,phase:3,hit:0,kind:'brute'}
  ];
  document.getElementById('gameMessage').textContent='STAGE 06 — THE SHADOW KING';
  updateHud();
}

function startStageSeven(){
  stage=7;wave=0;gameState='playing';
  hero.hp=Math.min(hero.maxHp,hero.hp+25);
  hero.speed=3.05;
  enemies=[
    {x:W/2,y:145,hp:100,maxHp:100,phase:7,hit:0,kind:'eclipseBoss'},
    {x:W/2-205,y:255,hp:12,maxHp:12,phase:8,hit:0,kind:'swift'},
    {x:W/2+205,y:255,hp:14,maxHp:14,phase:9,hit:0,kind:'brute'}
  ];
  document.getElementById('gameMessage').textContent='STAGE 07 — THE ECLIPSE';
  updateHud();
}

function finish(win){
  gameState=win?'won':'lost';
  const panel=document.getElementById('gameOver');
  document.getElementById('resultTitle').textContent=win?'DUNGEON CONQUERED!':'TRY AGAIN, ADVENTURER';
  document.getElementById('resultText').textContent=win?'The Eclipse Warden has fallen. You conquered all seven stages!':'Your hero needs another try. Return to the dungeon!';
  document.getElementById('restartButton').textContent=win?'PLAY AGAIN':'TRY AGAIN';
  panel.classList.remove('hidden');
}
function update(dt){
  if(gameState!=='playing')return;
  let dx=0,dy=0;
  if(keys.w||keys.arrowup)dy--;if(keys.s||keys.arrowdown)dy++;
  if(keys.a||keys.arrowleft)dx--;if(keys.d||keys.arrowright)dx++;
  if(dx&&dy){dx*=.707;dy*=.707}
  hero.x=Math.max(65,Math.min(W-65,hero.x+dx*hero.speed*dt*60));
  hero.y=Math.max(105,Math.min(H-65,hero.y+dy*hero.speed*dt*60));
  if(dx)hero.facing=dx<0?'left':'right';else if(dy)hero.facing=dy<0?'up':'down';
  attackTimer=Math.max(0,attackTimer-dt);
  enemies.forEach(e=>{
    e.hit=Math.max(0,(e.hit||0)-dt);
    const d=Math.hypot(hero.x-e.x,hero.y-e.y);
    if(d>27){const speed=e.kind==='eclipseBoss'?(e.hp<=e.maxHp*.5?1.02:.68):e.kind==='boss'?.48:e.kind==='swift'?1.05:e.kind==='brute'?.42:.62;e.x+=(hero.x-e.x)/d*speed*dt*60;e.y+=(hero.y-e.y)/d*speed*dt*60}
    if(d<30&&hero.invuln<=0){hero.hp=Math.max(0,hero.hp-Math.max(2,(e.kind==='eclipseBoss'?(e.hp<=e.maxHp*.5?22:18):e.kind==='boss'?17:e.kind==='brute'?13:e.kind==='swift'?6:8)-armorLevel*2));hero.invuln=.75;spawnBurst(hero.x,hero.y,'#e58a66');updateHud();if(hero.hp<=0)finish(false)}
  });
  hero.invuln=Math.max(0,hero.invuln-dt);
}
function draw(){
  drawDungeon();
  enemies.forEach(e=>e.kind==='eclipseBoss'?drawEclipseBoss(e):e.kind==='boss'?drawBoss(e):drawSlime(e));
  drawHero();
  drawParticles();
}
function loop(t){
  const dt=Math.min(.035,(t-lastTime)/1000||0);lastTime=t;
  update(dt);draw();
  requestAnimationFrame(loop);
}
document.getElementById('playButton').addEventListener('click',()=>{
  menu.classList.add('hidden');game.classList.remove('hidden');resetGame();canvas.focus();
});
document.getElementById('howButton').addEventListener('click',()=>document.getElementById('modal').classList.remove('hidden'));
document.getElementById('closeModal').addEventListener('click',()=>document.getElementById('modal').classList.add('hidden'));
document.getElementById('modalOk').addEventListener('click',()=>document.getElementById('modal').classList.add('hidden'));
document.getElementById('menuButton').addEventListener('click',()=>{game.classList.add('hidden');menu.classList.remove('hidden');gameState='menu'});
document.getElementById('restartButton').addEventListener('click',resetGame);
document.querySelectorAll('[data-weapon]').forEach(btn=>btn.addEventListener('click',()=>{
  const id=btn.dataset.weapon, item=weapons[id];
  if(coins<item.price||id===currentWeapon)return;
  coins-=item.price;currentWeapon=id;attackDamage=item.damage;
  document.getElementById('shopNote').textContent=item.name+' equipped! Damage: '+item.damage;
  updateHud();updateShop();
}));
document.getElementById('buyArmor').addEventListener('click',()=>{
  if(coins<20||armorLevel>=3)return;coins-=20;armorLevel++;document.getElementById('shopNote').textContent='Your armor is stronger!';
  updateShop();
});
document.getElementById('buyPotion').addEventListener('click',()=>{
  if(coins<10||hero.hp>=hero.maxHp)return;coins-=10;potions++;hero.hp=Math.min(hero.maxHp,hero.hp+35);
  updateHud();document.getElementById('shopNote').textContent='Potion used: +35 HP!';
  updateShop();
});
document.getElementById('finishShop').addEventListener('click',startStageFive);
document.getElementById('attackButton').addEventListener('click',attack);
canvas.addEventListener('pointerdown',e=>{if(gameState==='playing')attack()});
const keyMap={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright'};
window.addEventListener('keydown',e=>{
  const k=keyMap[e.code]||e.key.toLowerCase();
  if(keyMap[e.code]||e.code==='Space')e.preventDefault();
  keys[k]=true;
  if(e.code==='Space'&&!e.repeat)attack();
});
window.addEventListener('keyup',e=>{const k=keyMap[e.code]||e.key.toLowerCase();keys[k]=false});
document.querySelectorAll('[data-move]').forEach(btn=>{
  const k={up:'w',down:'s',left:'a',right:'d'}[btn.dataset.move];
  btn.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>btn.addEventListener(ev,()=>keys[k]=false));
});
window.addEventListener('blur',()=>keys={});
resetGame();gameState='menu';requestAnimationFrame(loop);
window.addEventListener('pointerdown',()=>{if(gameState==='playing')canvas.focus({preventScroll:true})});
