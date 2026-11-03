import Phaser from 'phaser';
import type { TouchInput } from '../ui/TouchControls';

export interface MovementInput {
  dx: number;
  dy: number;
  isMoving: boolean;
  rawX: number;
  rawY: number;
  sprint: boolean;
}

export class InputSystem {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private escKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private onEscPressed?: () => void;
  private touch:TouchInput={x:0,y:0,sprint:false};
  private receiveTouch=(input:TouchInput)=>{this.touch=input;};
  private clearInput=()=>{this.touch={x:0,y:0,sprint:false};this.scene.input.keyboard?.resetKeys();};

  constructor(private scene: Phaser.Scene, onEscPressed?: () => void) {
    this.onEscPressed = onEscPressed;
    scene.game.events.on('controls:input',this.receiveTouch);
    scene.game.events.on('controls:reset',this.clearInput);
    scene.game.events.on(Phaser.Core.Events.BLUR,this.clearInput);
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = scene.input.keyboard.addKeys('W,A,S,D') as any;
      this.escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      this.escKey.on('down', () => {
        if (this.onEscPressed) {
          this.onEscPressed();
        }
      });
    }
  }

  public getMovementInput(): MovementInput {
    let rawX = this.touch.x;
    let rawY = this.touch.y;

    // Horizontal input (A / Left / D / Right)
    if (this.wasdKeys?.A?.isDown || this.cursors?.left?.isDown) {
      rawX -= 1;
    }
    if (this.wasdKeys?.D?.isDown || this.cursors?.right?.isDown) {
      rawX += 1;
    }

    // Vertical input (W / Up / S / Down)
    if (this.wasdKeys?.W?.isDown || this.cursors?.up?.isDown) {
      rawY -= 1;
    }
    if (this.wasdKeys?.S?.isDown || this.cursors?.down?.isDown) {
      rawY += 1;
    }

    // Diagonal Normalization: prevent moving 1.414x faster diagonally
    let dx = Math.max(-1,Math.min(1,rawX));
    let dy = Math.max(-1,Math.min(1,rawY));
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      dx /= length;
      dy /= length;
    }

    return {
      dx,
      dy,
      isMoving: length > 0,
      rawX,
      rawY,
      sprint: !!this.spaceKey?.isDown || this.touch.sprint,
    };
  }

  public destroy(): void {
    this.scene.game.events.off('controls:input',this.receiveTouch);
    this.scene.game.events.off('controls:reset',this.clearInput);
    this.scene.game.events.off(Phaser.Core.Events.BLUR,this.clearInput);
    if (this.escKey) {
      this.escKey.removeAllListeners();
    }
  }
}

