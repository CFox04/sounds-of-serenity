/* 
    MIT License
    Copyright (c) 2020 Colton Fox

    Handles events and interacts with the audio model.
*/

let defaultVolume = 50;
var musicVolume = defaultVolume;
var soundVolume = defaultVolume;

// Default slider options
$(".slider").slider({
    range: "min",
    value: defaultVolume
});

var playlists = [];

// Sound button icons
$('.sound-button').click(function () {
    cycleImage(this);
    let playlistName = this.dataset.audioplaylist;
    var playlist = Playlist.findPlaylist(playlistName, playlists);
    if (playlist) {
        if (playlist.playing) {
            playlist.pause();
        }
        else {
            playlist.resume();
        }
    }
    else {
        var type;
        var volume;
        var loop;
        // If button is on the right column (music)
        if ($(this).parent().hasClass('music')) {
            type = 'music';
            volume = musicVolume;
            loop = false;
        }
        // If button is on the left column (sounds)
        else if ($(this).parent().hasClass('sounds')) {
            type = 'sounds';
            volume = soundVolume;
            loop = true;
        }
        playlist = Playlist.loadPlaylist(playlistName, type, audioNames, false);
        playlist.play();
        playlists.push(playlist);
    }
});

// Adjust volume according to volume sliders
$('.slider.volume').slider({
    slide: function (event, ui) {
        let volume = ui.value;
        let type = this.dataset.audiotype
        musicVolume = volume;

        let soundsPlaylists = Playlist.findPlaylistByType(type, playlists);
        if (soundsPlaylists.length > 0) {
            for (var playlist of soundsPlaylists) {
                playlist.setVolume(volume, type);
            }
        }
    }
});

// Skip button
$('#skip').click(function(){
    let soundsPlaylists = Playlist.findPlaylistByType('music', playlists);

    if (soundsPlaylists.length > 0) {
        for (var playlist of soundsPlaylists) {
            if (playlist.playing) {
                playlist.skipSong();
            }
        }
    }
});