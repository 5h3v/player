const playPauseButton = document.getElementById('play-pause');
const audio = document.getElementById('audio');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const playlistList = document.getElementById('playlist-list');
const trackList = document.getElementById('track-list');
const addPlaylistForm = document.getElementById('add-playlist-form');
const addTrackForm = document.getElementById('add-track-form');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const tracksHeader = document.getElementById('tracks-header');
const nowPlaying = document.getElementById('now-playing');
const visualizer = document.getElementById('visualizer');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const trackNameInput = document.getElementById('track-name');
const trackFileInput = document.getElementById('track-file');
const playerSection = document.getElementById('player-section');
const tracksSection = document.getElementById('tracks-section');

let playlists = [];
let currentPlaylist = null;
let currentTrackIndex = 0;
let audioCtx, analyser, source, dataArray, animationId;

// --- AudioContext и визуализатор ---
function ensureAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
}
function setupVisualizer() {
    ensureAudioContext();
}
function animateVisualizer() {
    if (!analyser) return;
    analyser.getByteFrequencyData(dataArray);
    visualizer.innerHTML = '';
    for (let i = 0; i < dataArray.length; i++) {
        // Сделаем визуализацию менее чувствительной
        let value = Math.max(8, dataArray[i] / 8 + 8); 
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        bar.style.height = value + 'px';
        visualizer.appendChild(bar);
    }
    animationId = requestAnimationFrame(animateVisualizer);
}
function stopVisualizer() {
    if (animationId) cancelAnimationFrame(animationId);
    if (visualizer) visualizer.innerHTML = '';
}

// --- Воспроизведение трека ---
function playTrack() {
    if (!currentPlaylist || !currentPlaylist.tracks.length) return;
    stopVisualizer();
    const track = currentPlaylist.tracks[currentTrackIndex];
    audio.pause();
    audio.src = track.url;
    nowPlaying.textContent = track.name;
    audio.load();
    audio.oncanplay = () => {
        audio.oncanplay = null;
        safePlay();
    };
    updateTrackList();
}
function safePlay() {
    setupVisualizer();
    audioCtx && audioCtx.resume();
    audio.play().then(() => {
        animateVisualizer();
    }).catch(() => {
        // Ошибка автозапуска (например, без взаимодействия пользователя)
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    });
}

playPauseButton.addEventListener('click', () => {
    if (audio.paused) {
        safePlay();
    } else {
        audio.pause();
    }
});

audio.addEventListener('play', () => {
    playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
});
audio.addEventListener('pause', () => {
    playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    stopVisualizer();
});
audio.addEventListener('ended', () => {
    stopVisualizer();
    // Автоматически следующий трек
    if (currentPlaylist && currentPlaylist.tracks.length > 0) {
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.tracks.length;
        playTrack();
    }
});

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = percent + '%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
    }
});
audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * audio.duration;
});

nextButton.addEventListener('click', () => {
    if (!currentPlaylist || !currentPlaylist.tracks.length) return;
    currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.tracks.length;
    playTrack();
});

prevButton.addEventListener('click', () => {
    if (!currentPlaylist || !currentPlaylist.tracks.length) return;
    currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.tracks.length) % currentPlaylist.tracks.length;
    playTrack();
});

function updateTrackList() {
    trackList.innerHTML = '';
    updateAddTrackFormVisibility();
    if (!currentPlaylist) {
        tracksHeader.textContent = 'Треки (выберите плейлист)';
        return;
    }
    tracksHeader.textContent = `Треки (${currentPlaylist.name})`;
    currentPlaylist.tracks.forEach((track, idx) => {
        const li = createTrackLi(track, idx);
        trackList.appendChild(li);
    });
}

function updateAddTrackFormVisibility() {
    if (currentPlaylist) {
        addTrackForm.style.display = '';
        playerSection.style.display = '';
    } else {
        addTrackForm.style.display = 'none';
        playerSection.style.display = 'none';
    }
}

trackFileInput.addEventListener('change', () => {
    if (trackFileInput.files.length > 1) {
        trackNameInput.classList.add('hidden');
        trackNameInput.required = false;
    } else {
        trackNameInput.classList.remove('hidden');
        trackNameInput.required = true;
    }
});

addTrackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentPlaylist) {
        alert('Сначала выберите плейлист');
        return;
    }
    const files = trackFileInput.files;
    if (!files.length) return;
    if (files.length === 1) {
        const name = trackNameInput.value;
        const file = files[0];
        const url = URL.createObjectURL(file);
        currentPlaylist.tracks.push({ name, url });
    } else {
        for (let file of files) {
            const url = URL.createObjectURL(file);
            currentPlaylist.tracks.push({ name: file.name.replace(/\.[^/.]+$/, ''), url });
        }
    }
    updateTrackList();
    trackNameInput.value = '';
    trackFileInput.value = '';
    trackNameInput.classList.remove('hidden');
    trackNameInput.required = true;
});

addPlaylistForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('playlist-name').value;
    playlists.push({ name, tracks: [] });
    updatePlaylistList();
    document.getElementById('playlist-name').value = '';
});

function updatePlaylistList() {
    playlistList.innerHTML = '';
    playlists.forEach((playlist, index) => {
        const li = createPlaylistLi(playlist, index);
        playlistList.appendChild(li);
    });
    updateAddTrackFormVisibility();
}

function setActivePlaylist(activeLi) {
    const allLi = playlistList.querySelectorAll('li');
    allLi.forEach(li => li.classList.remove('active'));
    activeLi.classList.add('active');
}

function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
        e.preventDefault();
        playPauseButton.click();
    }
    if (e.code === 'ArrowRight') {
        nextButton.click();
    }
    if (e.code === 'ArrowLeft') {
        prevButton.click();
    }
});

function createTrackLi(track, idx) {
    const li = document.createElement('li');
    li.textContent = track.name;
    li.classList.add('track-item');
    // Кнопка удаления
    const delBtn = document.createElement('button');
    delBtn.className = 'button-delete';
    delBtn.title = 'Удалить трек';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = (ev) => {
        ev.stopPropagation();
        currentPlaylist.tracks.splice(idx, 1);
        updateTrackList();
    };
    // Кнопка редактирования
    const editBtn = document.createElement('button');
    editBtn.className = 'button-edit';
    editBtn.title = 'Переименовать трек';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = (ev) => {
        ev.stopPropagation();
        const newName = prompt('Новое название трека:', track.name);
        if (newName) {
            track.name = newName;
            updateTrackList();
        }
    };
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    li.addEventListener('click', () => {
        currentTrackIndex = idx;
        playTrack();
    });
    if (idx === currentTrackIndex) {
        li.classList.add('active');
    }
    return li;
}

function createPlaylistLi(playlist, index) {
    const li = document.createElement('li');
    li.textContent = playlist.name;
    // Кнопка удаления
    const delBtn = document.createElement('button');
    delBtn.className = 'button-delete';
    delBtn.title = 'Удалить плейлист';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = (ev) => {
        ev.stopPropagation();
        playlists.splice(index, 1);
        if (currentPlaylist === playlist) currentPlaylist = null;
        updatePlaylistList();
        updateTrackList();
    };
    // Кнопка редактирования
    const editBtn = document.createElement('button');
    editBtn.className = 'button-edit';
    editBtn.title = 'Переименовать плейлист';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = (ev) => {
        ev.stopPropagation();
        const newName = prompt('Новое название плейлиста:', playlist.name);
        if (newName) {
            playlist.name = newName;
            updatePlaylistList();
        }
    };
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    li.addEventListener('click', () => {
        currentPlaylist = playlist;
        currentTrackIndex = 0;
        updateTrackList();
        playTrack();
        setActivePlaylist(li);
    });
    if (playlist === currentPlaylist) {
        li.classList.add('active');
    }
    return li;
}

// Инициализация
updateAddTrackFormVisibility();
updatePlaylistList();
updateTrackList();