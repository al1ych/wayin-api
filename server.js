const port = process.env.PORT || 3000;
const express = require("express");
// const fs = require('fs');
const app = express();
const path = require('path');
// const jsonParser = express.json();
app.use(express.urlencoded({extended: true, limit: '128mb'}));
app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));

const alg = require('./algos');
const map2graph_worker = require('./map2graph_worker');
const geocoder = require('./geocoder');


// API INTERACTION INTERFACE

/***
 * maps geom maps -> graph maps
 *
 * params:
 * - map (geom)
 *
 * returns distance from start to target (to every vertex if no target is provided)
 * */
const asyncMiddleware = fn =>
    (req, res, next) =>
    {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

const {Worker, isMainThread, parentPort, workerData} = require('worker_threads');
const ADMIN_TOKEN = "tokuak0Uoghohpha6eiSohr7gaifeith4eToe0coongeC9pai3thaV3sheDaech2utoodae9eeng8iasheiqu2eag8einiu5ou7xae7xeequooPheim5JoL9vo5BieiCoon3ohZazos1Ahl3zoothee7mie1aefepud3nie5Fa3DeeNoh6ahgh2ienakaeShi4Oohahkaingohtael9ohM4gah3haehaefaithaikahgoh6loogh3zaNephoocho3vai6poo5oomaengiemoo4shu8ujoo5gin9ooyauzeer9boh4shuoh2Iejukoht0sheiCheevahThai6fahQuash6eeV6aeshai4woaNgaxo7ooh8bah3iwidienae8ieLutaiquu6ath7ohg1Gohfaem0ohvaixiechohjuhahtieit6Cughoo4seX1xofi9deesaezahca9ahn1yah2zeXu6vaib4nosh9Eeb0quiChu6Cei0ih3hoze1aiheedi1oozoigh9rahKaePhain7wae1aeboozechah2oohgakeenoobeadi7cheeghiexe8ohDaera9Vaephiex6AichoiRohchee8aiHeequaeth5Aevei5ohyoz1Tien4thaiv4boh5veim6theepoashiethu2Ahl3AHa8ha9eeRe1ix8ki7izu9xeethooS8aeh3pha6IeQuooth4aec1aqu6xeish6Soosoo4haehai7ke1paeSie3tohveFaideeKeloh1Chohdai0Oyeiche1jahyoophooceLaeNg6so6nahp3wizeeThaiKeoVee4shiwi8esh2ahm6heDahsoLavai0mohtheiyoh6queexaenguic0thieVoh0quaitheen1uthohphooF5xingOogh6quu5theesai1shahquaix7eeshee9resh5elion6eezi0eChonai7oijpahsii5aw3eepe9johbaiYon8zaequiechoh0theitigi0logh3eeceeween3wee0xeo8Aenoofoh1aiSael4ahnoh4quaithejeicai0ooph1oovahc2Quaiteakou9quubeivee4reeph4ogeikahgai8phah9teip1Ti3Jaxeefie0ooyohlphe3aiboo7goochaiKeePheekeosheiruvieg6Ahpaij4ohw6nuu9iera1huz";
app.post('/map2graph', async (req, res) =>
{
    let params = req.body;

    if (params.access_token !== ADMIN_TOKEN)
    {
        console.log('wrong token attempt', params.token);
        return res.end("WRONG ACCESS TOKEN");
    }
    console.log('token accepted');

    console.log('/map2graph params');

    // long-polling
    let refresh_interval = setInterval(() => {
        res.write(' ');
        console.log('refreshed connection (15s)');
    }, 15 * 1000);

    let alg_res;
    const worker = new Worker('./map2graph_worker.js', {workerData: params.map});

    return res.end(await new Promise((resolve, reject) => {
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', _ => {
            clearInterval(refresh_interval);
        });
    }));
});


/***
 * finds path from start to target
 *
 * params:
 * - graph
 * - start
 * - target (optional)
 *
 * returns distance from start to target (to every vertex if no target is provided)
 * */
app.post('/path_ab', async function (req, res)
{
    let params = req.body;
    console.log('/path_ab params', params.provide_geocoding, typeof params.provide_geocoding);
    if (params.graph === undefined || params.start === undefined)
    {
        return res.send("error: wrong format. refer to /doc for more info.");
    }
    let start_tag = params.start;
    let target_tag = params.target;
    let map_name = params.map_name;
    params.graph = JSON.parse(params.graph);
    console.log({map_name});
    if (params.provide_geocoding == true) //!!! == and not === !!!
    {
        console.log('!!! provide_geocoding: ', params.provide_geocoding);
        // => name2tag
        let geocode = geocoder.name2tag(map_name, [start_tag, target_tag]);
        console.log('geocode before: name2tag: ', [start_tag, target_tag]);
        start_tag = geocode[0];
        target_tag = geocode[1];
        console.log('geocode after: name2tag: ', [start_tag, target_tag]);
    }
    let alg_res = alg.dijkstra(params.graph, start_tag, target_tag);
    // let alg_res = alg.dijkstra(alg.test_graph, params.start, params.target);
    return res.send(alg_res);
});


/***
 * provides the user with basic info about the api and stuff
 * */
app.get('/doc', function (req, res)
{
    return res.send("Hello! To get info on how to use the API text me on TG: @aladdinych");
});

/***
 * to test get requests
 * */
app.get('/test', function (req, res)
{
    let tmp = {
        "field1": 123, "field2": "hello"
    };
    return res.send(tmp);
});

/***
 * provides the user with info about the project
 * */
app.get("/about", function (req, res)
{
    res.sendFile(__dirname + "/public/about.html");
});


// SERVER START

let server = app.listen(port, () =>
{
    console.log("Server started...");
});