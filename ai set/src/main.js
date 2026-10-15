import { Game } from './game.js';
import { prepared } from './assets.js';
const healthFrame=new Image();
healthFrame.onload=()=>{const frame=prepared(healthFrame);if(frame)document.documentElement.style.setProperty('--health-frame', 'url("'+frame.canvas.toDataURL()+'")');};
healthFrame.src='./素材合集/界面素材/生命条.jpeg';
const hudStyle=document.createElement("link");hudStyle.rel="stylesheet";hudStyle.href="./hud.css";document.head.append(hudStyle);

const root = './素材合集/';
const characters = [
  ['deepseek','deepseek q版.png','deepseek 成熟.png','水刃','深海领域'],
  ['gpt','gpt q版.png','gpt 成熟.png','追踪弹','答案生成'],
  ['claude','claude q版.png','claude 成熟.png','火焰书页','审判之书'],
  ['grok','grok q版.png','grok 成熟.png','十字冲击波','混沌突袭'],
  ['kimi','kimi q版.png','kimi 成熟.png','冰晶','月光护盾'],
  ['gemini','gemini q版.png','gemini 成熟.png','星光弹','双星爆发'],
  ['智谱','智谱 q版.png','智谱 成熟.png','黑白棋子弹','墨影分身'],
  ['千问','千问 q版.png','千问 成熟.png','风刃','万象风暴'],
].map(([id,q,m,attack,skill])=>({id,name:id,q:root+q,mature:root+m,attack,skill}));
const grid=document.querySelector('#character-grid'); let selected=null;
characters.forEach(c=>{const card=document.createElement('button');card.className='character-card';card.innerHTML=`<img src="${c.q}" alt="${c.name}"><strong>${c.name}</strong><small>${c.attack} · ${c.skill}</small>`;card.onclick=()=>{document.querySelectorAll('.character-card').forEach(x=>x.classList.remove('selected'));card.classList.add('selected');selected=c;document.querySelector('#start-btn').disabled=false};grid.append(card)});
const game=new Game(characters);
for(const name of ['hp','xp','boss']){const bar=document.querySelector('#'+name+'-bar').parentElement;const value=document.createElement('b');value.id=name+'-value';value.className='bar-value';bar.append(value);}
const pause=document.createElement('button');pause.id='pause-btn';pause.textContent='暂停';pause.style.cssText='position:absolute;right:150px;bottom:12px;z-index:5';pause.onclick=()=>game.togglePause();document.querySelector('.game-wrap').append(pause);
document.querySelector('#start-btn').onclick=()=>{document.querySelector('#select-screen').classList.add('hidden');document.querySelector('#game-screen').classList.remove('hidden');game.start(selected)};
document.querySelector('#restart-btn').onclick=()=>location.reload();
const gameWrap=document.querySelector('.game-wrap');
if(gameWrap){
  const debug=document.createElement('button');debug.className='debug-toggle';debug.type='button';debug.textContent='显示碰撞盒 (F3)';debug.onclick=()=>{game.debugHitboxes=!game.debugHitboxes};gameWrap.append(debug);
  const assetStatus=document.createElement('div');assetStatus.id='asset-status';assetStatus.textContent='资源未加载';assetStatus.style.cssText='position:absolute;left:14px;bottom:12px;z-index:4;padding:5px 8px;border-radius:4px;background:#101824cc;color:#b8c8dc;font-size:11px';gameWrap.append(assetStatus);
}
const style=document.createElement('style');style.textContent='.debug-toggle{position:absolute;right:14px;bottom:12px;z-index:4;padding:5px 8px;border:1px solid #49617f;border-radius:4px;background:#101824cc;color:#c9d7e8;font-size:11px}';document.head.append(style);
