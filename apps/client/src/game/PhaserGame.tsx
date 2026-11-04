import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { OnlineScene } from './scenes/OnlineScene';
import { LearningOverlay } from './ui/LearningOverlay';
import { TouchControls } from './ui/TouchControls';
import { RaceHUD,type RaceView } from './ui/RaceHUD';
import {GameplayFeedback} from './ui/GameplayFeedback';
import {MatchResults} from './ui/MatchResults';
import type { QuizView, OnlineSnapshot, AvatarProfile,MatchResult,MatchFeedbackEvent } from '@market-mayhem/shared';

interface PhaserGameProps {
  width?: number | string; height?: number | string; className?: string;
  onExitGame?: () => void; onToggleFullscreen?: () => void; isFullscreen?: boolean;
  online?: { snapshot:OnlineSnapshot; playerId:string };
  avatar?: AvatarProfile;
}
export const PhaserGame:React.FC<PhaserGameProps>=({className='',onExitGame,onToggleFullscreen,isFullscreen=false,online,avatar})=>{
  const containerRef=useRef<HTMLDivElement>(null);
  const gameRef=useRef<Phaser.Game|null>(null);
  const callbacks=useRef({onExitGame,onToggleFullscreen});callbacks.current={onExitGame,onToggleFullscreen};
  const [quiz,setQuiz]=useState<QuizView|null>(null);
  const [remainingSeconds,setRemainingSeconds]=useState<number>();
  const [race,setRace]=useState<RaceView|null>(null);
  const [controlsBlocked,setControlsBlocked]=useState(false);
  const [resetVersion,setResetVersion]=useState(0);
  const [result,setResult]=useState<MatchResult[]|null>(null);
  const [feedback,setFeedback]=useState<MatchFeedbackEvent[]>([]);
  const [localRound,setLocalRound]=useState(0);
  const matchId=online?.snapshot.matchId;
  useEffect(()=>{
    if(!containerRef.current)return;
    const game=new Phaser.Game({type:Phaser.AUTO,parent:containerRef.current,
      width:containerRef.current.clientWidth||window.innerWidth,height:containerRef.current.clientHeight||window.innerHeight,
      backgroundColor:'#172b2a',scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
      audio:{noAudio:true},
      scene:online?[new OnlineScene(online.snapshot,online.playerId)]:[new MainScene(avatar)],
      render:{pixelArt:true,antialias:false,roundPixels:true}});
    gameRef.current=game;
    game.events.on('learning:state',setQuiz);
    game.events.on('match:time',setRemainingSeconds);
    game.events.on('race:state',setRace);
    game.events.on('local:finished',setResult);
    game.events.on('match:feedback',setFeedback);
    const resetControls=()=>setResetVersion(value=>value+1);
    game.events.on('controls:reset',resetControls);
    game.events.on('controls:blocked',setControlsBlocked);
    game.events.on('request-fullscreen',()=>callbacks.current.onToggleFullscreen?.());
    game.events.on('request-exit-menu',()=>callbacks.current.onExitGame?.());
    return ()=>{game.events.off('match:feedback',setFeedback);game.events.off('race:state',setRace);game.events.off('match:time',setRemainingSeconds);game.events.off('learning:state',setQuiz);game.events.off('local:finished',setResult);game.events.removeAllListeners('request-fullscreen');game.events.removeAllListeners('request-exit-menu');game.destroy(true);gameRef.current=null;setQuiz(null);setResult(null);setRace(null);};
  },[matchId]);
  useEffect(()=>{
    if(online){const scene=gameRef.current?.scene.getScene('OnlineScene') as OnlineScene|undefined;scene?.applySnapshot(online.snapshot);}
  },[online?.snapshot]);
  useEffect(()=>{
    if(!online){const scene=gameRef.current?.scene.getScene('MainScene') as MainScene|undefined;scene?.setFullscreenState(isFullscreen);}
  },[isFullscreen]);
  const blocked=controlsBlocked || !!quiz || !!result || !!online?.snapshot.paused || !!online?.snapshot.finished || !!online?.snapshot.players.find(player=>player.id===online.playerId)?.learning;
  useEffect(()=>{gameRef.current?.events.emit('controls:reset');},[blocked]);
  return <><div ref={containerRef} className={'w-full h-full relative overflow-hidden select-none '+className}/>
    {!online && race && !controlsBlocked && <RaceHUD {...race} playerId="local_player" heading="LOCAL · CUỘC ĐUA KINH TẾ" actions={<><button onClick={()=>gameRef.current?.events.emit('request-pause')}>Menu</button><button onClick={()=>callbacks.current.onToggleFullscreen?.()}>Toàn màn hình</button></>}/>}
    <TouchControls disabled={blocked} resetVersion={resetVersion} onInput={input=>gameRef.current?.events.emit('controls:input',input)}/>
    <GameplayFeedback key={matchId??'local-'+localRound} events={online?.snapshot.events??feedback} players={online?.snapshot.players??race?.players??[]} playerId={online?.playerId??'local_player'} finished={online?.snapshot.finished??!!result}/>
    {quiz && <LearningOverlay quiz={quiz} remainingSeconds={remainingSeconds} onAnswer={(round,index)=>gameRef.current?.events.emit('learning:answer',round,index)}
      onContinue={round=>gameRef.current?.events.emit('learning:continue',round)} onExit={()=>callbacks.current.onExitGame?.()}/>}
    {result && <MatchResults results={result} playerId="local_player" onExit={()=>callbacks.current.onExitGame?.()} actions={<button className="pixel-button primary" onClick={()=>{
      setResult(null);setQuiz(null);setRace(null);setFeedback([]);setControlsBlocked(false);setLocalRound(round=>round+1);
      gameRef.current?.scene.getScene('MainScene').scene.restart();
    }}>CHƠI LẠI NGAY · GIỮ NHÂN VẬT</button>}/>}
  </>;
};
