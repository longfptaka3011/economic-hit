import React, { lazy, Suspense, type ComponentProps } from 'react';

const LazyGame=lazy(()=>import('./PhaserGame').then(module=>({default:module.PhaserGame})));
export function GameView(props:ComponentProps<typeof LazyGame>) {
  return <Suspense fallback={<div className="game-loading" role="status">ĐANG TẢI THÀNH PHỐ…</div>}><LazyGame {...props}/></Suspense>;
}
