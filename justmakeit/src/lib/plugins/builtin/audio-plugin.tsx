/**
 * Audio Viewer Plugin
 * Handles audio playback with waveform visualization
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Volume2, Download, SkipBack, SkipForward } from 'lucide-react';
import type { ViewerPlugin, ViewerComponentProps } from '../types';

/**
 * Audio Player Component
 */
function AudioViewer({ url, contentId, metadata, onLoad, onError }: ViewerComponentProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      onLoad?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      onError?.(new Error('Failed to load audio'));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onLoad, onError]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-[var(--border-secondary)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-[var(--border-secondary)]">
        <div className="flex items-center space-x-2">
          <Music className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Audio Player</span>
        </div>
        <a
          href={url}
          download
          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>

      {/* Waveform Visualization (Placeholder) */}
      <div className="relative h-24 bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="flex items-end space-x-1 h-16">
          {[...Array(50)].map((_, i) => {
            const height = Math.sin(i * 0.5 + currentTime) * 30 + 30;
            const opacity = i / 50 < currentTime / duration ? 1 : 0.3;
            return (
              <div
                key={i}
                className="w-1 bg-purple-500 rounded-t transition-all"
                style={{
                  height: `${height}px`,
                  opacity,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-white space-y-3">
        {/* Timeline */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => skip(-10)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Skip -10s"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={() => skip(10)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Skip +10s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="p-3 bg-gray-50 border-t border-[var(--border-secondary)] text-xs text-gray-600 space-y-1">
          {metadata.prompt && <div><strong>Prompt:</strong> {metadata.prompt}</div>}
          {metadata.model && <div><strong>Model:</strong> {metadata.model}</div>}
          {metadata.duration && <div><strong>Duration:</strong> {metadata.duration}s</div>}
          {metadata.format && <div><strong>Format:</strong> {metadata.format}</div>}
        </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} src={url} />
    </div>
  );
}

/**
 * Audio Viewer Plugin
 */
export const audioViewerPlugin: ViewerPlugin = {
  id: 'audio-viewer',
  name: 'Audio Player',
  description: 'Play audio files with waveform visualization',
  version: '1.0.0',
  contentTypes: ['audio', 'text-to-audio'],
  capabilities: ['viewer'],
  ViewerComponent: AudioViewer,
  supportedExtensions: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
  canHandle: (url: string, contentType: string) => {
    return contentType === 'audio' || contentType === 'text-to-audio' ||
           /\.(mp3|wav|ogg|m4a|flac)$/i.test(url);
  },
};

