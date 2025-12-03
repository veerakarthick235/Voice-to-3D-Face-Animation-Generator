import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const AnimationControls = ({
  isPlaying,
  currentFrame,
  totalFrames,
  onTogglePlay,
  onReset,
  onSeek
}) => {
  const handleSliderChange = (value) => {
    onSeek(value[0]);
  };

  const progress = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-blue-400">Playback Controls</h3>
      
      {/* Progress slider */}
      <div className="space-y-2">
        <Slider
          value={[currentFrame]}
          onValueChange={handleSliderChange}
          max={totalFrames - 1}
          step={1}
          className="w-full"
          data-testid="animation-slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Frame {currentFrame}</span>
          <span>{progress.toFixed(1)}%</span>
          <span>Frame {totalFrames - 1}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onTogglePlay}
          className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl"
          data-testid="play-pause-btn"
        >
          {isPlaying ? (
            <>
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Play
            </>
          )}
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="px-6 py-3 bg-gray-800 border-gray-700 hover:bg-gray-700 text-white rounded-xl"
          data-testid="reset-btn"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default AnimationControls;
