const port = process.env.PORT || 3000;
const express = require("express");
// const fs = require('fs');
const app = express();
const path = require('path');
let LocalStorage = require('node-localstorage').LocalStorage;
// const jsonParser = express.json();
app.use(express.urlencoded({extended: true, limit: '128mb'}));
app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));

const alg = require('./algos');
const map2graph_worker = require('./map2graph_worker');
const geocoder = require('./geocoder');

const ADMIN_TOKEN = "tokuak0Uoghohpha6eiSohr7gaifeith4eToe0coongeC9pai3thaV3sheDaech2utoodae9eeng8iasheiqu2eag8einiu5ou7xae7xeequooPheim5JoL9vo5BieiCoon3ohZazos1Ahl3zoothee7mie1aefepud3nie5Fa3DeeNoh6ahgh2ienakaeShi4Oohahkaingohtael9ohM4gah3haehaefaithaikahgoh6loogh3zaNephoocho3vai6poo5oomaengiemoo4shu8ujoo5gin9ooyauzeer9boh4shuoh2Iejukoht0sheiCheevahThai6fahQuash6eeV6aeshai4woaNgaxo7ooh8bah3iwidienae8ieLutaiquu6ath7ohg1Gohfaem0ohvaixiechohjuhahtieit6Cughoo4seX1xofi9deesaezahca9ahn1yah2zeXu6vaib4nosh9Eeb0quiChu6Cei0ih3hoze1aiheedi1oozoigh9rahKaePhain7wae1aeboozechah2oohgakeenoobeadi7cheeghiexe8ohDaera9Vaephiex6AichoiRohchee8aiHeequaeth5Aevei5ohyoz1Tien4thaiv4boh5veim6theepoashiethu2Ahl3AHa8ha9eeRe1ix8ki7izu9xeethooS8aeh3pha6IeQuooth4aec1aqu6xeish6Soosoo4haehai7ke1paeSie3tohveFaideeKeloh1Chohdai0Oyeiche1jahyoophooceLaeNg6so6nahp3wizeeThaiKeoVee4shiwi8esh2ahm6heDahsoLavai0mohtheiyoh6queexaenguic0thieVoh0quaitheen1uthohphooF5xingOogh6quu5theesai1shahquaix7eeshee9resh5elion6eezi0eChonai7oijpahsii5aw3eepe9johbaiYon8zaequiechoh0theitigi0logh3eeceeween3wee0xeo8Aenoofoh1aiSael4ahnoh4quaithejeicai0ooph1oovahc2Quaiteakou9quubeivee4reeph4ogeikahgai8phah9teip1Ti3Jaxeefie0ooyohlphe3aiboo7goochaiKeePheekeosheiruvieg6Ahpaij4ohw6nuu9iera1huz";
const CLIENT_TOKEN = "tokeeFahngeisaela1raraup4Eu1Eitahghahkahf4AeCh3yuen2Ge9ahtoaneewchiekah6Eije0jee3quaey9omu7ahch2Ka7aey5poh3Geiphai3Nea9eiM9Ieyoi8thu2vaichagheo8thohCof4koo4aeRooghaiGhiVahShaengahDaiyohlseithaezaeteiThoo1awahr8ohMei5xe5evaezai3ma2gaemaireen5aKae4pkae2ePh2Quai4mahsuiP3gootie1epaevaiT5ooweichai1kie5iepohyasiewuangoongahphiechisup6ainaiheeH8kaeb9ee0eifahSheikeiDiegahcuwdie3eephaebahgu3aekaux8eeb5oDu5yaica0ahvi0fo7faeNg5aiRohwephuCeegh0ohlee4bahk3phi7uaciegh5Raejeithaa5ooghohzae8thu0IwoLeehaez4yaipaeSh3fierie1eete4fuseotoofoothoh4peiQuujoh7asahXaew8udievaKu4yohdeo0aeQueey8zi7Eem0eiMahl2fohroRooziedei1iejahph0evu5uophahthiphaepoh5vohR2BeZai9vooFoo9chaazohwooNgia6moh7chipoophiewohfah0zun9queepo0eirish8Nahs9chohc3theiWeeghaco7yoh6roohph9heyahphee2JaifeiphuzieTou1Iowee0Ii6choo9eethahf4Nee3itiathieph3aeshaipuo6yei4bee6hai3ey2OLahChe6eishahVaXi4aesa5ainekeigh3Shoh5auNeegamoh3phaChii3phaeTaiNuSheituzengah0peighaino3vue1eer5eihae6UtaeChaochoh9no0iquei7upoo8wieShai5aeshe3Xee4naphohcohz9uu4shahng3eR7rish1tazi1oob9Beichauvoozeeyowael6pah1lthah6oothohz3OoK1euru8ouJ3Vichohpheijai2loumiepahph3ReipohkecEeshiethue8che2ook7aeJoPhohchoht5oorulohkoom4thoh8Seeweiceu2tOicath5coothaiwaixae1Aigeed6IuPu6queesahkumieth6ahb5aeyeoh5ae";


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
app.post('/map2graph', async (req, res) =>
{
    let params = req.body;

    if (params.access_token !== ADMIN_TOKEN)
    {
        console.log('wrong admin token attempt', params.token);
        return res.end("WRONG ACCESS TOKEN");
    }
    console.log('token accepted');

    console.log('/map2graph params');

    // long-polling
    let refresh_interval = setInterval(() =>
    {
        res.write(' ');
        console.log('refreshed connection (15s)');
    }, 8 * 1000);

    let alg_res;
    const worker = new Worker('./map2graph_worker.js', {workerData: params.map});

    let result = new Promise((resolve, reject) =>
    {
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', _ =>
        {
            clearInterval(refresh_interval);
        });
    })
        .catch(reason => {
            console.log('REASON FOR PROMISE FAILURE', reason);
        });
    return res.end(await result);
});


/***
 * finds path from start to target
 *
 * params:
 * - map_name: string - graph id
 * - start
 * - target (optional)
 *
 * returns distance from start to target (to every vertex if no target is provided)
 * */
app.post('/path_ab', async function (req, res)
{
    let params = req.body;

    if (params.access_token !== CLIENT_TOKEN)
    {
        console.log('wrong client token attempt', params.token);
        return res.end("WRONG ACCESS TOKEN try harder))0)");
    }

    console.log('/path_ab params', params.provide_geocoding, typeof params.provide_geocoding);
    if (/*params.graph === undefined || */params.start === undefined)
    {
        console.log('wrong format!');
        return res.end("error: wrong format. refer to /doc for more info.");
    }

    let map_name = params.map_name;
    let storage_graph = new LocalStorage(`./storage_graph/`, Number.MAX_VALUE);
    let graph = storage_graph.getItem(map_name);
    // params.graph = JSON.parse(params.graph);

    if (graph === null)
    {
        console.log('attempt to refer to graph that does not exist!');
        return res.end("there is no map with that map_name :(");
    }

    graph = JSON.parse(graph);

    let start_tag = params.start;
    let target_tag = params.target;
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
    let alg_res = alg.dijkstra(graph, start_tag, target_tag);
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