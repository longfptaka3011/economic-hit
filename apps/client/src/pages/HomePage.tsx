import React, { useState, useEffect } from 'react';
import { socket, measurePing } from '../networking/socket';
import { GameView as PhaserGame } from '../game/GameView';
import { OnlineLobby } from './OnlineLobby';
import { AvatarSetup, loadAvatar, rememberAvatar } from '../components/AvatarSetup';
import { parseAvatarProfile } from '@market-mayhem/shared';
import { HowToPlay } from '../components/HowToPlay';
import {
  Play,
  PlusCircle,
  LogIn,
  ArrowLeft,
  ShieldCheck,
  Building2,
  TrendingUp,
  Landmark,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';

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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      {!isPlayingLocal && (
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-500 flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/20 text-white">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-base md:text-lg tracking-wider text-white">
                MARKET MAYHEM
              </h1>
              <p className="text-xs text-amber-400 font-medium">Chiến Trường Thị Trường • Multiplayer</p>
            </div>
          </div>

          {/* Server Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  isConnected ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/50'
                }`}
              />
              <span className="font-medium text-slate-300 hidden sm:inline">
                {isConnected ? 'Đã kết nối máy chủ' : 'Đang kết nối máy chủ…'}
              </span>
              {latency !== null && (
                <span className="text-emerald-400 border-l border-slate-700 pl-2 font-mono font-semibold">
                  {latency}ms
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      {isPlayingLocal ? (
        /* True Fullscreen 100% Viewport Gameplay Layout */
        <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-slate-950 flex flex-col">
          <PhaserGame
            avatar={profile}
            onExitGame={exitGameToMenu}
            onToggleFullscreen={toggleBrowserFullscreen}
            isFullscreen={isFullscreen}
            className="w-full h-full"
          />
        </div>
      ) : (
        /* Standard Home / Lobby View */
        <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 flex flex-col items-center justify-center">
          <div className="w-full flex flex-col items-center">
            {/* Hero Section */}
            {!isConnected && <p role="status" className="mb-4 text-sm text-amber-300 text-center">Máy chủ có thể cần một lúc để khởi động. Game sẽ tự kết nối lại; bạn vẫn có thể chơi thử với bot.</p>}
            <div className="text-center max-w-2xl mb-10">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Chơi cùng bạn bè · Khám phá và học qua từng ô đất</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
                MARKET MAYHEM
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Chiến trường tranh giành lãnh thổ kinh tế 2D thời gian thực.
                Mô hình hóa các hình thức biểu hiện của 
                <span className="text-amber-400 font-semibold"> Giá trị Thặng dư</span> theo Kinh tế Chính trị Mác – Lênin.
              </p>
            </div>

            {/* Core Action Buttons: Play, Create Room, Join Room */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mb-12">
              <button
                onClick={() => {setProfileError('');setLocalSetup(true);}}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition transform active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Chơi Thử Nghiệm</span>
              </button>

              <button
                onClick={() => setModalType('create')}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-100 border border-slate-700 hover:border-slate-600 flex items-center justify-center space-x-2 transition transform active:scale-95"
              >
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <span>Tạo Phòng</span>
              </button>

              <button
                onClick={() => setModalType('join')}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-100 border border-slate-700 hover:border-slate-600 flex items-center justify-center space-x-2 transition transform active:scale-95"
              >
                <LogIn className="w-5 h-5 text-emerald-400" />
                <span>Vào Phòng</span>
              </button>
            </div>

            <HowToPlay/>
            {/* Economic Zones Preview */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-red-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-red-400 mb-2 font-bold text-sm">
                    <Building2 className="w-4 h-4" />
                    <span>Khu Công Nghiệp</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Nguồn gốc trực tiếp sinh ra giá trị thặng dư (m) từ lao động thặng dư.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-red-400/90 mt-3">Lợi nhuận Công nghiệp</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-blue-400 mb-2 font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Khu Thương Nghiệp</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Lưu thông hàng hóa, gia tốc chuyển đổi giá trị thặng dư thành tiền mặt.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-blue-400/90 mt-3">Lợi nhuận Thương nghiệp</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-400 mb-2 font-bold text-sm">
                    <Landmark className="w-4 h-4" />
                    <span>Khu Tài Chính</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tư bản tiền tệ cho vay thu lợi tức định kỳ trên quy mô vốn tích lũy.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400/90 mt-3">Lợi tức (Interest)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-purple-400 mb-2 font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Khu Đất Đai</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Độc quyền sở hữu đất đai, thu địa tô từ người chơi khác khi họ đi qua.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-purple-400/90 mt-3">Địa tô TBCN (Ground Rent)</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      {!isPlayingLocal && (
        <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
          Market Mayhem © 2026 • Chơi local hoặc cùng bạn bè • Trạm tri thức đồng bộ
        </footer>
      )}
    </div>
  );
};

