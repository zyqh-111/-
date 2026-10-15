const cache = new WeakMap();
export function prepared(img) {
  if (!img?.complete || !img.naturalWidth) return null;
  if(cache.get(img)?.src===img.src) return cache.get(img);
  const canvas=document.createElement("canvas");canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const c=canvas.getContext("2d",{willReadFrequently:true});c.drawImage(img,0,0);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);
  const d=pixels.data;
  const source=decodeURIComponent(img.src);
  const yellow=/小兵.jpg|boss[一二三]阶段.jpg/.test(source);
  const bean=source.includes('boss 豆包.jpg');
  // Seed a subject mask from warm yellow pixels, then retain enclosed facial details.
  if(yellow||bean){
    const w=canvas.width,h=canvas.height,mask=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const n=y*w+x,k=n*4,r=d[k],g=d[k+1],b=d[k+2];
      if(yellow){mask[n]=r>g*1.02&&g>b*1.16&&r-b>34&&r>65?1:0;}
      else{
        const nx=x/w,ny=y/h;
        const inside=((nx-.5)/.30)**2+((ny-.59)/.35)**2<1;
        const blue=b>r*1.07&&b>g*1.01&&b-r>12;
        mask[n]=inside&&!blue&&!(r>225&&g>225&&b>225)?1:0;
      }
    }
    if(yellow){
      const expanded=new Uint8Array(mask.length),closed=new Uint8Array(mask.length);
      const radius=w<300?2:3;
      for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++){
        let any=0;for(let dy=-radius;dy<=radius&&!any;dy++)for(let dx=-radius;dx<=radius;dx++)if(mask[(y+dy)*w+x+dx]){any=1;break}expanded[y*w+x]=any;
      }
      for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++){
        let all=1;for(let dy=-radius;dy<=radius&&all;dy++)for(let dx=-radius;dx<=radius;dx++)if(!expanded[(y+dy)*w+x+dx]){all=0;break}closed[y*w+x]=all;
      }
      mask.set(closed);
    }
    // Fill enclosed holes without turning the surrounding scenery into foreground.
    const outside=new Uint8Array(w*h),q=[];
    const visit=n=>{if(n<0||n>=w*h||outside[n]||mask[n])return;outside[n]=1;q.push(n)};
    for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}
    for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1)}
    for(let i=0;i<q.length;i++){const n=q[i],x=n%w;if(x)visit(n-1);if(x<w-1)visit(n+1);visit(n-w);visit(n+w)}
    for(let n=0;n<w*h;n++)if(outside[n])d[n*4+3]=0;
  }
  const effect=/攻击特效|技能特效|boss技能特效/.test(decodeURIComponent(img.src));
  const nearWhite=(k)=>d[k]>242&&d[k+1]>242&&d[k+2]>242;
  const nearBlack=(k)=>d[k]<28&&d[k+1]<28&&d[k+2]<38;
  // Remove only near-white edge-connected backgrounds, preserving enclosed highlights.
  const seen=new Uint8Array(canvas.width*canvas.height), queue=[];
  const add=(x,y)=>{if(x<0||y<0||x>=canvas.width||y>=canvas.height)return;const n=y*canvas.width+x;if(seen[n])return;seen[n]=1;const k=n*4;if(nearWhite(k)||(effect&&nearBlack(k))){d[k+3]=0;queue.push(n);}};
  for(let x=0;x<canvas.width;x++){add(x,0);add(x,canvas.height-1);}
  for(let y=0;y<canvas.height;y++){add(0,y);add(canvas.width-1,y);}
  for(let i=0;i<queue.length;i++){const n=queue[i],x=n%canvas.width,y=Math.floor(n/canvas.width);add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1);}
  c.putImageData(pixels,0,0);
  let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(d[(y*canvas.width+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const result={canvas,src:img.src,x:left,y:top,w:right-left+1,h:bottom-top+1};cache.set(img,result);return result;
}
export function paint(ctx,img,x,y,w,h){const p=prepared(img);if(p&&p.w>0)ctx.drawImage(p.canvas,p.x,p.y,p.w,p.h,x,y,w,h);}
