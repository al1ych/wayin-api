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

app.post('/map2graph', async (req, res) =>
{
    let params = req.body;
    console.log('/map2graph params');

    let refresh_interval = setInterval(() => {
        res.write(' ');
        console.log('refreshed connection (5s)');
    }, 5 * 1000);

    let alg_res;
    // alg_res = map2graph_worker.map2graph(params);
    const worker = new Worker('./map2graph_worker.js', {workerData: params});

    return res.end(await new Promise((resolve, reject) => {
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', _ => {
            clearInterval(refresh_interval);
        });
    }));
    //.then((x) => {
    //
    //     }));

    // return res.end(await alg_res);

    // return res.send(await alg_res);
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