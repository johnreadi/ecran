import { motion } from 'framer-motion';
import { Play, Pause, Layers, Plus } from 'lucide-react';
import type { SlideElement, AnimationConfig } from '../types';

interface AnimationTimelineV2Props {
  elements: SlideElement[];
  selectedElementId: string | null;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onSelectElement: (id: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onAddAnimation: (elementId: string) => void;
}

export const AnimationTimelineV2: React.FC<AnimationTimelineV2Props> = ({
  elements,
  selectedElementId,
  isPlaying,
  currentTime,
  totalDuration,
  onSelectElement,
  onPlay,
  onPause,
  onSeek,
  onAddAnimation,
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${seconds}.${millis.toString().padStart(2, '0')}s`;
  };

  const getAnimationColor = (type: string) => {
    if (type.includes('Out')) return 'bg-red-500';
    if (type.includes('fade')) return 'bg-blue-500';
    if (type.includes('slide')) return 'bg-green-500';
    if (type.includes('scale') || type.includes('zoom')) return 'bg-purple-500';
    if (type.includes('rotate')) return 'bg-orange-500';
    return 'bg-[var(--primary-500)]';
  };

  return (
    <div className="h-56 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] flex flex-col">
      {/* Header */}
      <div className="h-10 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-[var(--text-tertiary)]" />
          <span className="text-[12px] font-medium">Timeline</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="btn btn-primary btn-icon"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* Timeline tracks */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Time ruler */}
        <div className="h-6 relative mb-2 border-b border-[var(--border-subtle)]">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute top-0 text-[9px] text-[var(--text-tertiary)]"
              style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
            >
              {formatTime((percent / 100) * totalDuration)}
            </div>
          ))}
        </div>

        {/* Element tracks */}
        <div className="space-y-1">
          {elements.map((element, index) => {
            const isSelected = selectedElementId === element.id;


            return (
              <div
                key={element.id}
                className={`
                  h-10 flex items-center gap-2 px-2 rounded cursor-pointer transition-colors
                  ${isSelected ? 'bg-[var(--primary-500)]/10' : 'hover:bg-[var(--bg-tertiary)]'}
                `}
              >
                {/* Element name */}
                <div 
                  className="w-24 shrink-0"
                  onClick={() => onSelectElement(element.id)}
                >
                  <span className="text-[11px] truncate block">
                    {element.type} {index + 1}
                  </span>
                </div>

                {/* Animation bars */}
                <div className="flex-1 h-8 relative bg-[var(--bg-tertiary)] rounded overflow-hidden">
                  {/* Total duration bar */}
                  <div 
                    className="absolute top-1 bottom-1 bg-white/5 rounded"
                    style={{ 
                      left: '0%', 
                      width: `${(element.timeline.totalDuration / totalDuration) * 100}%` 
                    }}
                  />

                  {/* Animation markers */}
                  {element.timeline.animations.map((anim: AnimationConfig) => {
                    const left = (anim.startTime / totalDuration) * 100;
                    const width = (anim.duration / totalDuration) * 100;
                    
                    return (
                      <motion.div
                        key={anim.id}
                        className={`
                          absolute h-5 top-1.5 rounded flex items-center px-1 cursor-pointer
                          ${getAnimationColor(anim.type)}
                          ${isSelected ? 'ring-1 ring-white' : ''}
                        `}
                        style={{ 
                          left: `${left}%`, 
                          width: `${Math.max(width, 2)}%`,
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => onSelectElement(element.id)}
                        title={`${anim.type} (${anim.startTime}ms - ${anim.startTime + anim.duration}ms)`}
                      >
                        <span className="text-[8px] text-white truncate w-full">
                          {anim.type}
                        </span>
                      </motion.div>
                    );
                  })}

                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-lg"
                    style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                  >
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-full" />
                  </div>
                </div>

                {/* Add animation button */}
                <button
                  onClick={() => onAddAnimation(element.id)}
                  className="btn btn-ghost btn-icon opacity-0 group-hover:opacity-100"
                  title="Ajouter une animation"
                >
                  <Plus size={14} />
                </button>

                {/* Duration */}
                <div className="w-14 text-right">
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {formatTime(element.timeline.totalDuration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Playback controls */}
      <div className="h-10 px-4 border-t border-[var(--border-subtle)] flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={totalDuration}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--primary-500) ${(currentTime / totalDuration) * 100}%, var(--bg-elevated) ${(currentTime / totalDuration) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
};
