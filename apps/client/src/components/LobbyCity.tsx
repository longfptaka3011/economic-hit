import React, {useEffect, useRef} from 'react';
import {GAME_CONSTANTS,type AvatarProfile} from '@market-mayhem/shared';
import {AvatarPreview} from './AvatarSetup';

/** A small, static city diorama using the same CC0 Urban tiles as the game. */
export function LobbyCity({players}:{players:readonly AvatarProfile[]}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const image=new Image();let cancelled=false;
    image.onload=()=>{
      const ctx=ref.current?.getContext('2d');if(cancelled || !ctx)return;
      ctx.imageSmoothingEnabled=false;
      const tile=(x:number,y:number,c:number,r:number)=>ctx.drawImage(image,c*16,r*16,16,16,x,y,16,16);
      ctx.fillStyle='#9bb37c';ctx.fillRect(0,0,480,256);
      for(let y=0;y<256;y+=16)for(let x=0;x<480;x+=16)tile(x,y,y>=96 && y<160?9:1,y>=96 && y<160?16:4);
      ctx.fillStyle='#f2d597';for(let x=0;x<480;x+=32)ctx.fillRect(x,126,16,2);
      // Roofs, storefronts and tree canopies stay on the source's 16px grid.
      for(const [x,y,orange] of [[32,16,0],[176,0,1],[352,16,0]]){
        ctx.fillStyle='#344c4060';ctx.fillRect(x+6,y+10,80,80);
        for(let r=0;r<3;r++)for(let c=0;c<5;c++)tile(x+c*16,y+r*16,16+(c===0?0:c===4?3:2),orange*4+(r===0?0:r===2?3:2));
        for(let c=0;c<5;c++)tile(x+c*16,y+48,c===2?12:11,c===2?12:11);
      }
      for(const x of [0,128,304,448]){tile(x,48,16,8);tile(x,64,16,9);}
      // A stepped arrival plaza with four illuminated player platforms.
      ctx.fillStyle='#506451';ctx.fillRect(64,176,352,80);
      ctx.fillStyle='#cfca9e';ctx.fillRect(64,172,352,76);
      ctx.fillStyle='#ded8b4';ctx.fillRect(72,172,336,68);
      ctx.fillStyle='#b6b48d';for(let x=80;x<416;x+=32)ctx.fillRect(x,172,1,68);
      for(const x of [112,192,272,352]){
        ctx.fillStyle='#516c58';ctx.fillRect(x-19,214,38,14);
        ctx.fillStyle='#b6d59d';ctx.fillRect(x-19,210,38,12);
        ctx.fillStyle='#e9d695';ctx.fillRect(x-12,213,24,3);
      }
      // Fountain and gold coin marker: original pixel shapes, no extra assets.
      ctx.fillStyle='#4b6963';ctx.fillRect(222,74,36,22);
      ctx.fillStyle='#9fd5cd';ctx.fillRect(226,76,28,12);
      ctx.fillStyle='#e7bf60';ctx.fillRect(234,54,12,20);ctx.fillRect(230,58,20,12);
      ctx.fillStyle='#fff1b0';ctx.fillRect(235,58,3,10);
    };
    image.src='/assets/tiles/urban_tiles.png';
    return()=>{cancelled=true;image.onload=null;};
  },[]);
  return <div className="lobby-diorama" aria-label="Quảng trường thành phố và các nhân vật đang chờ" role="img">
    <canvas ref={ref} width={480} height={256}/>
    <span className="lobby-city-sign">MARKET SQUARE <span>★</span></span>
    <div className="lobby-platforms">{Array.from({length:4},(_,index)=><div key={index} className={players[index]?'occupied':''}>
      {players[index]?<AvatarPreview {...players[index]} size={64}/>:<span className="lobby-ghost">?</span>}
    </div>)}</div>
    {players.length>4 && <span className="lobby-overflow">+{players.length-4} người chơi khác</span>}
    <span className="lobby-city-caption">{players.length}/{GAME_CONSTANTS.MAX_PLAYERS} NHÀ KINH DOANH ĐÃ CÓ MẶT</span>
  </div>;
}
