import Phaser from 'phaser';
import { SprintAbility, SPRINT_CONFIG } from '@market-mayhem/shared';
import { needsTouchLayout } from './touchLayout';

export class SprintHUD {
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private width = 220;

  constructor(private scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    const style = { fontFamily: 'monospace', fontSize: '10px', color: '#f4d985' };
    this.title = scene.add.text(12, 9, 'NỘ 100 / 100', style);
    this.hint = scene.add.text(12, 47, 'GIỮ SPACE ĐỂ TĂNG TỐC', { ...style, fontSize: '9px', color: '#a9c3c3' });
    this.container = scene.add.container(14, 0, [this.graphics, this.title, this.hint]);
    this.container.setDepth(500).setScrollFactor(0);
    this.onResize(scene.scale.width, scene.scale.height);
    this.update(new SprintAbility());
  }

  public onResize(width: number, height: number): void {
    this.width = Math.min(240, Math.max(180, width - 172));
    this.container.setY(height - (needsTouchLayout()?262:136));
  }

  public update(sprint: SprintAbility): void {
    const color = sprint.exhausted ? 0xfb923c : sprint.isSprinting ? 0xfacc15 : 0x67d4db;
    this.graphics.clear().fillStyle(0x0b141e, 0.96).fillRect(0, 0, this.width, 68);
    this.graphics.lineStyle(2, color, 0.85).strokeRect(0, 0, this.width, 68);
    this.graphics.fillStyle(0x263b45).fillRect(12, 29, this.width - 24, 10);
    const fill = Math.round((this.width - 24) * sprint.rage / SPRINT_CONFIG.maxRage);
    this.graphics.fillStyle(color).fillRect(12, 29, fill, 10);
    this.title.setText(`NỘ ${Math.ceil(sprint.rage)} / ${SPRINT_CONFIG.maxRage}${sprint.isSprinting ? '  +60%' : ''}`);
    this.hint.setText(sprint.exhausted ? 'NHẢ NÚT CHẠY · HỒI 20 NỘ' : sprint.isSprinting ? 'ĐANG TĂNG TỐC · TIÊU HAO NỘ' : needsTouchLayout() ? 'GIỮ CHẠY ĐỂ TĂNG TỐC' : 'GIỮ SPACE ĐỂ TĂNG TỐC');
    this.hint.setFontSize(this.width < 220 ? 8 : 9);
  }

  public destroy(): void {
    this.container.destroy(true);
  }
}
