import React, { useEffect, useRef } from 'react';
import { AVATAR_COLORS, CHARACTER_COUNT, type AvatarProfile } from '@market-mayhem/shared';
import { createAvatarSheet } from '../game/rendering/avatarTexture';

const LABELS=['Người khởi nghiệp','Nhà thương mại','Chuyên viên tài chính','Kỹ sư','Nhà đầu tư','Nhà quản lý'];
export function AvatarPreview({character,color,size=64}:{character:number;color:number;size?:number}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const image=new Image();let cancelled=false;
    image.onload=()=>{
      if(cancelled)return;const ctx=ref.current?.getContext('2d');if(!ctx)return;
      ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,48,48);
      ctx.drawImage(createAvatarSheet(image,character,color),0,0,16,16,0,0,48,48);
    };
    image.src='/assets/tiles/urban_tiles.png';
    return()=>{cancelled=true;image.onload=null;};
  },[character,color]);
  return <canvas ref={ref} width={48} height={48} style={{width:size,height:size,imageRendering:'pixelated'}} role="img" aria-label={`${LABELS[character]} · màu #${color.toString(16).padStart(6,'0')}`}/>;
}

export function AvatarSetup({value,onChange,unavailableColors=[]}:{value:AvatarProfile;onChange:React.Dispatch<React.SetStateAction<AvatarProfile>>;unavailableColors?:number[]}) {
  return <div className="avatar-setup">
    <div className="avatar-heading"><AvatarPreview character={value.character} color={value.color} size={80}/><div><strong>{value.nickname.trim() || 'Nhân vật của bạn'}</strong><p>{LABELS[value.character]} · 8 phút mỗi trận</p></div></div>
    <label className="avatar-name">Tên nhân vật <span>(bắt buộc, 2–24 ký tự)</span><input required minLength={2} maxLength={24} autoComplete="nickname" value={value.nickname} onChange={event=>{const nickname=event.target.value;onChange(current=>({...current,nickname}));}} placeholder="Nhập tên của bạn"/></label>
    <fieldset><legend>Chọn nhân vật</legend><div className="avatar-characters">{Array.from({length:CHARACTER_COUNT},(_,character)=><button type="button" key={character} className={value.character===character?'selected':''} aria-pressed={value.character===character} aria-label={LABELS[character]} onClick={()=>onChange(current=>({...current,character}))}><AvatarPreview character={character} color={value.color} size={48}/><span>{LABELS[character]}</span></button>)}</div></fieldset>
    <fieldset><legend>Màu trang phục & lãnh thổ</legend><div className="avatar-colors">{AVATAR_COLORS.map(color=><button key={color} type="button" style={{background:'#'+color.toString(16).padStart(6,'0')}} className={value.color===color?'selected':''} aria-label={`Màu #${color.toString(16)}${unavailableColors.includes(color)?' đã có người chọn':''}`} aria-pressed={value.color===color} disabled={unavailableColors.includes(color)} onClick={()=>onChange(current=>({...current,color}))}>{value.color===color?'✓':unavailableColors.includes(color)?'×':''}</button>)}</div></fieldset>
  </div>;
}

export function loadAvatar():AvatarProfile {
  // Keep the last appearance, but ask for the player's name on each new visit.
  try{const saved=JSON.parse(localStorage.getItem('market-mayhem-avatar')??'null');
    if(saved && Number.isInteger(saved.character) && saved.character>=0 && saved.character<CHARACTER_COUNT && AVATAR_COLORS.some(c=>c===saved.color))return{nickname:'',character:saved.character,color:saved.color};
  }catch{}
  return{nickname:'',character:0,color:AVATAR_COLORS[0]};
}
export function rememberAvatar(profile:AvatarProfile):void {
  try{localStorage.setItem('market-mayhem-avatar',JSON.stringify({character:profile.character,color:profile.color}));}catch{}
}
