const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
const path = require('path');
let LocalStorage = require('node-localstorage').LocalStorage;
app.use(express.urlencoded({extended: true, limit: '128mb'}));
app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));

const alg = require('./algos');
const geocoder = require('./geocoder');

const CLIENT_TOKEN  = "tokeeFahngeisaela1raraup4Eu1Eita";
const ADMIN_TOKEN   = "tokuak0Uoghohpha6eiSohr7gaifeith";


let pull_graph = async function (mId)
{
    return new Promise((resolve, reject) =>
    {
        db.ref(`maps/${mId}/graph`).on("value", function (snapshot)
        {
            resolve(snapshot.val());
            console.log('graph pull success');
        }, (e) =>
        {
            reject('error pulling graph :c');
        });
    });
};

// API INTERACTION INTERFACE

const asyncMiddleware = fn => (req, res, next) =>
{
    Promise.resolve(fn(req, res, next)).catch(next);
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

    console.log('/map2graph invoked');

    // long-polling
    const RFQ = 15;
    let refresh_interval = setInterval(() =>
    {
        res.write(' ');
        console.log(`refreshed connection (${RFQ}s)`);
    }, RFQ * 1000);

    const worker = new Worker('./map2graph_worker.js', {workerData: params.map});

    let result = await new Promise((resolve, reject) =>
    {
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', _ =>
        {
            console.log('worker exit');
            clearInterval(refresh_interval);
        });
    })
        .catch(reason =>
        {
            console.log('REASON FOR PROMISE FAILURE', reason);
        });
    console.log('we got result on server.js');
    clearInterval(refresh_interval);
    return res.end(result);
});


let valid_mapname = function (s)
{
    if (s === undefined)
    {
        return false;
    }
    return s.indexOf(":") !== -1;
};

let graph_storage = new LocalStorage(`./storage_graph/`, Number.MAX_VALUE);
let get_graph = async function (mname)
{
    let graph = graph_storage.getItem(mname);
    return (graph !== null ? JSON.parse(graph) : null);
};


const SESSION_CACHE_EXPIRATION_TIME = 60 * 60 * 1000;
let session_cache = {};


app.post('/route', async function (req, res)
{
    let params = req.body;

    console.log(params);
    console.log(params.access_token);
    if (params.access_token !== CLIENT_TOKEN)
    {
        console.log('wrong client token attempt: ', params.token);
        return res.end("WRONG ACCESS TOKEN :<");
    }

    console.log('/route params', params);
    if (params.start === undefined)
    {
        console.log('wrong format!');
        return res.end("error: wrong format. refer to /doc for more info.");
    }

    // let mname_start = params.mname_start;
    // let mname_target = params.mname_target;
    let map_name = params.map_name;
    let start_name = params.start;
    let target_name = params.target;
    let start_tag = start_name;
    let target_tag = target_name;

    let f1 = geocoder.floor_by_shopname(start_name, map_name);
    let f2 = geocoder.floor_by_shopname(target_name, map_name);
    if (f1 === null || f2 === null)
    {
        console.log('shop floor was not identified: ', f1, f2);
        return res.end("shop floor was not identified :<");
    }

    let mname_start = map_name + ":" + f1;
    let mname_target = map_name + ":" + f2;

    const signature = "/route/" + mname_start + "-" + start_name + "->" + mname_target + "-" + target_name;

    if (session_cache[signature] !== undefined &&
        Date.now() - session_cache[signature].timestamp < SESSION_CACHE_EXPIRATION_TIME)
    {
        console.log('session cache worked signature', signature);
        return res.send(session_cache[signature].data);
    }

    if (!valid_mapname(mname_start) || !valid_mapname(mname_target))
    {
        console.log('map_name is not valid: ', mname_start, mname_target);
        return res.end("map name is not valid :<");
    }

    if (await get_graph(mname_start) === null ||
        await get_graph(mname_target) === null)
    {
        console.log('attempt!');
        console.log('attempt to refer to graph ', mname_start, ' that does not exist!');
        console.log('attempt to refer to graph ', mname_target, ' that does not exist!');
        return res.end("there is no map with that map_name :<");
    }

    if (params.provide_geocoding === true ||
        params.provide_geocoding === 'true')
    {
        start_tag = geocoder.name2tag(mname_start, [start_name])[0];
        target_tag = geocoder.name2tag(mname_target, [target_name])[0];
        // => name2tag
        console.log('geocode: name2tag: before: ', [start_name, target_name]);
        console.log('geocode: name2tag: after: ', [start_tag, target_tag]);
    }

    let dij;
    if (mname_start === mname_target) // on the same floor
    {
        dij = alg.dijkstra(await get_graph(mname_start), start_tag, target_tag);
        dij.bp = [dij.bp];
    }
    else // on different floors
    {
        // find all the portals on each floor todo: cache it
        let mname = mname_start.substr(0, mname_start.indexOf(":"));
        console.log({mname});
        let sfloor = parseInt(mname_start.substr(mname_start.indexOf(":") + 1));
        let tfloor = parseInt(mname_target.substr(mname_target.indexOf(":") + 1));
        console.log({sfloor, tfloor});

        let result = {
            target_reachable: true,
            bp: [],
            // d: d[target], // distance to get to the target node
            // p, // non-linear path map for a->b p[b] = a
            // bp: build_path(p, target), // linear path to the target in the array form
        };

        let directionIncrement = (sfloor <= tfloor ? +1 : -1);
        let direction = (sfloor <= tfloor ? "u" : "d"); // up down
        let portal_last = [start_name, start_tag, direction];

        console.log("direction increment", directionIncrement);
        console.log("direction", direction);
        for (let f = sfloor; (sfloor <= tfloor ? f <= tfloor : f >= tfloor); f += directionIncrement)
        {
            console.log(mname + ":" + f);
            // let g = await get_graph(mname + ":" + f);

            let g = graph_storage.getItem(mname + ":" + f);
            if (g === null)
            {
                console.log('attempt to refer to graph that does not exist!');
                return res.end("there is no map with that map_name :(");
            }
            g = JSON.parse(g);

            console.log("mname", mname + ":" + f);
            let storage_tag2name = new LocalStorage(`./storage_tag2name/${mname + ":" + f}/`, Number.MAX_VALUE);
            let portals = []; // todo gotta go
            for (let tag in g)
            {
                let name = storage_tag2name.getItem(tag);
                if (name === null)
                {
                    continue;
                }
                if (name.indexOf("portal") !== -1) // contains portal_
                {
                    let portalName = name.substring(0, 7) + name.substr(9); // string name
                    let portalTag = tag; // coords
                    let portalDirection = name[name.indexOf("portal") + 7]; // u / d (up / down)
                    portals.push([portalName, portalTag, portalDirection]);

                    // fix to issue with different coords on diff floors
                    if (portalName === portal_last[0])
                    {
                        portal_last = [portalName, portalTag, portalDirection]; // update coords to new ones if changed
                    }
                }
            }

            console.log({portal_last});
            console.log('portals', portals);
            let portal_next, bp;
            if (f !== tfloor)
            {
                console.log('soon dijkstra from', portal_last);
                dij = alg.dijkstra(g, portal_last[1]);
                let min_dist = Infinity;
                for (let i in portals)
                {
                    let p = portals[i];
                    console.log('considering next portal', p, dij.d[p[1]]);
                    if (p[2] === direction)
                        console.log('p[2] = direction', p[2], direction);
                    if (dij.d[p[1]] < min_dist && // min distance
                        p[0] !== portal_last[0] && // not initial portal
                        p[2] === direction) // we're going this direction
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
                dij.bp.unshift(portal_last[1]);
                bp = dij.bp;
            }
            if (bp === undefined)
            {
                result.target_reachable = false;
                break;
            }

            result.bp.push(bp);
            console.log('result.bp', result.bp);

            portal_last = portal_next;
        }

        dij = result;
    }
    // console.log('resulting dij bp', dij.bp);
    if (dij !== undefined && dij.target_reachable === true)
    {
        console.log('session cache updated signature', signature);
        session_cache[signature] = {
            timestamp: Date.now(),
            data: dij,
        };
    }
    return res.send(dij);
});


app.get('/doc', function (req, res)
{
    return res.send("Hello! To get info on how to use the API text me on TG: @aladdinych");
});

app.get('/cc', function (req, res)
{
    return res.sendFile(__dirname + "/public/control_center.html");
});


app.get('/test', function (req, res)
{
    let tmp = {
        "field1": 123, "field2": "hello"
    };
    return res.send(tmp);
});


let server = app.listen(port, () =>
{
    console.log("Server started...");
});
