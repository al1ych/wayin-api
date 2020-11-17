const max_direct_shop_distance = 65;

// GEOM

let on_segment = function (px, py, qx, qy, rx, ry)
{
    return qx <= Math.max(px, rx) && qx >= Math.min(px, rx) &&
        qy <= Math.max(py, ry) && qy >= Math.min(py, ry);
};

let orientation = function (px, py, qx, qy, rx, ry)
{
    val = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
    if (val == 0)
    {
        return 0;
    }
    return (val > 0) ? 1 : 2;
};

let segment_intersection = function (x1, y1, x2, y2, x3, y3, x4, y4)
{
    let o1 = orientation(x1, y1, x2, y2, x3, y3);
    let o2 = orientation(x1, y1, x2, y2, x4, y4);
    let o3 = orientation(x3, y3, x4, y4, x1, y1);
    let o4 = orientation(x3, y3, x4, y4, x2, y2);
    if (o1 !== o2 && o3 !== o4)
    {
        return true;
    }
    if (o1 === 0 && on_segment(x1, y1, x3, y3, x2, y2))
    {
        return true;
    }
    if (o2 === 0 && on_segment(x1, y1, x4, y4, x2, y2))
    {
        return true;
    }
    if (o3 === 0 && on_segment(x3, y3, x1, y1, x4, y4))
    {
        return true;
    }
    if (o4 === 0 && on_segment(x3, y3, x2, y2, x4, y4))
    {
        return true;
    }
    return false;
};

let pt_distance = function (x1, y1, x2, y2)
{
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
};

let pt_distance_sqr = function (x1, y1, x2, y2)
{
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
};

// if graph is blank -- THIS IS THE MISTAKE
let addEdge = function (g, f, t, c)
{
    if (g[f] === undefined)
    {
        g[f] = [];
    }
    g[f].push({
        f, t, c, // graph component
    });
};

// takes map (geom) :
// returns graph
// todo reduce time complexity n^3 -> n^2
let map2graph = function ({shops, walls})
{
    console.log('starting map2graph', {shops_len: shops.length, walls_len: walls.length});
    console.log('estimated time:', ((shops.length + walls.length) / 5707) * (199780), 'ms');
    console.time('map2graph');

    // let shops = map.shops;
    // let walls = map.walls;
    let graph = {}; // tag -> adjacent vertices list

    let counter = 0;

    for (let i1 in shops)
    {
        for (let i2 in shops)
        {
            let s1 = shops[i1];
            let s2 = shops[i2];
            if (s1.tag === s2.tag || pt_distance(s1.x, s1.y, s2.x, s2.y) > max_direct_shop_distance)
            {
                continue;
            }
            let direct = true; // if in direct view
            for (let j in walls)
            {
                let w = walls[j];
                counter++;
                if (segment_intersection(s1.x, s1.y, s2.x, s2.y, w.x1, w.y1, w.x2, w.y2))
                {
                    direct = false;
                    // console.log(s1.tag, "!indir!", s2.tag);
                    break;
                }
            }
            if (direct)
            {
                addEdge(graph, s1.tag, s2.tag, pt_distance(s1.x, s1.y, s2.x, s2.y));
                // await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }

    console.timeEnd('map2graph');
    console.log('finishing map2graph', shops.length, walls.length, counter);
    return graph;
};


const {isMainThread, workerData, parentPort} = require('worker_threads');
if (!isMainThread)
    parentPort.postMessage(JSON.stringify(map2graph(workerData)));


// module.exports = {
//     map2graph
// };


// let map2graph = function ({shops, walls})
// {
//     console.log('starting map2graph (scanline)');
//
//     let graph = {}; // tag -> adjacent vertices list
//     let events = []; // events
//     let seg_id = {}; // seg -> id
//
//     for (let i1 in shops)
//     {
//         for (let i2 in shops)
//         {
//             let s1 = shops[i1];
//             let s2 = shops[i2];
//             if (s1.tag === s2.tag || pt_distance(s1.x, s1.y, s2.x, s2.y) > max_direct_shop_distance)
//             {
//                 continue;
//             }
//
//             let seg = {
//                 x1: parseFloat(s1.x),
//                 y1: parseFloat(s1.y),
//                 x2: parseFloat(s2.x),
//                 y2: parseFloat(s2.y)
//             };
//
//             let temp = Math.floor(Math.random() * 1e8);
//             seg_id[temp] = seg;
//             events.push({
//                 x: parseFloat(s1.x),
//                 t: 0,
//                 st: 0,
//                 seg_id: temp,
//             }); // open
//             events.push({
//                 x: parseFloat(s2.x),
//                 t: 1,
//                 st: 0,
//                 seg_id: temp,
//             }); // close
//         }
//     }
//
//     for (let j in walls)
//     {
//         let w = walls[j];
//         let temp = Math.floor(Math.random() * 1e8);
//         seg_id[temp] = w;
//         events.push({
//             x: parseFloat(w.x1),
//             t: 0,
//             st: 1,
//             seg_id: temp,
//         }); // open
//         events.push({
//             x: parseFloat(w.x2),
//             t: 1,
//             st: 1,
//             seg_id: temp,
//         }); // close
//     }
//
//     console.log(events.length);
//
//     events.sort((a, b) =>
//     {
//         if (a.x === b.x)
//         {
//             return a.t - b.t;
//         }
//         else
//         {
//             return a.x - b.x;
//         }
//     });
//
//     let open = [];
//     let open_walls = [];
//
//     for (let i in events)
//     {
//         let e = events[i];
//         let x = e.x;
//         let t = e.t;
//         let st = e.st;
//         let id = e.seg_id;
//
//         // console.log(e);
//
//         if (t === 0)
//         {
//             if (st === 0)
//             {
//                 open.push(id);
//             }
//             else
//             {
//                 open_walls.push(id);
//             }
//             // console.log({seg_id: e.seg_id});
//         }
//
//         for (let i1 in open)
//         {
//             for (let i2 in open_walls)
//             {
//                 let seg1 = seg_id[open[i1]];
//                 let seg2 = seg_id[open_walls[i2]];
//
//                 if (i1 === i2)
//                 {
//                     continue;
//                 }
//
//                 if (!segment_intersection(seg1, seg2))
//                 {
//                     addEdge(graph,
//                         seg1.x1 + "," + seg1.y1,
//                         seg1.x2 + "," + seg1.y2,
//                         pt_distance(seg1.x1, seg1.y1, seg1.x2, seg1.y2));
//                 }
//             }
//         }
//
//         if (t === 1)
//         {
//             if (st === 0)
//             {
//                 let ind = open.indexOf(id);
//                 open.splice(ind, 1);
//             }
//             else
//             {
//                 let ind = open_walls.indexOf(id);
//                 open_walls.splice(ind, 1);
//             }
//         }
//     }
//
//
//     console.log('open size after events loop:', open.length, open_walls.length);
//
//     //         let direct = true; // if in direct view
//     //         for (let j in walls)
//     //         {
//     //             let w = walls[j];
//     //             if (segment_intersection(s1.x, s1.y, s2.x, s2.y, w.x1, w.y1, w.x2, w.y2))
//     //             {
//     //                 direct = false;
//     //                 // console.log(s1.tag, "!indir!", s2.tag);
//     //                 break;
//     //             }
//     //         }
//     //         if (direct)
//     //         {
//     //             addEdge(graph, s1.tag, s2.tag, pt_distance_sqr(s1.x, s1.y, s2.x, s2.y));
//     //         }
//     //
//     // console.log('finishing map2graph', shops.length, walls.length);
//     // return graph;
// };