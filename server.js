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
        .catch(reason =>
        {
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
let valid_mapname = function (s)
{
    if (s === undefined)
    {
        return false;
    }
    return s.indexOf(":") !== -1;
};

let storage_graph = new LocalStorage(`./storage_graph/`, Number.MAX_VALUE);

let get_graph = function (mname)
{
    let graph = storage_graph.getItem(mname); // params.graph = JSON.parse(params.graph);
    if (graph === null)
    {
        return null;
    }
    else
    {
        return JSON.parse(graph);
    }
};

app.post('/path_ab', async function (req, res)
{
    let params = req.body;

    if (params.access_token !== CLIENT_TOKEN)
    {
        console.log('wrong client token attempt', params.token);
        return res.end("WRONG ACCESS TOKEN try harder))0)");
    }

    console.log('/path_ab params', params);
    if (/*params.graph === undefined || */params.start === undefined)
    {
        console.log('wrong format!');
        return res.end("error: wrong format. refer to /doc for more info.");
    }

    let mname_start = params.mname_start;
    let mname_target = params.mname_target;
    let start_name = params.start;
    let target_name = params.target;
    let start_tag = start_name;
    let target_tag = target_name;

    if (valid_mapname(mname_start))
    {
        console.log('format good map name 1');
    }
    else
    {
        console.log('not valid');
    }

    if (get_graph(mname_start) === null ||
        get_graph(mname_target) === null)
    {
        console.log('attempt to refer to graph that does not exist!');
        return res.end("there is no map with that map_name :(");
    }

    if (params.provide_geocoding == true) // !!! == and not === !!!
    {
        start_tag = geocoder.name2tag(mname_start, [start_name])[0];
        target_tag = geocoder.name2tag(mname_target, [target_name])[0];
        // => name2tag
        console.log('geocode before: name2tag: ', [start_name, target_name]);
        console.log('geocode after: name2tag: ', [start_tag, target_tag]);
    }

    let dij;
    if (mname_start === mname_target) // on the same floor
    {
        dij = alg.dijkstra(get_graph(mname_start), start_tag, target_tag);
    }
    else // on different floors
    {
        // find all the portals on each floor todo: cache it
        let mname = mname_start.substr(0, mname_start.indexOf(":"));
        console.log({mname});
        let sfloor = parseInt(mname_start.substr(mname_start.indexOf(":") + 1));
        let tfloor = parseInt(mname_target.substr(mname_target.indexOf(":") + 1));
        console.log({sfloor, tfloor});

        let portal_last = [start_name, start_tag];
        let res = {
            target_reachable: true,
            bp: [],
            // d: d[target], // distance to get to the target node
            // p, // non-linear path map for a->b p[b] = a
            // bp: build_path(p, target), // linear path to the target in the array form
        };

        for (let f = sfloor; f <= tfloor; f++)
        {
            let g = get_graph(mname + ":" + f);
            if (g === null)
            {
                console.log('attempt to refer to graph that does not exist!');
                return res.end("there is no map with that map_name :(");
            }

            console.log('last portal ', portal_last);

            console.log("mname", mname + ":" + f);
            let storage_tag2name = new LocalStorage(`./storage_tag2name/${mname + ":" + f}/`, Number.MAX_VALUE);
            let portals = [];
            for (let tag in g)
            {
                let name = storage_tag2name.getItem(tag);
                if (name === null)
                {
                    continue;
                }
                if (name.indexOf("portal_") !== -1) // contains portal_
                {
                    portals.push([name, tag]);

                    // fix to issue with different coords on diff floors
                    if (name === portal_last[0])
                    {
                        portal_last = [name, tag]; // update coords to new ones if changed
                    }
                }
            }

            console.log({portal_last});
            console.log('portals', portals);
            let portal_next, bp;
            if (f !== tfloor)
            {
                dij = alg.dijkstra(g, portal_last[1]);
                console.log(dij);
                let min_dist = Infinity;
                // console.log('dijsktra p[]: ', dij.p);
                // console.log('graph acquired', g);
                for (let i in portals)
                {
                    let p = portals[i];
                    console.log('our portal[i]', p, dij.d[p[1]]);
                    if (dij.d[p[1]] < min_dist && // дело в дейкстре -- инфинити чота
                        p[0] !== portal_last[0])
                    {
                        min_dist = dij.d[p[1]];
                        portal_next = p;
                    }
                }
                console.log('portal next', portal_next);
                bp = alg.build_path(dij.p, portal_next ? portal_next[1] : undefined);
            }
            else
            {
                dij = alg.dijkstra(g, portal_last[1], target_tag);
                bp = dij.bp;
                // console.log('last floor p', dij.p);
            }
            if (bp === undefined)
            {
                res.target_reachable = false;
                break;
            }

            res.bp = [...res.bp, ...bp];
            console.log(res.bp);

            portal_last = portal_next; // now 'portal_next' is last
            // 1 no portal_1 -> portal_2
        }

        dij = res;
    }
    return res.send(dij);
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