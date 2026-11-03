import { describe, it, expect, vi } from 'vitest';
vi.mock('phaser',()=>({default:{Core:{Events:{BLUR:'blur'}},Input:{Keyboard:{KeyCodes:{ESC:27,SPACE:32}}}}}));
import { InputSystem } from '../InputSystem';

class EventEmitter {
  private listeners=new Map<string,Set<(...args:any[])=>void>>();
  on(event:string,listener:(...args:any[])=>void){if(!this.listeners.has(event))this.listeners.set(event,new Set());this.listeners.get(event)!.add(listener);return this;}
  off(event:string,listener:(...args:any[])=>void){this.listeners.get(event)?.delete(listener);if(!this.listeners.get(event)?.size)this.listeners.delete(event);return this;}
  emit(event:string,...args:any[]){this.listeners.get(event)?.forEach(listener=>listener(...args));}
  removeAllListeners(){this.listeners.clear();}
  eventNames(){return [...this.listeners.keys()];}
}

describe('keyboard and touch input lifecycle',()=>{
  const setup=()=>{
    const events=new EventEmitter();
    const key=()=>Object.assign(new EventEmitter(),{isDown:false});
    const wasd={W:key(),A:key(),S:key(),D:key()};
    const cursors={up:key(),down:key(),left:key(),right:key()};
    const keyboard={createCursorKeys:()=>cursors,addKeys:()=>wasd,addKey:key,resetKeys:vi.fn(()=>Object.values(wasd).forEach(key=>key.isDown=false))};
    const controls=new InputSystem({game:{events},input:{keyboard}} as any);
    return {events,wasd,controls};
  };
  it('normalizes diagonal touch movement and combines sprint without doubling keyboard speed',()=>{
    const {events,wasd,controls}=setup();
    events.emit('controls:input',{x:1,y:1,sprint:true});wasd.D.isDown=true;
    const movement=controls.getMovementInput();
    expect(movement.dx).toBeCloseTo(Math.SQRT1_2);expect(movement.dy).toBeCloseTo(Math.SQRT1_2);expect(movement.sprint).toBe(true);
    controls.destroy();
  });
  it('clears held movement on pause/quiz reset and tab blur, and removes listeners when destroyed',()=>{
    const {events,wasd,controls}=setup();
    for(const event of ['controls:reset','blur']){
      events.emit('controls:input',{x:1,y:0,sprint:true});wasd.D.isDown=true;
      events.emit(event);
      expect(controls.getMovementInput()).toMatchObject({dx:0,dy:0,isMoving:false,sprint:false});
    }
    controls.destroy();expect(events.eventNames()).toEqual([]);
  });
});
