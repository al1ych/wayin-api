// GRAPH

var SortedSet = require("collections/sorted-set");

/**
 * finds the most optimal path in weighed graph
 * todo: make n^2 -> nlogn
 *
 * @param graph
 * @param start : start vertex
 * @param target : target vertex (optional)
 *
 * @returns {{p: {}, d: {}}|{p: {}, d: *, target_reachable: boolean, bp: []}}
 */
let dijkstra = function (graph, start, target)
{
    console.log(`starting dijkstra : ${start} -> ${target}`);

    // const n = Object.keys(graph).length;
    let d = {}, q = new SortedSet(), p = {}, used = {}; // distance, path

    for (let u in graph)
    {
        d[u] = Infinity;
        q.add([Infinity, u]);
    }
    d[start] = 0;
    q.add([d[start], start]);

    while (true)
    {
        let u, min_d = Infinity;
        min_d = q.min();
        if (min_d === undefined || min_d[0] === Infinity)
        {
            break;
        }
        q.delete(min_d);
        u = min_d[1];
        for (let v in graph[u])
        {
            let e = graph[u][v];
            let f = e.f, t = e.t, c = e.c;
            if (d[f] + c < d[t])
            {
                q.delete([d[t], t]);
                d[t] = d[f] + c;
                q.add([d[t], t]);

                p[t] = f;
            }
        }
    }

    let res;
    if (target)
    {
        res = {
            target_reachable: (d[target] !== undefined && d[target] !== Infinity), // if we can reach the target at all
            d: d[target], // distance to get to the target node
            p, // non-linear path map for a->b p[b] = a
            bp: build_path(p, target), // linear path to the target in the array form
        };
    }
    else
    {
        res = {
            p, // non-linear path map for a->b p[b] = a
            d, // distance from start for every vertex
        }
    }
    console.log('finishing dijkstra');
    // console.log('dijkstra returns', res);
    return res;
};

/**
 * constructs path from map p defined as p[v] = u iff u->v in the path
 *
 * @param p : non-linear path mapping
 * @param t : end vertex of the path
 *
 * @returns complete path : array of vertices
 */
let build_path = function (p, t)
{
    if (t === undefined)
    {
        return undefined;
    }
    let res = [], cur = t;
    while (p[cur] !== undefined)
    {
        res.unshift(cur);
        cur = p[cur];
    }
    if (cur !== undefined)
    {
        res.unshift(cur);
    }
    return res;
};

let test_graph = {
    a: [{f: 'a', t: 'b', c: 1}, {f: 'a', t: 'c', c: 2}],
    b: [{f: 'b', t: 'a', c: 1}, {f: 'b', t: 'c', c: 3}, {f: 'b', t: 'e', c: 1}],
    c: [{f: 'a', t: 'c', c: 2}, {f: 'c', t: 'b', c: 3}, {f: 'c', t: 'd', c: 2}, {f: 'c', t: 'e', c: 5}],
    d: [{f: 'd', t: 'c', c: 2}, {f: 'd', t: 'f', c: 3}],
    e: [{f: 'e', t: 'b', c: 1}, {f: 'e', t: 'c', c: 5}, {f: 'e', t: 'f', c: 4}],
    f: [{f: 'f', t: 'e', c: 4}, {f: 'f', t: 'd', c: 3}],
};

// console.log('distance:', dijkstra(test_graph, 'a', 'd'));

module.exports = {
    dijkstra,
    test_graph,
};