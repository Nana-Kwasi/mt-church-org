// import React, { useEffect, useRef, useState } from 'react';

// const BackgroundAudio = ({ youtubeUrl, volume = 30 }) => {
//   const playerRef = useRef(null);
//   const [isReady, setIsReady] = useState(false);
//   const [userInteracted, setUserInteracted] = useState(false);

//   useEffect(() => {
//     // Extract video ID from YouTube URL
//     const getVideoId = (url) => {
//       const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
//       return match ? match[1] : null;
//     };

//     const initializePlayer = (videoId) => {
//       if (playerRef.current) {
//         playerRef.current.destroy();
//       }

//       playerRef.current = new window.YT.Player('youtube-background-player', {
//         videoId: videoId,
//         playerVars: {
//           autoplay: 0, // Start as 0, we'll play after user interaction
//           loop: 1,
//           playlist: videoId,
//           controls: 0,
//           showinfo: 0,
//           modestbranding: 1,
//           iv_load_policy: 3,
//           fs: 0,
//           cc_load_policy: 0,
//           playsinline: 1,
//           rel: 0
//         },
//         events: {
//           onReady: (event) => {
//             setIsReady(true);
//             event.target.setVolume(volume);
//             // Don't auto-play here, wait for user interaction
//           },
//           onStateChange: (event) => {
//             // Handle state changes if needed
//             if (event.data === window.YT.PlayerState.ENDED) {
//               event.target.playVideo(); // Loop the video
//             }
//           }
//         }
//       });
//     };

//     const videoId = getVideoId(youtubeUrl);
    
//     if (videoId && !window.YT) {
//       // Load YouTube API
//       const script = document.createElement('script');
//       script.src = 'https://www.youtube.com/iframe_api';
//       script.async = true;
//       document.body.appendChild(script);

//       window.onYouTubeIframeAPIReady = () => {
//         initializePlayer(videoId);
//       };
//     } else if (videoId && window.YT) {
//       initializePlayer(videoId);
//     }

//     // Add click listener to start audio after user interaction
//     const handleUserInteraction = () => {
//       if (playerRef.current && isReady && !userInteracted) {
//         playerRef.current.playVideo();
//         setUserInteracted(true);
//         // Remove listener after first interaction
//         document.removeEventListener('click', handleUserInteraction);
//         document.removeEventListener('keydown', handleUserInteraction);
//       }
//     };

//     document.addEventListener('click', handleUserInteraction);
//     document.addEventListener('keydown', handleUserInteraction);

//     return () => {
//       if (playerRef.current) {
//         playerRef.current.destroy();
//       }
//       document.removeEventListener('click', handleUserInteraction);
//       document.removeEventListener('keydown', handleUserInteraction);
//     };
//   }, [youtubeUrl, volume, isReady, userInteracted]);

//   return (
//     <div style={{ 
//       position: 'fixed', 
//       top: '-1000px', 
//       left: '-1000px',
//       width: '1px',
//       height: '1px',
//       zIndex: -1
//     }}>
//       <div id="youtube-background-player"></div>
//     </div>
//   );
// };

// export default BackgroundAudio;



import React, { useEffect, useRef, useState } from 'react';

const BackgroundAudio = ({ youtubeUrl, volume = 30 }) => {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    // Extract video ID from YouTube URL
    const getVideoId = (url) => {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
      return match ? match[1] : null;
    };

    const initializePlayer = (videoId) => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('youtube-background-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: videoId,
          controls: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          cc_load_policy: 0,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready');
            setIsReady(true);
            event.target.setVolume(volume);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                event.target.playVideo();
              }
            }
          }
        }
      });
    };

    const videoId = getVideoId(youtubeUrl);
    
    if (!videoId) {
      console.error('Invalid YouTube URL');
      return;
    }

    if (!window.YT) {
      // Load YouTube API
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      
      // Set up the callback before adding the script
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API loaded');
        initializePlayer(videoId);
      };
      
      document.body.appendChild(script);
    } else if (window.YT && window.YT.Player) {
      initializePlayer(videoId);
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [youtubeUrl, volume]);

  // Separate useEffect for handling user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('User interaction detected', { isReady, userInteracted, playerExists: !!playerRef.current });
      
      if (playerRef.current && 
          typeof playerRef.current.playVideo === 'function' && 
          isReady && 
          !userInteracted) {
        
        try {
          playerRef.current.playVideo();
          setUserInteracted(true);
          console.log('Video playback started');
        } catch (error) {
          console.error('Error starting video playback:', error);
        }
      }
    };

    // Only add listeners if player is ready and user hasn't interacted yet
    if (isReady && !userInteracted) {
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('keydown', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [isReady, userInteracted]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '-1000px', 
      left: '-1000px',
      width: '1px',
      height: '1px',
      zIndex: -1,
      pointerEvents: 'none'
    }}>
      <div id="youtube-background-player"></div>
    </div>
  );
};

export default BackgroundAudio;