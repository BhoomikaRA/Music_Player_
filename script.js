 class MusicPlayer {
            constructor() {
                this.audioPlayer = document.getElementById('audioPlayer');
                this.playPauseBtn = document.getElementById('playPauseBtn');
                this.prevBtn = document.getElementById('prevBtn');
                this.nextBtn = document.getElementById('nextBtn');
                this.shuffleBtn = document.getElementById('shuffleBtn');
                this.repeatBtn = document.getElementById('repeatBtn');
                this.progressBar = document.getElementById('progressBar');
                this.progress = document.getElementById('progress');
                this.volumeSlider = document.getElementById('volumeSlider');
                this.playlist = document.getElementById('playlist');
                this.addSongBtn = document.getElementById('addSongBtn');
                this.deleteAllBtn = document.getElementById('deleteAllBtn');
                this.restoreBtn = document.getElementById('restoreBtn');
                this.uploadArea = document.getElementById('uploadArea');
                this.fileInput = document.getElementById('fileInput');
                this.visualizer = document.getElementById('visualizer');
                this.albumArtContainer = document.getElementById('albumArtContainer');
                this.songCount = document.getElementById('songCount');
                this.toast = document.getElementById('toast');
                this.storageUsed = document.getElementById('storageUsed');
                this.storageText = document.getElementById('storageText');
                
                // Restore modal elements
                this.restoreModal = document.getElementById('restoreModal');
                this.closeModal = document.getElementById('closeModal');
                this.restoreList = document.getElementById('restoreList');
                this.restoreAllBtn = document.getElementById('restoreAllBtn');
                
                this.songTitle = document.getElementById('songTitle');
                this.songArtist = document.getElementById('songArtist');
                this.songAlbum = document.getElementById('songAlbum');
                this.albumArt = document.getElementById('albumArt');
                this.currentTime = document.getElementById('currentTime');
                this.duration = document.getElementById('duration');
                
                this.songs = [];
                this.deletedSongs = [];
                this.currentSongIndex = 0;
                this.isPlaying = false;
                this.isShuffled = false;
                this.isRepeating = false;
                this.currentSort = 'custom';
                this.visualizerBars = this.visualizer.querySelectorAll('.bar');
                this.draggedItem = null;
                
                this.initializeEventListeners();
                this.loadSongsFromStorage();
                this.startVisualizer();
                this.updateStorageInfo();
            }
            
            initializeEventListeners() {
                // Play/Pause button
                this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
                
                // Previous and Next buttons
                this.prevBtn.addEventListener('click', () => this.previousSong());
                this.nextBtn.addEventListener('click', () => this.nextSong());
                
                // Shuffle and Repeat buttons
                this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
                this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
                
                // Progress bar click
                this.progressBar.addEventListener('click', (e) => this.setProgress(e));
                
                // Volume control
                this.volumeSlider.addEventListener('input', () => this.setVolume());
                
                // Add song button
                this.addSongBtn.addEventListener('click', () => this.fileInput.click());
                this.fileInput.addEventListener('change', (e) => this.addSongs(e.target.files));
                
                // Delete and Restore buttons
                this.deleteAllBtn.addEventListener('click', () => this.deleteAllSongs());
                this.restoreBtn.addEventListener('click', () => this.showRestoreModal());
                
                // Restore modal events
                this.closeModal.addEventListener('click', () => this.hideRestoreModal());
                this.restoreAllBtn.addEventListener('click', () => this.restoreAllSongs());
                
                // Close modal when clicking outside
                this.restoreModal.addEventListener('click', (e) => {
                    if (e.target === this.restoreModal) {
                        this.hideRestoreModal();
                    }
                });
                
                // Upload area
                this.uploadArea.addEventListener('click', () => this.fileInput.click());
                this.uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    this.uploadArea.style.background = 'rgba(108, 92, 231, 0.2)';
                });
                this.uploadArea.addEventListener('dragleave', () => {
                    this.uploadArea.style.background = 'rgba(108, 92, 231, 0.05)';
                });
                this.uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    this.uploadArea.style.background = 'rgba(108, 92, 231, 0.05)';
                    this.addSongs(e.dataTransfer.files);
                });
                
                // Sort buttons
                document.querySelectorAll('.sort-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const sortType = e.target.dataset.sort;
                        this.changeSort(sortType);
                    });
                });
                
                // Audio events
                this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
                this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
                this.audioPlayer.addEventListener('ended', () => this.songEnded());
                
                // Keyboard controls
                document.addEventListener('keydown', (e) => this.handleKeyboard(e));
            }
            
            loadSongsFromStorage() {
                const storedSongs = localStorage.getItem('musicPlayerSongs');
                const storedDeletedSongs = localStorage.getItem('musicPlayerDeletedSongs');
                
                if (storedSongs) {
                    try {
                        this.songs = JSON.parse(storedSongs);
                        if (this.songs.length > 0) {
                            this.loadSong(0);
                        }
                        this.renderPlaylist();
                        this.updateSongCount();
                        this.showToast("Playlist loaded from storage");
                    } catch (e) {
                        console.error("Error loading songs from storage:", e);
                        this.songs = [];
                    }
                } else {
                    this.loadDefaultPlaylist();
                }
                
                if (storedDeletedSongs) {
                    try {
                        this.deletedSongs = JSON.parse(storedDeletedSongs);
                        // Filter out songs that have been deleted for more than 30 days
                        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                        this.deletedSongs = this.deletedSongs.filter(song => song.deletedAt > thirtyDaysAgo);
                        this.saveDeletedSongsToStorage();
                    } catch (e) {
                        console.error("Error loading deleted songs from storage:", e);
                        this.deletedSongs = [];
                    }
                }
            }
            
            saveSongsToStorage() {
                try {
                    // Convert blob URLs to a storable format if needed
                    const songsToSave = this.songs.map(song => {
                        // If it's a blob URL, we can't save it directly
                        // In a real app, you'd need to store the actual file data
                        // For this demo, we'll just save the metadata for blob URLs
                        if (song.src.startsWith('blob:')) {
                            return {
                                ...song,
                                src: '', // Can't save blob URLs
                                isUploaded: true
                            };
                        }
                        return song;
                    });
                    
                    localStorage.setItem('musicPlayerSongs', JSON.stringify(songsToSave));
                    this.updateStorageInfo();
                } catch (e) {
                    console.error("Error saving songs to storage:", e);
                    this.showToast("Error saving playlist", "error");
                }
            }
            
            saveDeletedSongsToStorage() {
                try {
                    localStorage.setItem('musicPlayerDeletedSongs', JSON.stringify(this.deletedSongs));
                } catch (e) {
                    console.error("Error saving deleted songs to storage:", e);
                }
            }
            
            updateStorageInfo() {
                try {
                    const storedSongs = localStorage.getItem('musicPlayerSongs');
                    const storedDeletedSongs = localStorage.getItem('musicPlayerDeletedSongs');
                    
                    let totalSize = 0;
                    if (storedSongs) totalSize += new Blob([storedSongs]).size;
                    if (storedDeletedSongs) totalSize += new Blob([storedDeletedSongs]).size;
                    
                    const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
                    const percentage = Math.min(100, (totalSize / maxSize) * 100);
                    
                    this.storageUsed.style.width = `${percentage}%`;
                    this.storageText.textContent = `${Math.round(percentage)}% used`;
                    
                    if (percentage > 80) {
                        this.storageUsed.style.background = 'var(--danger)';
                    } else if (percentage > 60) {
                        this.storageUsed.style.background = 'var(--warning)';
                    } else {
                        this.storageUsed.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                    }
                } catch (e) {
                    console.error("Error calculating storage info:", e);
                }
            }
            
            loadDefaultPlaylist() {
                // Default playlist with sample songs
                this.songs = [
                    {
                        id: this.generateId(),
                        title: "Blinding Lights",
                        artist: "The Weeknd",
                        album: "After Hours",
                        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                        cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                        uploadOrder: 1
                    },
                    {
                        id: this.generateId(),
                        title: "Save Your Tears",
                        artist: "The Weeknd",
                        album: "After Hours",
                        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                        cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                        uploadOrder: 2
                    },
                    {
                        id: this.generateId(),
                        title: "Levitating",
                        artist: "Dua Lipa",
                        album: "Future Nostalgia",
                        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                        cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                        uploadOrder: 3
                    }
                ];
                
                this.saveSongsToStorage();
                this.renderPlaylist();
                if (this.songs.length > 0) {
                    this.loadSong(0);
                }
            }
            
            generateId() {
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            }
            
            changeSort(sortType) {
                this.currentSort = sortType;
                
                // Update active button
                document.querySelectorAll('.sort-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.sort === sortType);
                });
                
                // Sort songs based on selected type
                switch(sortType) {
                    case 'title':
                        this.songs.sort((a, b) => a.title.localeCompare(b.title));
                        break;
                    case 'artist':
                        this.songs.sort((a, b) => a.artist.localeCompare(b.artist));
                        break;
                    case 'upload':
                        this.songs.sort((a, b) => a.uploadOrder - b.uploadOrder);
                        break;
                    case 'custom':
                        // Custom order is the order in the array, no sorting needed
                        break;
                }
                
                // Update current song index after sorting
                if (this.songs.length > 0 && this.currentSongIndex >= 0) {
                    const currentSong = this.songs[this.currentSongIndex];
                    this.currentSongIndex = this.songs.findIndex(song => song.id === currentSong.id);
                }
                
                this.renderPlaylist();
                this.saveSongsToStorage();
                this.showToast(`Sorted by ${this.getSortName(sortType)}`);
            }
            
            getSortName(sortType) {
                switch(sortType) {
                    case 'title': return 'Title (A-Z)';
                    case 'artist': return 'Artist';
                    case 'upload': return 'Upload Order';
                    case 'custom': return 'Custom Order';
                    default: return 'Custom Order';
                }
            }
            
            renderPlaylist() {
                this.playlist.innerHTML = '';
                
                if (this.songs.length === 0) {
                    this.playlist.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-music"></i>
                            <p>No songs in playlist</p>
                            <p>Add some songs to get started!</p>
                        </div>
                    `;
                    return;
                }
                
                this.songs.forEach((song, index) => {
                    const playlistItem = document.createElement('div');
                    playlistItem.className = `playlist-item ${index === this.currentSongIndex ? 'active' : ''}`;
                    playlistItem.draggable = this.currentSort === 'custom';
                    playlistItem.dataset.index = index;
                    playlistItem.innerHTML = `
                        <div class="playlist-item-info">
                            <div class="playlist-item-title">${song.title}</div>
                            <div class="playlist-item-artist">${song.artist} • ${song.album}</div>
                        </div>
                        <div class="playlist-item-actions">
                            ${this.currentSort === 'custom' ? `
                                <button class="item-btn move" title="Drag to reorder">
                                    <i class="fas fa-grip-vertical"></i>
                                </button>
                            ` : ''}
                            <button class="item-btn delete" title="Delete song">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    // Song selection
                    playlistItem.addEventListener('click', (e) => {
                        if (!e.target.closest('.playlist-item-actions')) {
                            this.loadSong(index);
                        }
                    });
                    
                    // Delete button
                    const deleteBtn = playlistItem.querySelector('.item-btn.delete');
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteSong(index);
                    });
                    
                    // Drag and drop for reordering
                    if (this.currentSort === 'custom') {
                        playlistItem.addEventListener('dragstart', (e) => {
                            this.draggedItem = playlistItem;
                            setTimeout(() => {
                                playlistItem.style.opacity = '0.4';
                            }, 0);
                        });
                        
                        playlistItem.addEventListener('dragend', () => {
                            this.draggedItem = null;
                            setTimeout(() => {
                                playlistItem.style.opacity = '1';
                            }, 0);
                        });
                        
                        playlistItem.addEventListener('dragover', (e) => {
                            e.preventDefault();
                        });
                        
                        playlistItem.addEventListener('dragenter', (e) => {
                            e.preventDefault();
                            playlistItem.style.background = '#e3f2fd';
                        });
                        
                        playlistItem.addEventListener('dragleave', () => {
                            playlistItem.style.background = '';
                        });
                        
                        playlistItem.addEventListener('drop', (e) => {
                            e.preventDefault();
                            playlistItem.style.background = '';
                            
                            if (this.draggedItem && this.draggedItem !== playlistItem) {
                                const fromIndex = parseInt(this.draggedItem.dataset.index);
                                const toIndex = parseInt(playlistItem.dataset.index);
                                
                                // Reorder songs array
                                const [movedSong] = this.songs.splice(fromIndex, 1);
                                this.songs.splice(toIndex, 0, movedSong);
                                
                                // Update current song index if needed
                                if (this.currentSongIndex === fromIndex) {
                                    this.currentSongIndex = toIndex;
                                } else if (this.currentSongIndex > fromIndex && this.currentSongIndex <= toIndex) {
                                    this.currentSongIndex--;
                                } else if (this.currentSongIndex < fromIndex && this.currentSongIndex >= toIndex) {
                                    this.currentSongIndex++;
                                }
                                
                                this.renderPlaylist();
                                this.saveSongsToStorage();
                                this.showToast("Playlist order updated");
                            }
                        });
                    }
                    
                    this.playlist.appendChild(playlistItem);
                });
            }
            
            showRestoreModal() {
                this.renderRestoreList();
                this.restoreModal.classList.add('active');
            }
            
            hideRestoreModal() {
                this.restoreModal.classList.remove('active');
            }
            
            renderRestoreList() {
                this.restoreList.innerHTML = '';
                
                if (this.deletedSongs.length === 0) {
                    this.restoreList.innerHTML = `
                        <div class="empty-restore">
                            <i class="fas fa-inbox"></i>
                            <p>No deleted songs to restore</p>
                            <p>Deleted songs will appear here for 30 days</p>
                        </div>
                    `;
                    return;
                }
                
                this.deletedSongs.forEach((song, index) => {
                    const restoreItem = document.createElement('div');
                    restoreItem.className = 'restore-item';
                    restoreItem.innerHTML = `
                        <div class="restore-item-info">
                            <div class="restore-item-title">${song.title}</div>
                            <div class="restore-item-artist">${song.artist} • ${song.album}</div>
                            <div class="restore-item-date">Deleted: ${new Date(song.deletedAt).toLocaleDateString()}</div>
                        </div>
                        <div class="restore-item-actions">
                            <button class="restore-btn" data-index="${index}">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                        </div>
                    `;
                    
                    const restoreButton = restoreItem.querySelector('.restore-btn');
                    restoreButton.addEventListener('click', (e) => {
                        const songIndex = parseInt(e.target.closest('.restore-btn').dataset.index);
                        this.restoreSong(songIndex);
                    });
                    
                    this.restoreList.appendChild(restoreItem);
                });
            }
            
            restoreSong(index) {
                if (index < 0 || index >= this.deletedSongs.length) return;
                
                const songToRestore = this.deletedSongs[index];
                
                // Remove from deleted songs
                this.deletedSongs.splice(index, 1);
                this.saveDeletedSongsToStorage();
                
                // Add back to main playlist
                this.songs.push(songToRestore);
                this.saveSongsToStorage();
                this.renderPlaylist();
                this.updateSongCount();
                
                // Update restore list
                this.renderRestoreList();
                
                this.showToast(`"${songToRestore.title}" restored to playlist`);
                
                // If this was the last deleted song, close the modal
                if (this.deletedSongs.length === 0) {
                    this.hideRestoreModal();
                }
            }
            
            restoreAllSongs() {
                if (this.deletedSongs.length === 0) {
                    this.showToast("No songs to restore", "error");
                    return;
                }
                
                // Add all deleted songs back to main playlist
                this.songs = [...this.songs, ...this.deletedSongs];
                this.deletedSongs = [];
                
                this.saveSongsToStorage();
                this.saveDeletedSongsToStorage();
                this.renderPlaylist();
                this.updateSongCount();
                this.renderRestoreList();
                this.hideRestoreModal();
                
                this.showToast("All songs restored to playlist");
            }
            
            addSongs(files) {
                if (files.length === 0) return;
                
                let addedCount = 0;
                const maxUploadOrder = Math.max(...this.songs.map(s => s.uploadOrder), 0);
                
                Array.from(files).forEach((file, index) => {
                    if (file.type.startsWith('audio/')) {
                        const url = URL.createObjectURL(file);
                        const song = {
                            id: this.generateId(),
                            title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
                            artist: "Unknown Artist",
                            album: "Unknown Album",
                            src: url,
                            cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                            uploadOrder: maxUploadOrder + index + 1,
                            isUploaded: true
                        };
                        
                        this.songs.push(song);
                        addedCount++;
                    }
                });
                
                this.renderPlaylist();
                this.updateSongCount();
                this.saveSongsToStorage();
                this.fileInput.value = ''; // Reset file input
                
                if (addedCount > 0) {
                    this.showToast(`Added ${addedCount} song(s) to playlist`);
                }
            }
            
            deleteSong(index) {
                // Stop event propagation to prevent loading the song when removing
                event.stopPropagation();
                
                const deletedSong = this.songs[index];
                
                // Add deletion timestamp
                deletedSong.deletedAt = Date.now();
                
                // Move to deleted songs
                this.deletedSongs.push(deletedSong);
                this.saveDeletedSongsToStorage();
                
                if (deletedSong.src.startsWith('blob:')) {
                    URL.revokeObjectURL(deletedSong.src);
                }
                
                this.songs.splice(index, 1);
                
                if (index === this.currentSongIndex) {
                    if (this.songs.length === 0) {
                        // No songs left
                        this.audioPlayer.src = '';
                        this.songTitle.textContent = "No Song";
                        this.songArtist.textContent = "";
                        this.songAlbum.textContent = "";
                        this.isPlaying = false;
                        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                        this.albumArtContainer.classList.remove('playing');
                        this.currentSongIndex = 0;
                    } else if (this.currentSongIndex >= this.songs.length) {
                        this.currentSongIndex = this.songs.length - 1;
                        this.loadSong(this.currentSongIndex);
                    } else {
                        this.loadSong(this.currentSongIndex);
                    }
                } else if (index < this.currentSongIndex) {
                    this.currentSongIndex--;
                }
                
                this.renderPlaylist();
                this.updateSongCount();
                this.saveSongsToStorage();
                this.showToast("Song moved to recently deleted");
            }
            
            deleteAllSongs() {
                if (this.songs.length === 0) {
                    this.showToast("Playlist is already empty", "error");
                    return;
                }
                
                // Add deletion timestamp to all songs and move to deleted songs
                const now = Date.now();
                this.songs.forEach(song => {
                    song.deletedAt = now;
                    if (song.src.startsWith('blob:')) {
                        URL.revokeObjectURL(song.src);
                    }
                });
                
                this.deletedSongs = [...this.deletedSongs, ...this.songs];
                this.songs = [];
                this.currentSongIndex = 0;
                
                this.audioPlayer.src = '';
                this.songTitle.textContent = "No Song";
                this.songArtist.textContent = "";
                this.songAlbum.textContent = "";
                this.isPlaying = false;
                this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                this.albumArtContainer.classList.remove('playing');
                
                this.renderPlaylist();
                this.updateSongCount();
                this.saveSongsToStorage();
                this.saveDeletedSongsToStorage();
                this.showToast("All songs moved to recently deleted");
            }
            
            updateSongCount() {
                const count = this.songs.length;
                this.songCount.textContent = `${count} song${count !== 1 ? 's' : ''} in playlist`;
            }
            
            showToast(message, type = "success") {
                this.toast.textContent = message;
                this.toast.className = "toast";
                
                if (type === "error") {
                    this.toast.style.background = "var(--danger)";
                } else {
                    this.toast.style.background = "var(--dark)";
                }
                
                this.toast.classList.add("show");
                
                setTimeout(() => {
                    this.toast.classList.remove("show");
                }, 3000);
            }
            
            loadSong(index) {
                if (index < 0 || index >= this.songs.length) return;
                
                this.currentSongIndex = index;
                const song = this.songs[index];
                
                this.audioPlayer.src = song.src;
                this.songTitle.textContent = song.title;
                this.songArtist.textContent = song.artist;
                this.songAlbum.textContent = song.album;
                this.albumArt.src = song.cover;
                
                this.renderPlaylist();
                
                if (this.isPlaying) {
                    this.audioPlayer.play().catch(error => {
                        console.error('Error playing audio:', error);
                    });
                }
            }
            
            togglePlayPause() {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            }
            
            play() {
                if (this.songs.length === 0) {
                    this.showToast("No songs in playlist", "error");
                    return;
                }
                
                this.audioPlayer.play().then(() => {
                    this.isPlaying = true;
                    this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    this.albumArtContainer.classList.add('playing');
                    this.showToast("Now playing: " + this.songs[this.currentSongIndex].title);
                }).catch(error => {
                    console.error('Error playing audio:', error);
                    this.showToast("Error playing song", "error");
                });
            }
            
            pause() {
                this.audioPlayer.pause();
                this.isPlaying = false;
                this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                this.albumArtContainer.classList.remove('playing');
            }
            
            previousSong() {
                let newIndex = this.currentSongIndex - 1;
                if (newIndex < 0) {
                    newIndex = this.songs.length - 1;
                }
                this.loadSong(newIndex);
                if (this.isPlaying) {
                    this.play();
                }
            }
            
            nextSong() {
                let newIndex;
                
                if (this.isShuffled) {
                    // Get a random index that's not the current one
                    do {
                        newIndex = Math.floor(Math.random() * this.songs.length);
                    } while (newIndex === this.currentSongIndex && this.songs.length > 1);
                } else {
                    newIndex = this.currentSongIndex + 1;
                    if (newIndex >= this.songs.length) {
                        newIndex = 0;
                    }
                }
                
                this.loadSong(newIndex);
                if (this.isPlaying) {
                    this.play();
                }
            }
            
            songEnded() {
                if (this.isRepeating) {
                    this.audioPlayer.currentTime = 0;
                    this.audioPlayer.play();
                } else {
                    this.nextSong();
                }
            }
            
            toggleShuffle() {
                this.isShuffled = !this.isShuffled;
                this.shuffleBtn.style.background = this.isShuffled 
                    ? 'linear-gradient(135deg, var(--secondary), #e84393)' 
                    : 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
                
                this.showToast(this.isShuffled ? "Shuffle enabled" : "Shuffle disabled");
            }
            
            toggleRepeat() {
                this.isRepeating = !this.isRepeating;
                this.repeatBtn.style.background = this.isRepeating 
                    ? 'linear-gradient(135deg, var(--secondary), #e84393)' 
                    : 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
                
                this.showToast(this.isRepeating ? "Repeat enabled" : "Repeat disabled");
            }
            
            setProgress(e) {
                const progressBar = e.currentTarget;
                const clickX = e.offsetX;
                const width = progressBar.offsetWidth;
                const duration = this.audioPlayer.duration;
                
                this.audioPlayer.currentTime = (clickX / width) * duration;
            }
            
            updateProgress() {
                const current = this.audioPlayer.currentTime;
                const duration = this.audioPlayer.duration;
                
                if (duration) {
                    const progressPercent = (current / duration) * 100;
                    this.progress.style.width = `${progressPercent}%`;
                    
                    this.currentTime.textContent = this.formatTime(current);
                }
            }
            
            updateDuration() {
                this.duration.textContent = this.formatTime(this.audioPlayer.duration);
            }
            
            setVolume() {
                this.audioPlayer.volume = this.volumeSlider.value / 100;
            }
            
            formatTime(seconds) {
                if (isNaN(seconds)) return '0:00';
                
                const minutes = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${minutes}:${secs.toString().padStart(2, '0')}`;
            }
            
            handleKeyboard(e) {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        this.togglePlayPause();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.audioPlayer.currentTime = Math.max(0, this.audioPlayer.currentTime - 10);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.audioPlayer.currentTime = Math.min(this.audioPlayer.duration, this.audioPlayer.currentTime + 10);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.volumeSlider.value = Math.min(100, parseInt(this.volumeSlider.value) + 10);
                        this.setVolume();
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.volumeSlider.value = Math.max(0, parseInt(this.volumeSlider.value) - 10);
                        this.setVolume();
                        break;
                    case 'KeyN':
                        e.preventDefault();
                        this.nextSong();
                        break;
                    case 'KeyP':
                        e.preventDefault();
                        this.previousSong();
                        break;
                    case 'KeyS':
                        e.preventDefault();
                        this.toggleShuffle();
                        break;
                    case 'KeyR':
                        e.preventDefault();
                        this.toggleRepeat();
                        break;
                }
            }
            
            startVisualizer() {
                // Create a simple visualizer effect
                setInterval(() => {
                    if (!this.isPlaying) {
                        this.visualizerBars.forEach(bar => {
                            bar.style.height = '10px';
                        });
                        return;
                    }
                    
                    this.visualizerBars.forEach(bar => {
                        const randomHeight = Math.floor(Math.random() * 50) + 5;
                        bar.style.height = `${randomHeight}px`;
                    });
                }, 150);
            }
        }

        // Initialize the music player when the page loads
        const musicPlayer = new MusicPlayer();