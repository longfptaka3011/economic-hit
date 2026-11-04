import React from 'react';

export type HomeIconKind='play'|'chest'|'people'|'factory'|'shop'|'bank'|'land';
/** Small original pixel-shaped icons; text labels carry the accessible name. */
export function HomePixelIcon({kind}:{kind:HomeIconKind}) {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="home-pixel-icon" shapeRendering="crispEdges">
    <g stroke="#382343" strokeWidth="2" strokeLinejoin="miter">
      {kind==='play' && <><path d="M8 3h4v3h4v3h4v3h4v3h3v3h-3v3h-4v3h-4v3h-4v3H8Z" fill="#ffe995"/><path d="M10 6v20" stroke="#fff9cd"/></>}
      {kind==='chest' && <><path d="M4 7h24v6h2v15H2V13h2Z" fill="#a9562a"/><path d="M2 13h28v7H2Z" fill="#f4be54"/><path d="M7 5h18v8H7Z" fill="#cf7c31"/><path d="M7 6v12m18-12v12" stroke="#ffe390"/><path d="M13 17h6v8h-6Z" fill="#ffe596"/></>}
      {kind==='people' && <><path d="M5 6h7v9H5Zm16 0h7v9h-7Z" fill="#b3dd77"/><path d="M2 19h13v10H2Zm16 0h12v10H18Z" fill="#75b765"/><path d="M12 3h9v11h-9Zm-3 15h15v13H9Z" fill="#d7ef9a"/><path d="M12 20h9" stroke="#f3ffd5"/></>}
      {kind==='factory' && <><path d="M4 2h5v15H4Zm18 3h5v12h-5Z" fill="#df9470"/><path d="m2 19 9-7v7l10-7v7h9v11H2Z" fill="#c9784d"/><path d="M6 23h3v3H6Zm8 0h3v3h-3Zm9 0h3v3h-3Z" fill="#ffdb85"/><path d="M3 6h7m11 3h7" stroke="#ffe4a2"/></>}
      {kind==='shop' && <><path d="M5 12h22v18H5Z" fill="#e2b274"/><path d="M4 3h24l3 10H1Z" fill="#f2db97"/><path d="m10 3-1 10m11-10 2 10" stroke="#d56c63" strokeWidth="5"/><path d="M10 19h5v11h-5Zm10 0h4v6h-4Z" fill="#6c9baf"/></>}
      {kind==='bank' && <><path d="m16 2 14 9H2Z" fill="#e4ca78"/><path d="M4 13h24v4H4Zm-2 14h28v4H2Z" fill="#d7c68e"/><path d="M7 17h4v10H7Zm14 0h4v10h-4Z" fill="#fff0b7"/><path d="M14 17h4v10h-4Z" fill="#fff0b7"/></>}
      {kind==='land' && <><path d="M1 25h30v6H1Z" fill="#ac8151"/><path d="M1 24h30" stroke="#b0d376" strokeWidth="4"/><path d="M14 15h4v10h-4Z" fill="#a6744f"/><path d="M10 3h12v4h5v13H5V7h5Z" fill="#96c774"/><path d="M9 8h10" stroke="#d5eaa0"/></>}
    </g>
  </svg>;
}
