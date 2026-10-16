const assert = require('node:assert/strict');
(async()=>{
  const {Game}=await import('./src/game.js');
  const game=()=>Object.assign(Object.create(Game.prototype),{c:{id:'deepseek'},a:{},effects:[],projectiles:[],enemies:[],hazards:[],player:{x:145,y:430,vy:0,rolling:0},level:8,hp:100,shield:0,invuln:0,damageBonus:1,kills:0,xp:0,state:'playing',cool:0});
  const water=game();water.boss={x:780,y:430,hp:1000};water.castSkill();water.updateSkill(.1);assert.equal(water.zone.x,145);assert.equal(water.boss.hp,1000);water.enemies=[{x:160,y:430,speed:80,hp:30,max:30,dead:false}];water.projectiles=[];water.cool=0;water.updateShots(.01);assert.equal(water.projectiles[0].straight,true);
  const clone=game();clone.c.id='智谱';clone.boss={x:780,y:430,hp:1000};clone.castSkill();clone.updateShots(.01);assert.equal(clone.projectiles.length,2);
  const shield=game();shield.shield=6;shield.damagePlayer(10);assert.equal(shield.hp,96);assert.equal(shield.shield,0);shield.invuln=0;shield.player.rolling=1;shield.damagePlayer(20);assert.equal(shield.hp,96);
  const landing=game();landing.world={platforms:()=>[{x:100,y:350,w:200}]};landing.previousY=340;landing.player.y=360;landing.player.vy=100;landing.collide();assert.equal(landing.player.y,350);assert.ok(landing.player.onGround);
  for(const [hp,phase,count] of [[1400,1,1],[800,2,2],[100,3,2]]){const boss=game();boss.boss={kind:'奶蛙',x:780,hp,max:1500,cool:0};boss.spawnBoss=()=>{};boss.updateBoss(.01);assert.equal(boss.boss.phase,phase);assert.equal(boss.hazards.length,count);assert.ok(boss.hazards.every(h=>h.warning>0));}
  const dead=game();dead.boss={kind:'豆包',hp:0};dead.hazards=[{}];dead.updateBoss(.1);assert.equal(dead.boss,null);assert.ok(dead.beanDefeated);assert.equal(dead.hazards.length,0);
  console.log('Combat regression checks passed: targeting, clone, shield, roll, landing, boss phases and cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
