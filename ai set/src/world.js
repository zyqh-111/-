export class World {
  constructor(load) {
    this.background = load("map/背景1.png");
    this.ground = load("map/地块2.png");
    this.platform = load("map/平台1.png");
    this.tree = load("map/树.png");
  }
  platforms(scroll) {
    return Array.from({length: 8}, (_, i) => ({
      x: ((i * 250 + 400 - scroll) % 2000 + 2000) % 2000 - 200,
      y: [350,310,280,310][i % 4], w: 200, h: 16
    }));
  }
  draw(ctx, scroll, paint, debug) {
    ctx.fillStyle = "#7cbfc5"; ctx.fillRect(0, 0, 960, 540);
    for (let x = -(scroll * .12 % 960); x < 960; x += 960) paint(ctx, this.background, x, 0, 960, 430);
    for (let x = -(scroll * .35 % 620); x < 960; x += 620) paint(ctx, this.tree, x, 210, 190, 220);
    ctx.fillStyle='#594b2e';ctx.fillRect(0,430,960,110);
    for (let x = -(scroll % 150); x < 960; x += 150) paint(ctx, this.ground, x-5, 430, 162, 160);
    for (const p of this.platforms(scroll)) {
      paint(ctx, this.platform, p.x, p.y, p.w, 66);
      if (debug) {ctx.strokeStyle = "#ffdf42";ctx.strokeRect(p.x,p.y,p.w,p.h);}
    }
    if(debug){ctx.strokeStyle="#ffdf42";ctx.strokeRect(0,430,960,110);}
  }
}
