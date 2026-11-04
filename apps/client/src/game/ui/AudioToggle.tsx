import React,{useState} from 'react';
import {gameAudio} from './gameAudio';
export function AudioToggle(){
  const [enabled,setEnabled]=useState(gameAudio.enabled);
  return <button type="button" aria-pressed={enabled} onClick={()=>{gameAudio.setEnabled(!enabled);setEnabled(gameAudio.enabled);}}>Âm thanh: {enabled?'Bật':'Tắt'}</button>;
}
