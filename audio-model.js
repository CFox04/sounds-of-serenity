// The audio model defines the Playlist and LoopableAudio object. //

// This class is based on loopify.js by veltman under the MIT license. https://github.com/veltman/loopify
class LoopableAudio {
    constructor(uri, name) {
        this.context = new (AudioContext || webkitAudioContext)(),
            this.request = new XMLHttpRequest();

        this.request.responseType = 'arraybuffer';
        this.request.open('GET', uri, true);

        // XHR failed
        this.request.onerror = function () {
            console.log(new Error("Couldn't load audio from " + uri));
        };

        // Store buffer
        this.buffer;

        // XHR complete
        let _this = this;
        this.request.onload = function () {
            _this.context.decodeAudioData(_this.request.response, function (buffer) { _this.buffer = buffer; }, function (err) {
                // Audio was bad
                console.log(new Error("Couldn't decode audio from " + uri));
            });
        };

        this.request.send();

        this.name = name;
        this.lastPosition = 0;
        this.startPosition = 0;
        this.loop;

        // Setup gain node for volume
        this.gainNode = this.context.createGain();
        this.setVolume(0.5);
        this.gainNode.connect(this.context.destination)
    }

    // Run callback once buffer has loaded
    ready(cb) {
        if (!this.buffer) {
            let _this = this;
            setTimeout(function () {
                _this.ready(cb);
            }, 100)
        }
        else if (this.buffer) {
            cb();
        }
    }

    setVolume(volume) {
        this.gainNode.gain.value = volume / 4;
    }

    getVolume() {
        return this.gainNode.gain.value * 4;
    }

    stop() {
        // Stop and clear if it's playing
        if (this.source) {
            this.lastPosition = this.context.currentTime;
            this.source.stop();
            this.source = null;
        }
    }

    play(position = this.lastPosition - this.startPosition) {
        if (this.buffer) {
            // Stop if it's already playing
            this.stop();

            // Create a new source (can't replay an existing source)
            this.source = this.context.createBufferSource();
            this.source.connect(this.gainNode);

            // Set the buffer
            this.source.buffer = this.buffer;
            this.source.loop = this.loop;

            // Play it
            this.source.start(0, position);
            this.startPosition = this.context.currentTime;
        }
        else {
            console.log("Cannot play audio. The audio has not loaded or loaded incorrectly.")
        }
    }
}

class Playlist {
    constructor(name, type, loop) {
        this.name = name || '';
        this.type = type || '';
        this.audio = [];
        this.loop = loop || true;

        this.playing = false;
        this.currentAudio;
        this.concurrent;
        this.volume = 50;

        // Sounds play concurrently 
        if (type == 'sounds') {
            this.concurrent = true;
        }
    }

    addAudio(audio) {
        this.audio.push(audio);
    }

    removeAudio(audioName) {
        let index = this.audio.indexOf(audioName)
        if (index != -1) {
            this.audio.splice(index, 1);
        }
        else {
            console.log('Failed to remove audio from playlist: Audio not found in playlist.');
        }
    }

    initLayerSliders(playlistName) {
        var i = 0;
        for (var audio of this.audio) {
            i++;
            let html = $('.slider-panel-column.left').append(`
                <div class="slider-container tooltip">
                    <img src="/static/assets/${this.name}.svg" alt=${this.name}>
                    <div class="slider layer-volume" data-audio="${audio.name}" data-audiotype="${this.type}" data-audioplaylist="${this.name}"></div>
                    <span class="tooltiptext">${formatName(audio.name)}</span>
                </div>
            `);
            $(html).find(`.slider.layer-volume[data-audio='${audio.name}']`).slider({
                range: "min",
                value: audio.getVolume() * 100,
                slide: function (event, ui) {
                    let volume = ui.value;

                    let soundsPlaylists = Playlist.findPlaylistByType(this.dataset.audiotype, playlists);
                    if (soundsPlaylists.length > 0) {
                        for (var playlist of soundsPlaylists) {
                            playlist.setVolume(volume, this.dataset.audio);
                        }
                    }
                }
            });
        }
    }

    removeLayerSliders() {
        let playlist = this;
        $('.slider.layer-volume').each(function () {
            if (this.dataset.audioplaylist == playlist.name) {
                $(this).parent().remove();
            }
        });
    }

    // Sets volume of specified audio or of entire playlist
    setVolume(volume, audioName) {
        for (var audio of this.audio) {
            if (audioName == this.type) {
                this.volume = volume;
                audio.setVolume(volume / 100);
            }
            else if (audioName == audio.name) {
                audio.setVolume(volume / 100);
            }
        }
    }

    play(index = 0) {
        let playlist = this;
        let audio = playlist.audio[index]
        if (audio) {
            // Initialize sliders for sounds
            if (this.type == 'sounds' && !this.playing) {
                this.initLayerSliders();
            }

            audio.loop = this.loop;
            audio.ready(function () {
                audio.play();
            });

            this.playing = true;

            // Play concurrently
            if (playlist.concurrent) {
                playlist.currentAudio = [playlist.currentAudio];
                playlist.play(index + 1);
            }
            // Play sequentially
            else {
                playlist.currentAudio = audio;
                $(audio).bind('ended', function () {
                    // If there is more audio to play on the playlist
                    if (playlist.audio[index + 1]) {
                        playlist.play(index + 1);
                    }
                    // If playlist is set to loop, restart the playlist
                    else if (index == playlist.audio.length - 1 && playlist.loop) {
                        playlist.play(0);
                    }
                });
            }
        }
    }

    resume() {
        let index = this.audio.indexOf(this.currentAudio);
        if (this.concurrent) {
            this.play(0);
        }
        else if (this.currentAudio && index != -1) {
            this.play(index);
        }
    }

    pause() {
        if (this.concurrent) {
            for (var audio of this.audio) {
                audio.stop();
            }
            this.playing = false;
            this.removeLayerSliders();
        }
        else {
            if (this.currentAudio) {
                this.currentAudio.stop();
                this.playing = false;
            }
        }
    }

    skipSong() {
        if (this.playing && this.currentAudio) {
            let index = this.audio.indexOf(this.currentAudio);
            if (index != -1 && (index + 1) < this.audio.length) {
                this.pause();
                this.play(index + 1);
            }
            else if (index + 1 >= this.audio.length) {
                this.pause();
                this.audio.shuffle();
                this.play(0)
            }
        }
    }

    // Load playlist from file structure
    static loadPlaylist(playlistName, type, fileStructure) {
        var playlist = new Playlist(playlistName, type);
        var fileNames = findFile(playlistName, fileStructure)[0];

        if (fileNames) {
            for (var audioFileName of fileNames) {
                // Ensure it is a supported audio file
                if (audioFileName.search(/.wav|.mp3/) != -1) {
                    let src = `/static/audio/${type}/${playlistName}/${audioFileName}`;
                    var audioObj = new LoopableAudio(src, audioFileName);
                    playlist.addAudio(audioObj);
                }
            }
        }
        else {
            console.log(new Error(`Playlist '${playlistName}' not found`));
        }

        if (type == 'music') {
            // Shuffle playlist
            playlist.audio.shuffle();
        }

        return playlist;
    }

    // Given an array of playlists, find a playlist by name and return it
    static findPlaylist(name, playlists) {
        for (var playlist of playlists) {
            if (playlist.name == name) {
                return playlist;
            }
        }
        return false;
    }

    // Given an array of playlists, find all playlists with a given type and return them
    static findPlaylistByType(type, playlistsArray) {
        var newPlaylistsArray = [];
        for (var playlist of playlistsArray) {
            if (playlist.type == type) {
                newPlaylistsArray.push(playlist);
            }
        }
        return newPlaylistsArray;
    }
}