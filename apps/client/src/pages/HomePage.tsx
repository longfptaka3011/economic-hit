import React, { useState, useEffect } from 'react';
import { socket, measurePing } from '../networking/socket';
import { GameView as PhaserGame } from '../game/GameView';
import { OnlineLobby } from './OnlineLobby';
import { AvatarSetup, loadAvatar, rememberAvatar } from '../components/AvatarSetup';
import { GAME_CONSTANTS,parseAvatarProfile } from '@market-mayhem/shared';
import { HowToPlay } from '../components/HowToPlay';
import {CircleHelp,Maximize2,Gamepad2,Users} from 'lucide-react';
import {HomePixelIcon,type HomeIconKind} from '../components/HomePixelIcon';
import '../styles/home.css';

export const HomePage: React.FC = () => {
  const [isPlayingLocal, setIsPlayingLocal] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [latency, setLatency] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'create' | 'join' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [profile,setProfile]=useState(loadAvatar);
  const [localSetup,setLocalSetup]=useState(false);
  const [profileError,setProfileError]=useState('');

  // Monitor browser fullscreen state
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const exitGameToMenu = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsPlayingLocal(false);
  };

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      measurePing().then(setLatency);
    }
    function onDisconnect() {
      setIsConnected(false);
      setLatency(null);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setIsConnected(true);
      measurePing().then(setLatency);
    }

    const interval = setInterval(() => {
      if (socket.connected) {
        measurePing().then(setLatency);
      }
    }, 4000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      clearInterval(interval);
    };
  }, []);

  if (modalType) return <OnlineLobby initialMode={modalType} initialProfile={profile} onExit={() => setModalType(null)} />;
  if (localSetup) return <main className="online-shell"><section className="online-card"><div className="eyebrow">CHUẨN BỊ KHỞI NGHIỆP · LOCAL</div><h1>Tạo nhân vật của bạn</h1><form onSubmit={event=>{
    event.preventDefault();const valid=parseAvatarProfile(profile);
    if(!valid){setProfileError('Tên nhân vật cần 2–24 ký tự và không được chỉ chứa khoảng trắng.');return;}
    setProfile(valid);rememberAvatar(valid);setLocalSetup(false);setIsPlayingLocal(true);
  }}><AvatarSetup value={profile} onChange={value=>{setProfile(value);setProfileError('');}}/>{profileError && <p role="alert" className="online-error">{profileError}</p>}<button className="pixel-button primary">VÀO THÀNH PHỐ · 8 PHÚT</button></form><button className="learning-exit" onClick={()=>setLocalSetup(false)}>Về trang chủ</button></section></main>;
  if(isPlayingLocal)return <div className="game-viewport"><PhaserGame avatar={profile} onExitGame={exitGameToMenu} onToggleFullscreen={toggleBrowserFullscreen} isFullscreen={isFullscreen} className="w-full h-full"/></div>;

  const districts:Array<{icon:HomeIconKind;title:string;description:string;reward:string;theme:string}>=[
    {icon:'factory',title:'Khu Công nghiệp',description:'Khám phá nguồn gốc giá trị thặng dư và hình thái lợi nhuận.',reward:'Lợi nhuận công nghiệp',theme:'industrial'},
    {icon:'shop',title:'Khu Thương nghiệp',description:'Theo dòng hàng hóa, tìm hiểu sự phân chia lợi nhuận trong lưu thông.',reward:'Lợi nhuận thương nghiệp',theme:'commercial'},
    {icon:'bank',title:'Khu Tài chính',description:'Phân biệt lợi tức và lợi nhuận của người sử dụng tư bản.',reward:'Vốn vay · Lợi tức',theme:'financial'},
    {icon:'land',title:'Khu Đất đai',description:'Tìm hiểu địa tô và quan hệ sở hữu, sử dụng đất đai.',reward:'Đất đai · Địa tô',theme:'land'},
  ];
  const showHelp=()=>{
    const guide=document.querySelector<HTMLDetailsElement>('.storybook-guide details');
    if(guide){guide.open=true;guide.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});guide.querySelector('summary')?.focus({preventScroll:true});}
  };
  return <div className="storybook-home" id="home-top">
    <a className="home-skip" href="#home-actions">Đến nút chơi</a>
    <header className="storybook-header">
      <a href="#home-top" className="storybook-brand"><span aria-hidden="true">✦</span> MARKET MAYHEM <span aria-hidden="true">✦</span></a>
      <nav className="storybook-nav" aria-label="Giới thiệu trò chơi"><a href="#district-heading"><Gamepad2 size={21}/> Chiến trường thị trường</a><a href="#home-actions"><Users size={21}/> Multiplayer</a></nav>
      <div className="storybook-tools"><div className={'storybook-status '+(isConnected?'connected':'')} role="status"><i aria-hidden="true"/><span>{isConnected?'Đã kết nối máy chủ':'Đang kết nối…'}</span>{latency!==null && <strong className={latency>150?'high-ping':''} title="Thời gian khứ hồi đến máy chủ">{latency} ms</strong>}</div><button onClick={toggleBrowserFullscreen} className="storybook-tool" aria-label={isFullscreen?'Thoát toàn màn hình':'Toàn màn hình'} title="Toàn màn hình"><Maximize2/></button><button className="storybook-tool" onClick={showHelp} aria-label="Hướng dẫn chơi" title="Hướng dẫn chơi"><CircleHelp/></button></div>
    </header>
    <main>
      <section className="storybook-hero" aria-labelledby="home-title">
        <div className="storybook-hero-inner">
          <div className="storybook-logo"><span className="home-flag" aria-hidden="true"/><span className="logo-star star-left" aria-hidden="true">✦</span><h1 id="home-title">MARKET MAYHEM</h1><span className="logo-star star-right" aria-hidden="true">✦</span><div className="storybook-ribbon">CHIẾN TRƯỜNG GIÁ TRỊ THẶNG DƯ</div></div>
          <p className="storybook-description">Vẽ đường chiếm đất. Tích lũy lợi nhuận. Bứt phá bằng kiến thức.<br/><span>Khám phá các hình thức biểu hiện của <strong>giá trị thặng dư</strong> qua cuộc đua kinh tế cùng bạn bè.</span></p>
          <div className="storybook-actions" id="home-actions" tabIndex={-1}>
            <button className="storybook-cta cta-gold" onClick={()=>{setProfileError('');setLocalSetup(true);}}><HomePixelIcon kind="play"/><span>Chơi Thử Nghiệm<small>Luyện tập một mình</small></span></button>
            <button className="storybook-cta cta-blue" onClick={()=>setModalType('create')}><HomePixelIcon kind="chest"/><span>Tạo Phòng<small>Mời bạn bè tranh tài</small></span></button>
            <button className="storybook-cta cta-green" onClick={()=>setModalType('join')}><HomePixelIcon kind="people"/><span>Vào Phòng<small>Tham gia bằng mã phòng</small></span></button>
          </div>
          <div className="storybook-match-facts"><span><b>8</b> phút mỗi trận</span><i aria-hidden="true">◆</i><span><b>2–{GAME_CONSTANTS.MAX_PLAYERS}</b> người online</span><i aria-hidden="true">◆</i><span><b>10</b> câu hỏi / người</span></div>
          {!isConnected && <p className="storybook-offline" role="status">Chưa kết nối máy chủ. Bạn vẫn có thể luyện tập một mình trong lúc chờ.</p>}
        </div>
      </section>
      <section className="storybook-districts" aria-labelledby="district-heading">
        <div className="storybook-section-title"><span aria-hidden="true">◆</span><h2 id="district-heading">Bốn khu phố. Bốn cơ hội bứt phá.</h2><span aria-hidden="true">◆</span></div>
        <div className="storybook-district-grid">{districts.map((district,index)=><article key={district.theme} className={'storybook-district district-'+district.theme}>
          <div className={'storybook-district-art art-'+index} role="img" aria-label={'Minh họa pixel art '+district.title.toLowerCase()}/>
          <div className="storybook-district-body"><h3><HomePixelIcon kind={district.icon}/>{district.title}</h3><p>{district.description}</p><span className="storybook-district-reward">{district.reward}</span></div>
        </article>)}</div>
        <p className="storybook-learning-note">Cùng một cuộc đua, tiến độ tri thức riêng: trả lời đúng nhận khiên 5 giây; trả lời sai chờ 5 giây. Không chờ cả phòng.</p>
      </section>
      <div className="storybook-guide"><HowToPlay/></div>
    </main>
    <footer className="storybook-footer"><span aria-hidden="true">◆ ━━━━━ ◆</span><p>Market Mayhem © 2026 <i>·</i> Chơi local hoặc cùng bạn bè <i>·</i> Học qua từng cuộc đua</p><span aria-hidden="true">◆ ━━━━━ ◆</span></footer>
  </div>;
};
