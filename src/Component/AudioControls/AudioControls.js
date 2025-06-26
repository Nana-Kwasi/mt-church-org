import React, { useState, useEffect } from 'react';

const AudioControls = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(25);
  const [isVisible, setIsVisible] = useState(true);

  const togglePlayPause = () => {
    const player = window.YT?.get('youtube-background-player');
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    const player = window.YT?.get('youtube-background-player');
    if (player) {
      player.setVolume(newVolume);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        🎵
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px'
    }}>
      <button
        onClick={togglePlayPause}
        style={{
          backgroundColor: 'transparent',
          border: '1px solid white',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={handleVolumeChange}
        style={{ width: '80px' }}
      />
      
      <span>{volume}%</span>
      
      <button
        onClick={toggleVisibility}
        style={{
          backgroundColor: 'transparent',
          border: '1px solid white',
          color: 'white',
          padding: '5px 8px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default AudioControls;