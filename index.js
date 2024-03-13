//import scdl from "scdl-api"
import { SoundCloud } from "scdl-core";
//import Spotify from 'spotifydl-core'
import SpotifyWebApi from 'spotify-web-api-node';

// credentials are optional
var spotifyApi = new SpotifyWebApi({ clientId: null, clientSecret: null});
spotifyApi.clientCredentialsGrant().then(
    function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    },
    function(err) {
        console.log('Something went wrong when retrieving an access token', err);
    }
);
await SoundCloud.connect();

import fs from "fs";
import express from "express";
import 'express-group-routes';
import ejs from 'ejs';

var app = express();
app.set('view engine', 'ejs');
app.set('views', './');

app.group(router => {
    router.get('/search/:query', async (req, res) => {
        const results = [];
        const SearchItemsModel = (...props) => {
            const list = {};
            [list.platform, list.tracks, list.title, list.id, list.cover, list.author, list.permalink_url] = props;
            return list;
        };
        /*const SpotifySearchResult = await spotifyApi.searchTracks(req.params.query);
        SpotifySearchResult.body.tracks.items.map(item => console.log(
            SearchItemsModel('Spotify', [], item.name, item.id)
        ));*/
        const SoundCloudSearchResult = await SoundCloud.search({query: req.params.query, filter: 'albums'});
        SoundCloudSearchResult.collection.map(async item => {
            //const permalink = item.permalink_url;
            //const playlist = await SoundCloud.playlists.getPlaylist(permalink);
            results.push(SearchItemsModel('SoundCloud', item.tracks, item.title, item.id, item.artwork_url, item.user.username, item.permalink_url));
        })
        res.render('search.ejs', { results, people: ['geddy', 'neil', 'alex'] });
    });

    router.get('/', async (req, res) => {
        res.render('index.ejs');
    });
    
    router.get('/album/:album', async (req, res) => {
        const [platformRaw, permalinkRaw] = atob(req.params.album).split('.')
        const [platform, permalink] = [atob(platformRaw), atob(permalinkRaw)];
        if (platform === "SoundCloud") {
            try {
                const playlist = await SoundCloud.playlists.getPlaylist(permalink);
                res.render('album.ejs', { result : { ...playlist, platform: "SoundCloud" } });
            } catch (error) {
                console.log(error);
            }
        }
    });


    router.get('/song/:song', async (req, res) => {
        const [platformRaw, permalinkRaw] = req.params.song.split('.')
        const [platform, permalink] = [atob(platformRaw), atob(permalinkRaw)];
        if (platform === "SoundCloud") {
            try {
                const stream = await SoundCloud.download(permalink);
                res.set({ "Content-Type": 'audio/mpeg' });
                stream.pipe(res);
            } catch (error) {
                console.log(error);
            }
        }
        console.log(permalink/* , await SoundCloud.tracks.getTrack(permalink) */);
    })
});

app.listen(3000, () => console.log("Server demarré"))

//const CLIENT_ID = "rVtnkH7kI646kRDwGSONEc7euMBMyJwv";
//SoundCloud.download("https://soundcloud.com/martingarrix/martin-garrix-feat-bonn-no-sleep").then(stream => stream.pipe(fs.createWriteStream("song.mp3")));