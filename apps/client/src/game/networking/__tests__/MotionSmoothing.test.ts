import {describe,it,expect} from 'vitest';
import {SprintAbility,stepOnlineMotion,type OnlinePlayer,type OnlineSnapshot} from '@market-mayhem/shared';
import {LocalMotionPrediction,RemoteMotionBuffer} from '../MotionSmoothing';

const player=(overrides:Partial<OnlinePlayer>={}):OnlinePlayer=>({id:'p',nickname:'Player',character:0,color:1,ready:true,x:100,y:100,vx:0,vy:0,rage:100,sprinting:false,exhausted:false,shield:0,score:0,ownedCells:25,learning:false,lastInputSequence:-1,inputAgeSeconds:0,motionRevision:0,sprintRecoveryDelaySeconds:0,economy:{} as OnlinePlayer['economy'],...overrides});
const snapshot=(tick:number,p:OnlinePlayer,overrides:Partial<OnlineSnapshot>={}):OnlineSnapshot=>({matchId:'match',tick,remainingSeconds:480,paused:false,finished:false,players:[p],trails:{},territoryRevision:0,events:[],...overrides});
const right={dx:1,dy:0,sprint:false},stop={dx:0,dy:0,sprint:false};

describe('Local movement prediction',()=>{
  it('tracks intended movement under 160–210ms round-trip delay with dropped heartbeats',()=>{
    const prediction=new LocalMotionPrediction();prediction.reconcile(player(),0,0);
    const server={x:100,y:100,vx:0,vy:0,sprint:new SprintAbility()},ideal={x:100,y:100,vx:0,vy:0,sprint:new SprintAbility()};
    let sequence=0,ack=-1,age=0,held=stop,lastIntent=stop;
    const inputs:Array<{at:number;seq:number;input:typeof stop}>=[],packets:Array<{at:number;p:OnlinePlayer;tick:number}>=[];
    let errorTotal=0,samples=0,maxError=0;
    for(let frame=1;frame<=600;frame++){
      const now=frame*1000/60;
      const input=frame<120?right:frame<240?{dx:0,dy:1,sprint:true}:frame<360?{dx:-1,dy:0,sprint:true}:stop;
      const changed=JSON.stringify(input)!==JSON.stringify(lastIntent);
      if(changed || frame%3===0){
        prediction.recordSent(++sequence,now);
        if(changed || sequence%7!==0)inputs.push({at:now+80+(sequence%3)*8,seq:sequence,input});
        lastIntent=input;
      }
      for(let i=0;i<inputs.length;){if(inputs[i].at>now){i++;continue;}const next=inputs.splice(i,1)[0];if(next.seq>ack){ack=next.seq;held=next.input;age=0;}}
      age+=1/60;stepOnlineMotion(server,held,1/60);stepOnlineMotion(ideal,input,1/60);
      if(frame%6===0)packets.push({at:now+80+(frame%4)*8,tick:frame,p:player({...server,rage:server.sprint.rage,sprinting:server.sprint.isSprinting,exhausted:server.sprint.exhausted,sprintRecoveryDelaySeconds:server.sprint.recoveryDelaySeconds,lastInputSequence:ack,inputAgeSeconds:age})});
      const visual=prediction.advance(now,input)!;
      for(let i=0;i<packets.length;){if(packets[i].at>now){i++;continue;}const packet=packets.splice(i,1)[0];prediction.reconcile(packet.p,packet.tick,now);}
      if(frame>60){const error=Math.hypot(visual.x-ideal.x,visual.y-ideal.y);errorTotal+=error;samples++;maxError=Math.max(error,maxError);}
    }
    expect(errorTotal/samples).toBeLessThan(8);expect(maxError).toBeLessThan(30);
  });
  it('responds before a server update and matches authoritative acceleration, sprint and boundaries',()=>{
    const prediction=new LocalMotionPrediction();const p=player({x:4070});prediction.reconcile(p,0,0);
    const authority={x:p.x,y:p.y,vx:0,vy:0,sprint:new SprintAbility()};
    for(let frame=1;frame<=24;frame++){
      const input={dx:1,dy:1,sprint:frame<12};stepOnlineMotion(authority,input,1/60);
      const rendered=prediction.advance(frame*1000/60,input)!;
      expect(rendered.x).toBeCloseTo(authority.x,8);expect(rendered.y).toBeCloseTo(authority.y,8);
      expect(rendered.sprint.rage).toBeCloseTo(authority.sprint.rage,8);
      expect(Math.hypot(rendered.vx,rendered.vy)).toBeLessThanOrEqual((frame<12?280:175)+1e-8);
    }
    expect(authority.x).toBe(4082);
  });
  it('replays recent intent after an acknowledgement and converges smoothly after release',()=>{
    const prediction=new LocalMotionPrediction();prediction.reconcile(player(),0,0);prediction.recordSent(1,0);
    for(let i=1;i<=6;i++)prediction.advance(i*1000/60,right);
    const authority={x:100,y:100,vx:0,vy:0,sprint:new SprintAbility()};
    for(let i=0;i<3;i++)stepOnlineMotion(authority,right,1/60);
    const before=prediction.advance(100,right)!;
    prediction.reconcile(player({...authority,rage:authority.sprint.rage,lastInputSequence:1,inputAgeSeconds:.05}),3,100);
    const after=prediction.advance(100,stop)!;
    expect(after.x).toBeCloseTo(before.x,8);expect(after.vx).toBeGreaterThan(authority.vx);
    prediction.reconcile(player({x:110}),6,200);
    for(let i=1;i<=20;i++)prediction.advance(200+i*10,stop);
    expect(prediction.advance(400,stop)!.x).toBeCloseTo(110,0);
  });
  it('snaps on respawn even at a short distance and clears old pending input',()=>{
    const prediction=new LocalMotionPrediction();prediction.reconcile(player(),0,0);prediction.recordSent(1,0);prediction.advance(100,right);
    prediction.reconcile(player({x:90,motionRevision:1}),6,100);
    expect(prediction.advance(100,stop)!.x).toBe(90);
  });
  it('freezes immediately for learning and same-tick finish; resuming cannot replay pre-quiz input',()=>{
    const prediction=new LocalMotionPrediction();prediction.reconcile(player(),0,0);prediction.recordSent(1,0);prediction.advance(50,right);
    prediction.reconcile(player({x:102,learning:true}),3,50,true);
    expect(prediction.advance(100,right)).toMatchObject({x:102,vx:0});
    prediction.reconcile(player({x:102,motionRevision:1}),4,110);
    expect(prediction.advance(110,stop)!.x).toBe(102);
    prediction.reconcile(player({x:102}),4,120,true);
    expect(prediction.advance(150,right)!.x).toBe(102);
  });
  it('bounds prediction during an outage and rejects late authoritative packets',()=>{
    const prediction=new LocalMotionPrediction();prediction.reconcile(player(),10,0);
    for(let i=1;i<=50;i++)prediction.advance(i*10,right);
    const x=prediction.advance(500,right)!.x;
    expect(prediction.advance(1000,right)).toMatchObject({x,vx:0});
    prediction.reconcile(player({x:900}),9,1100);expect(prediction.advance(1100,stop)!.x).toBe(x);
  });
});

describe('Remote snapshot interpolation',()=>{
  it('uses server ticks instead of uneven arrival spacing and holds through a missing update',()=>{
    const buffer=new RemoteMotionBuffer();buffer.push(snapshot(0,player()),1000);
    buffer.push(snapshot(6,player({x:120,vx:200})),1100);
    buffer.push(snapshot(12,player({x:140,vx:200})),1230);
    expect(buffer.sample('p',1270)!.x).toBeCloseTo(130);
    expect(buffer.sample('p',1320)!.x).toBe(140);
    expect(buffer.sample('p',2000)).toMatchObject({x:140,vx:0});
    buffer.push(snapshot(6,player({x:900})),2050);expect(buffer.sample('p',2050)!.x).toBe(140);
  });
  it('never interpolates across respawns, learning, same-tick finish or removed players',()=>{
    const buffer=new RemoteMotionBuffer();buffer.push(snapshot(0,player({x:500})),0);
    buffer.push(snapshot(6,player({x:90,motionRevision:1})),100);
    expect(buffer.sample('p',100)!.x).toBe(90);
    buffer.push(snapshot(12,player({x:110,motionRevision:1,learning:true})),200);
    expect(buffer.sample('p',200)!.x).toBe(110);
    buffer.push(snapshot(12,player({x:115,motionRevision:1}),{finished:true}),210);
    expect(buffer.sample('p',210)!.x).toBe(115);
    buffer.push(snapshot(13,player(),{players:[]}),220);expect(buffer.sample('p',220)).toBeNull();
  });
});
