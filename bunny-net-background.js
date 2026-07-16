function initBunnyPlayerBackground() {
  document.querySelectorAll('[data-bunny-background-init]').forEach(function (player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch (_) {}
    try {
      video.removeAttribute('src');
      video.load();
    } catch (_) {}

    // Attribute helpers
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }

    function setActivated(v) {
      player.setAttribute('data-player-activated', v ? 'true' :
        'false');
    }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    // Flags
    var lazyMode = player.getAttribute('data-player-lazy'); // "true" | "false" (no meta)
    var isLazyTrue = lazyMode === 'true';
    var autoplay = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';

    // Used to suppress 'ready' flicker when user just pressed play in lazy modes
    var pendingPlay = false;

    // Autoplay forces muted + loop; IO will drive play/pause
    if (autoplay) {
      video.muted = true;
      video.loop = true;
    }
    else { video.muted = initialMuted; }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var canUseHlsJs = !!(window.Hls && Hls.isSupported());
    var isSafariNative = !canUseHlsJs && !!video.canPlayType('application/vnd.apple.mpegurl');

    // Attach media only once (for actual playback)
    var isAttached = false;
    var userInteracted = false;
    var lastPauseBy = ''; // 'io' | 'manual' | ''
    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch (_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = isLazyTrue ? 'none' : 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function () {
          readyIfIdle(player, pendingPlay);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function () { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          readyIfIdle(player, pendingPlay);
        });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    // Initialize based on lazy mode
    if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    // Toggle play/pause
    function togglePlay() {
      userInteracted = true;
      if (video.paused || video.ended) {
        if (isLazyTrue && !isAttached) attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }

    // Toggle mute
    function toggleMute() {
      video.muted = !video.muted;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }

    // Controls (delegated)
    player.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    });

    // Media event wiring
    video.addEventListener('play', function () {
      setActivated(true);
      setStatus('playing');
    });
    video.addEventListener('playing', function () {
      pendingPlay = false;
      setStatus('playing');
    });
    video.addEventListener('pause', function () {
      pendingPlay = false;
      setStatus('paused');
    });
    video.addEventListener('waiting', function () { setStatus('loading'); });
    video.addEventListener('canplay', function () { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended', function () {
      pendingPlay = false;
      setStatus('paused');
      setActivated(false);
    });

    // In-view auto play/pause (only when autoplay is true)
    if (autoplay) {
      if (player._io) { try { player._io.disconnect(); } catch (_) {} }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
      player._io = io;
    }
  });

  // Helper: Ready status guard
  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
      player.getAttribute('data-player-activated') !== 'true' &&
      player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  // Helper: safe programmatic play
  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function () {});
  }
}

// Initialize Bunny HTML HLS Player (Background)
initBunnyPlayerBackground();
console.log("Bunny Background Loaded")
