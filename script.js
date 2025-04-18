const audio = document.getElementById('audio');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const playlistList = document.getElementById('playlist-list');
const trackList = document.getElementById('track-list');
const addPlaylistForm = document.getElementById('add-playlist-form');
const addTrackForm = document.getElementById('add-track-form');
const progressBar = document.getElementById('progress-bar');
const tracksHeader = document.getElementById('tracks-header');

let playlists = [];
let currentPlaylist = null;
let currentTrackIndex = 0;

addPlaylistForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('playlist-name').value;
    playlists.push({ name, tracks: [] });
    updatePlaylistList();
    document.getElementById('playlist-name').value = '';
});

addTrackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentPlaylist) {
        alert('Сначала выберите плейлист');
        return;
    }
    const name = document.getElementById('track-name').value;
    const file = document.getElementById('track-file').files[0];
    const url = URL.createObjectURL(file);
    currentPlaylist.tracks.push({ name, url });
    updateTrackList();
    document.getElementById('track-name').value = '';
    document.getElementById('track-file').value = '';
});

function updatePlaylistList() {
    playlistList.innerHTML = '';
    playlists.forEach((playlist, index) => {
        const li = document.createElement('li');
        li.textContent = playlist.name;
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
        playlistList.appendChild(li);
    });
}

function setActivePlaylist(activeLi) {
    const allLi = playlistList.querySelectorAll('li');
    allLi.forEach(li => li.classList.remove('active'));
    activeLi.classList.add('active');
}

function updateTrackList() {
    trackList.innerHTML = '';
    if (currentPlaylist) {
        tracksHeader.textContent = `Треки в ${currentPlaylist.name}`;
        currentPlaylist.tracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.textContent = track.name;
            li.addEventListener('click', () => {
                currentTrackIndex = index;
                playTrack();
                setActiveTrack(li);
            });
            if (index === currentTrackIndex) {
                li.classList.add('active');
            }
            trackList.appendChild(li);
        });
    } else {
        tracksHeader.textContent = 'Треки (выберите плейлист)';
    }
}

function setActiveTrack(activeLi) {
    const allLi = trackList.querySelectorAll('li');
    allLi.forEach(li => li.classList.remove('active'));
    activeLi.classList.add('active');
}

function playTrack() {
    if (currentPlaylist && currentPlaylist.tracks.length > 0) {
        const track = currentPlaylist.tracks[currentTrackIndex];
        audio.src = track.url;
        audio.play();
        document.getElementById('now-playing').textContent = `Сейчас играет: ${track.name}`;
    } else {
        document.getElementById('now-playing').textContent = '';
    }
}

playButton.addEventListener('click', () => {
    audio.play();
});

pauseButton.addEventListener('click', () => {
    audio.pause();
});

nextButton.addEventListener('click', () => {
    if (currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1) {
        currentTrackIndex++;
        playTrack();
        updateTrackList();
    }
});

prevButton.addEventListener('click', () => {
    if (currentPlaylist && currentTrackIndex > 0) {
        currentTrackIndex--;
        playTrack();
        updateTrackList();
    }
});

audio.addEventListener('timeupdate', () => {
    const percentage = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = percentage + '%';
});

audio.addEventListener('ended', () => {
    if (currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1) {
        currentTrackIndex++;
        playTrack();
        updateTrackList();
    }
});

updateTrackList();