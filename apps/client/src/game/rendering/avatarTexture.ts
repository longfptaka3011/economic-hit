/** Extract four directions / three poses, then recolor the shirt area only.
 * Skin, hair, outlines and boots remain in the original Kenney palette.
 */
export function createAvatarSheet(source: CanvasImageSource, character: number, color: number): HTMLCanvasElement {
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;
  const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  for(let pose=0;pose<3;pose++)for(let direction=0;direction<4;direction++) {
    ctx.drawImage(source,(23+direction)*16,(character*3+pose)*16,16,16,direction*16,pose*16,16,16);
  }
  const pixels=ctx.getImageData(0,0,64,48);
  const red=color>>16&255,green=color>>8&255,blue=color&255;
  for(let y=0;y<48;y++)for(let x=0;x<64;x++) {
    const localY=y%16,localX=x%16,index=(y*64+x)*4;
    if(localY<9 || localY>12 || localX<5 || localX>10 || !pixels.data[index+3])continue;
    const [r,g,b]=pixels.data.slice(index,index+3);
    if(Math.max(r,g,b)<65)continue; // Keep dark outlines.
    const shade=.55+(.2126*r+.7152*g+.0722*b)/510;
    pixels.data[index]=Math.min(255,Math.round(red*shade));
    pixels.data[index+1]=Math.min(255,Math.round(green*shade));
    pixels.data[index+2]=Math.min(255,Math.round(blue*shade));
  }
  ctx.putImageData(pixels,0,0);return canvas;
}
