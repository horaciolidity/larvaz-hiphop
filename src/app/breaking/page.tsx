'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Zap,
  Users,
  Star,
  Play,
  Trophy,
  MapPin,
  Calendar,
  ChevronRight,
  Flame,
  Radio,
  Music,
  Target,
  Shield,
} from 'lucide-react';

const CREWS = [
  {
    id: 'c1',
    name: 'Vortex Bboy Crew',
    city: 'Buenos Aires, AR',
    members: 8,
    style: 'Power Moves & Freezes',
    avatar: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=100&h=100&fit=crop',
    wins: 12,
  },
  {
    id: 'c2',
    name: 'Concrete Kingz',
    city: 'Santiago, CL',
    members: 6,
    style: 'Footwork & Toprock',
    avatar: 'https://images.unsplash.com/photo-1547910780-d1694e2d41c1?w=100&h=100&fit=crop',
    wins: 9,
  },
  {
    id: 'c3',
    name: 'Soul Breakers Medellín',
    city: 'Medellín, CO',
    members: 10,
    style: 'Old School & Windmills',
    avatar: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=100&h=100&fit=crop',
    wins: 15,
  },
  {
    id: 'c4',
    name: 'Floor Warriors MX',
    city: 'Ciudad de México, MX',
    members: 7,
    style: 'Floorwork & Backspin',
    avatar: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=100&h=100&fit=crop',
    wins: 7,
  },
];

const MOVES = [
  { name: 'Toprock', level: 'Básico', emoji: '🦵', desc: 'El fundamento. Movimiento de pie que marca el ritmo antes de bajar al suelo.' },
  { name: 'Footwork (6-step)', level: 'Básico', emoji: '👟', desc: 'Movimiento base en el suelo. 6 pasos alrededor del cuerpo.' },
  { name: 'Freeze', level: 'Intermedio', emoji: '🧊', desc: 'Pose estática que detiene el movimiento en el beat exacto.' },
  { name: 'Windmill', level: 'Intermedio', emoji: '🌀', desc: 'Rotación continua del cuerpo con las piernas abiertas.' },
  { name: 'Headspin', level: 'Avanzado', emoji: '⚡', desc: 'Gira sobre la cabeza. Requiere neck conditioning y práctica intensa.' },
  { name: 'Airflare', level: 'Avanzado', emoji: '🔥', desc: 'Rotación aérea solo sobre las manos. El move más difícil del breaking.' },
];

const BATTLES = [
  {
    id: 'b1',
    name: 'Cypher del Sur 2026',
    date: 'Nov 15, 2026',
    location: 'Plaza de Armas, Santiago',
    format: '1v1 / 2v2',
    prize: '$50 USD + Trophy',
    status: 'open',
  },
  {
    id: 'b2',
    name: 'Battle of BA — Round 3',
    date: 'Dic 3, 2026',
    location: 'Centro Cultural Recoleta, Buenos Aires',
    format: 'Crew vs Crew',
    prize: '$120 USD',
    status: 'open',
  },
  {
    id: 'b3',
    name: 'B-Boy Gran Prix LATAM',
    date: 'Ene 20, 2027',
    location: 'Foro Indie Rocks, Ciudad de México',
    format: '1v1 Eliminatoria',
    prize: '$300 USD + Travel Expenses',
    status: 'upcoming',
  },
];

const TIPS = [
  { icon: '🎵', title: 'Musicalidad', desc: 'Estudia los breaks del vinilo. Tu cuerpo tiene que responder al snare, el kick y el sample.' },
  { icon: '💪', title: 'Acondicionamiento', desc: 'Trabaja core, muñecas y cuello antes de intentar power moves. La prevención es clave.' },
  { icon: '🎯', title: 'Practica el Cypher', desc: 'Entra al círculo aunque no estés listo. El cypher enseña más que cualquier espejo.' },
  { icon: '📹', title: 'Filmate', desc: 'Graba tus sessions. El ojo externo revela errores que no ves desde adentro.' },
];

export default function BreakingPage() {
  const { changeStation, isRadioPlaying, toggleRadio } = useApp();
  const [activeTab, setActiveTab] = useState<'crews' | 'moves' | 'battles' | 'tips'>('crews');

  const handlePlayBreaking = () => {
    changeStation('station-breaking-bboys');
    if (!isRadioPlaying) toggleRadio();
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative p-6 rounded-3xl overflow-hidden border border-magenta/40 bg-surface shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,45,149,0.12),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(198,255,0,0.08),transparent_60%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-magenta animate-pulse" />
            <span className="text-[11px] font-bold text-magenta tracking-widest uppercase">Cultura Hip-Hop</span>
          </div>
          <h1 className="font-display font-black text-4xl text-content-primary tracking-tight leading-none">
            B-BOYS<br /><span className="text-magenta">&</span> B-GIRLS
          </h1>
          <p className="text-xs text-content-secondary leading-relaxed max-w-sm">
            El breaking es el pilar atlético y artístico del hip-hop. Crews, cyphers, battles y el sonido del linóleo — todo en un lugar.
          </p>
          
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handlePlayBreaking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-magenta text-white font-bold text-xs hover:opacity-90 transition-all shadow-lg"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Radio B-Boy</span>
            </button>
            <Link
              href="/eventos"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-bold text-content-primary hover:border-magenta/50 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-magenta" />
              <span>Ver Battles</span>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 mt-5 pt-4 border-t border-surface-border/60 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display font-black text-xl text-magenta">48</p>
            <p className="text-[10px] text-content-muted uppercase font-bold">B-Boys/Girls</p>
          </div>
          <div>
            <p className="font-display font-black text-xl text-acid">4</p>
            <p className="text-[10px] text-content-muted uppercase font-bold">Crews Activos</p>
          </div>
          <div>
            <p className="font-display font-black text-xl text-cyan">3</p>
            <p className="text-[10px] text-content-muted uppercase font-bold">Battles Próximas</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-surface-border pb-2 overflow-x-auto">
        {([['crews', 'Crews'], ['moves', 'Moves'], ['battles', 'Battles'], ['tips', 'Tips']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-magenta text-white shadow-lg font-black'
                : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Crews */}
      {activeTab === 'crews' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-magenta" />
              Crews Registrados en Larvaz
            </h2>
            <span className="text-[11px] text-content-muted">{CREWS.length} crews activos</span>
          </div>
          <div className="space-y-3">
            {CREWS.map((crew, i) => (
              <div key={crew.id} className="p-4 rounded-2xl bg-surface border border-surface-border hover:border-magenta/40 transition-all flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img src={crew.avatar} alt={crew.name} className="w-12 h-12 rounded-xl object-cover border-2 border-magenta/30" />
                  {i === 0 && (
                    <span className="absolute -top-1 -right-1 bg-acid text-background text-[8px] font-black px-1 rounded-full">
                      #1
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-content-primary truncate">{crew.name}</h3>
                  </div>
                  <p className="text-[11px] text-content-secondary mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{crew.city}
                  </p>
                  <p className="text-[11px] text-magenta font-bold mt-0.5">{crew.style}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-content-secondary">
                    <Users className="w-3 h-3" />
                    <span>{crew.members}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-acid font-bold mt-1">
                    <Trophy className="w-3 h-3" />
                    <span>{crew.wins} wins</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-2xl bg-magenta/10 border border-magenta/30 text-center space-y-2">
            <p className="text-xs font-bold text-magenta">¿Tu crew no está listada?</p>
            <p className="text-[11px] text-content-secondary">Publica en el muro con el tag <span className="text-acid font-bold">#breaking</span> o <span className="text-acid font-bold">#bboy</span> y tu crew aparecerá aquí.</p>
            <Link href="/crear" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-magenta text-white text-xs font-bold hover:opacity-90 transition-all">
              <Zap className="w-3.5 h-3.5" />
              Registrar mi Crew
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Moves */}
      {activeTab === 'moves' && (
        <div className="space-y-3">
          <h2 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-magenta" />
            Diccionario de Moves
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOVES.map((move) => (
              <div key={move.name} className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{move.emoji}</span>
                    <span className="font-display font-black text-base text-content-primary">{move.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    move.level === 'Básico' ? 'bg-acid/20 text-acid' :
                    move.level === 'Intermedio' ? 'bg-orange/20 text-orange' :
                    'bg-magenta/20 text-magenta'
                  }`}>
                    {move.level}
                  </span>
                </div>
                <p className="text-xs text-content-secondary leading-relaxed">{move.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Battles */}
      {activeTab === 'battles' && (
        <div className="space-y-3">
          <h2 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-magenta" />
            Próximas Battles & Cyphers
          </h2>
          <div className="space-y-3">
            {BATTLES.map((battle) => (
              <div key={battle.id} className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-black text-base text-content-primary">{battle.name}</h3>
                    <p className="text-[11px] text-content-secondary flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{battle.location}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                    battle.status === 'open' ? 'bg-acid/20 text-acid' : 'bg-cyan/20 text-cyan'
                  }`}>
                    {battle.status === 'open' ? 'Inscripciones' : 'Próximo'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1 text-content-secondary">
                    <Calendar className="w-3 h-3 text-magenta" />
                    {battle.date}
                  </span>
                  <span className="flex items-center gap-1 text-content-secondary">
                    <Shield className="w-3 h-3 text-cyan" />
                    {battle.format}
                  </span>
                  <span className="flex items-center gap-1 text-acid font-bold">
                    <Star className="w-3 h-3" />
                    {battle.prize}
                  </span>
                </div>
                {battle.status === 'open' && (
                  <button className="w-full py-2 rounded-xl bg-magenta text-white font-bold text-xs hover:opacity-90 transition-all">
                    Inscribirse a la Batalla
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Tips */}
      {activeTab === 'tips' && (
        <div className="space-y-3">
          <h2 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-magenta" />
            Tips de Entrenamiento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIPS.map((tip) => (
              <div key={tip.title} className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tip.icon}</span>
                  <span className="font-display font-black text-sm text-content-primary">{tip.title}</span>
                </div>
                <p className="text-xs text-content-secondary leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>

          {/* Radio CTA */}
          <div className="p-4 rounded-2xl bg-surface border border-magenta/30 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-content-primary">Activa la Radio B-Boy</p>
              <p className="text-[11px] text-content-secondary mt-0.5">Breakbeats, funk y soul para tu sesión de piso</p>
            </div>
            <button
              onClick={handlePlayBreaking}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-magenta text-white font-bold text-xs hover:opacity-90 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
