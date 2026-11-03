import React, { useEffect, useRef, useState } from 'react';

export interface TouchInput { x:number; y:number; sprint:boolean }
type Action='up'|'down'|'left'|'right'|'sprint';

/** Pointer IDs allow a direction and sprint to be held with separate fingers. */
export function TouchControls({onInput,resetVersion,disabled=false}:{onInput:(input:TouchInput)=>void;resetVersion:number;disabled?:boolean}) {
  const held=useRef(new Map<number,Action>());
  const callback=useRef(onInput);callback.current=onInput;
  const [active,setActive]=useState<Action[]>([]);
  const publish=()=>{
    const actions=[...held.current.values()];setActive(actions);
    callback.current({x:Number(actions.includes('right'))-Number(actions.includes('left')),
      y:Number(actions.includes('down'))-Number(actions.includes('up')),sprint:actions.includes('sprint')});
  };
  useEffect(()=>{
    const clear=()=>{held.current.clear();setActive([]);callback.current({x:0,y:0,sprint:false});};
    const visibility=()=>{if(document.hidden)clear();};
    clear();window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility);clear();};
  },[resetVersion,disabled]);
  const button=(action:Action,label:string,symbol:string)=><button type="button" className={'touch-'+action}
    aria-label={label} aria-pressed={active.includes(action)} disabled={disabled}
    onContextMenu={event=>event.preventDefault()}
    onPointerDown={event=>{event.preventDefault();if(disabled)return;event.currentTarget.setPointerCapture(event.pointerId);held.current.set(event.pointerId,action);publish();}}
    onPointerUp={event=>{held.current.delete(event.pointerId);publish();}}
    onPointerCancel={event=>{held.current.delete(event.pointerId);publish();}}
    onLostPointerCapture={event=>{if(held.current.delete(event.pointerId))publish();}}>{symbol}</button>;
  return <div className="touch-controls" role="group" aria-label="Điều khiển cảm ứng" hidden={disabled}>
    <div className="touch-directions">{button('up','Đi lên','▲')}{button('left','Đi trái','◀')}{button('down','Đi xuống','▼')}{button('right','Đi phải','▶')}</div>
    {button('sprint','Giữ để tăng tốc','CHẠY')}
  </div>;
}
