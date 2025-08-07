document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadContainer = document.getElementById('upload-container');
    const playerContainer = document.getElementById('player-container');
    const videoUpload = document.getElementById('video-upload');
    const video = document.getElementById('video');
    const playPauseBtn = document.getElementById('play-pause');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const muteBtn = document.getElementById('mute');
    const volumeSlider = document.getElementById('volume-slider');
    const rewindBtn = document.getElementById('rewind');
    const forwardBtn = document.getElementById('forward');
    const fullscreenBtn = document.getElementById('fullscreen');
    const speedSelect = document.getElementById('speed');
    const leftSkip = document.getElementById('left-skip');
    const rightSkip = document.getElementById('right-skip');

    // Variables for double tap detection
    let lastTap = 0;
    let tapTimeout;
    const DOUBLE_TAP_DELAY = 300; // ms
    const SKIP_SECONDS = 10;

    // Handle video upload
    videoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const videoURL = URL.createObjectURL(file);
            video.src = videoURL;
            
            // Switch to player view
            uploadContainer.style.display = 'none';
            playerContainer.style.display = 'block';
            
            // Load video metadata
            video.addEventListener('loadedmetadata', function() {
                durationDisplay.textContent = formatTime(video.duration);
            });
        }
    });

    // Drag and drop functionality
    const uploadBox = document.querySelector('.upload-box');
    
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#ff0000';
        uploadBox.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = '#555';
        uploadBox.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '#555';
        uploadBox.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
        
        if (e.dataTransfer.files.length) {
            videoUpload.files = e.dataTransfer.files;
            const event = new Event('change');
            videoUpload.dispatchEvent(event);
        }
    });

    // Play/Pause functionality
    function togglePlayPause() {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    video.addEventListener('click', togglePlayPause);

    // Update progress bar
    video.addEventListener('timeupdate', function() {
        const progress = (video.currentTime / video.duration) * 100;
        progressBar.value = progress;
        currentTimeDisplay.textContent = formatTime(video.currentTime);
    });

    // Set video time when progress bar is changed
    progressBar.addEventListener('input', function() {
        const time = (progressBar.value / 100) * video.duration;
        video.currentTime = time;
    });

    // Format time as MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Volume controls
    muteBtn.addEventListener('click', function() {
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
        volumeSlider.value = video.muted ? 0 : video.volume;
    });
    
    volumeSlider.addEventListener('input', function() {
        video.volume = volumeSlider.value;
        video.muted = volumeSlider.value == 0;
        muteBtn.innerHTML = volumeSlider.value == 0 ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    });

    // Skip forward/backward
    function skip(seconds) {
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    }
    
    rewindBtn.addEventListener('click', () => skip(-SKIP_SECONDS));
    forwardBtn.addEventListener('click', () => skip(SKIP_SECONDS));

    // Playback speed
    speedSelect.addEventListener('change', function() {
        video.playbackRate = speedSelect.value;
    });

    // Fullscreen
    fullscreenBtn.addEventListener('click', function() {
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            playerContainer.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            playerContainer.classList.remove('fullscreen');
        }
    });

    // Double tap to skip
    video.addEventListener('touchstart', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
            // Double tap detected
            clearTimeout(tapTimeout);
            
            // Determine tap position (left or right half of the video)
            const tapX = e.touches[0].clientX;
            const videoRect = video.getBoundingClientRect();
            const videoCenter = videoRect.left + (videoRect.width / 2);
            
            if (tapX < videoCenter) {
                // Left side - rewind
                skip(-SKIP_SECONDS);
                showSkipIndicator(leftSkip);
            } else {
                // Right side - forward
                skip(SKIP_SECONDS);
                showSkipIndicator(rightSkip);
            }
        } else {
            // Single tap (might become double tap)
            tapTimeout = setTimeout(() => {
                // Single tap action (toggle play/pause)
                togglePlayPause();
            }, DOUBLE_TAP_DELAY);
        }
        
        lastTap = currentTime;
    });

    // Mouse double click to skip (for desktop)
    video.addEventListener('dblclick', function(e) {
        const videoRect = video.getBoundingClientRect();
        const videoCenter = videoRect.left + (videoRect.width / 2);
        
        if (e.clientX < videoCenter) {
            // Left side - rewind
            skip(-SKIP_SECONDS);
            showSkipIndicator(leftSkip);
        } else {
            // Right side - forward
            skip(SKIP_SECONDS);
            showSkipIndicator(rightSkip);
        }
    });

    // Show skip indicator
    function showSkipIndicator(indicator) {
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1000);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (document.activeElement.tagName === 'INPUT') return;
        
        switch(e.key) {
            case ' ':
                togglePlayPause();
                e.preventDefault();
                break;
            case 'ArrowLeft':
                skip(-5);
                break;
            case 'ArrowRight':
                skip(5);
                break;
            case 'ArrowUp':
                video.volume = Math.min(1, video.volume + 0.1);
                volumeSlider.value = video.volume;
                break;
            case 'ArrowDown':
                video.volume = Math.max(0, video.volume - 0.1);
                volumeSlider.value = video.volume;
                break;
            case 'f':
                fullscreenBtn.click();
                break;
            case 'm':
                muteBtn.click();
                break;
        }
    });

    // Show controls when mouse moves
    let mouseMoveTimer;
    playerContainer.addEventListener('mousemove', function() {
        document.querySelector('.controls-container').style.transform = 'translateY(0)';
        clearTimeout(mouseMoveTimer);
        mouseMoveTimer = setTimeout(() => {
            if (!video.paused) {
                document.querySelector('.controls-container').style.transform = 'translateY(100%)';
            }
        }, 3000);
    });
});