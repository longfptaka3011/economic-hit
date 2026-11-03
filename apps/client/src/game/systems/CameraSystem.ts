import Phaser from 'phaser';
import { MAP_CONFIG } from '../config/map.config';

export class CameraSystem {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private hudCamera: Phaser.Cameras.Scene2D.Camera;
  private currentZoom: number = 1;
  private minZoom: number = 1;
  private maxZoom: number = 3;

  constructor(private scene: Phaser.Scene) {
    this.camera = scene.cameras.main;
    this.hudCamera = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height, false, 'HUD');
    this.hudCamera.roundPixels = true;
    this.setupCamera();
    this.setupZoomControls(scene);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.routeLayers, this);
  }

  // Screen-space UI gets its own unzoomed camera. Include newly spawned effects
  // and rebuilt pause containers, without retaining references to dead objects.
  private routeLayers(): void {
    for (const object of this.scene.children.list) {
      const screenSpace = (object as Phaser.GameObjects.Container).depth >= 500;
      const mask = this.camera.id | this.hudCamera.id;
      object.cameraFilter = (object.cameraFilter & ~mask) | (screenSpace ? this.camera.id : this.hudCamera.id);
    }
  }

  private setupCamera(): void {
    // 1. Constrain camera within world boundaries
    this.camera.setBounds(0, 0, MAP_CONFIG.worldWidth, MAP_CONFIG.worldHeight);

    // 2. Set default comfortable zoom level
    this.camera.setZoom(this.currentZoom);

    // 3. Round pixels to prevent sub-pixel rendering jitter on retro tiles
    this.camera.roundPixels = true;
  }

  public followTarget(target: Phaser.GameObjects.GameObject | { x: number; y: number }): void {
    // Smooth LERP (0.08, 0.08) for lag-free, non-jittery camera tracking
    this.camera.startFollow(target, true, 0.08, 0.08);
  }

  private setupZoomControls(scene: Phaser.Scene): void {
    scene.input.on('wheel', this.onWheel, this);
  }

  private onWheel(
      _pointer: Phaser.Input.Pointer,
      _gameObjects: unknown[],
      _deltaX: number,
      deltaY: number
    ): void {
      if (deltaY === 0) return;
      const zoomStep = 1;
      if (deltaY > 0) {
        this.currentZoom = Math.max(this.minZoom, this.currentZoom - zoomStep);
      } else {
        this.currentZoom = Math.min(this.maxZoom, this.currentZoom + zoomStep);
      }
      this.camera.setZoom(this.currentZoom);
  }

  public onResize(width: number, height: number): void {
    if (this.camera) {
      this.camera.setSize(width, height);
      this.hudCamera.setSize(width, height);
    }
  }

  public getZoom(): number {
    return this.currentZoom;
  }

  public setZoom(zoom: number): void {
    this.currentZoom = Phaser.Math.Clamp(Math.round(zoom), this.minZoom, this.maxZoom);
    this.camera.setZoom(this.currentZoom);
  }

  public destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.routeLayers, this);
    this.scene.input.off('wheel', this.onWheel, this);
    this.scene.cameras.remove(this.hudCamera);
  }
}

