export type GameCue='capture'|'cut'|'loss'|'rank'|'finish';
class GameAudio {
  enabled=false;
  private context:AudioContext|null=null;
  private lastPlayed=0;
  setEnabled(value:boolean):void {
    this.enabled=value;
    if(value){try{this.context??=new AudioContext();void this.context.resume().catch(()=>{});}catch{this.enabled=false;}}
    else if(this.context)void this.context.suspend().catch(()=>{});
  }
  play(cue:GameCue):void {
    const context=this.context;if(document.hidden || !this.enabled || !context || context.state!=='running' || performance.now()-this.lastPlayed<120)return;
    this.lastPlayed=performance.now();
    const notes:Record<GameCue,number[]>={capture:[440,660,880],cut:[660,880],loss:[220,165,110],rank:[523,659,784],finish:[523,659,784,1047]};
    notes[cue].forEach((frequency,index)=>{
      const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+index*.09;
      oscillator.type='triangle';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.07,start+.008);gain.gain.exponentialRampToValueAtTime(.001,start+.12);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+.13);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    });
  }
}
export const gameAudio=new GameAudio();
