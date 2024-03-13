(function() {
    game.playlists.filter(p => p.playing).forEach(p => p.playNext());
})()
