function valid_token(token)
{
    return token !== '' &&
        token !== undefined &&
        token !== "undefined" &&
        token !== null &&
        // token.length === 64 &&
        token.substr(0, 3) === 'tok';
}

function pedir_map2graph()
{
    if (window.geom_map.map_name === '')
    {
        alert('map name not set');
        location.reload();
        return;
    }

    let token;
    if (localStorage['token'] === undefined)
    {
        token = prompt("Enter access token:");
        console.log('%ctoken: ' + token, 'background: green; color: black;');
        if (!valid_token(token))
        {
            alert('invalid token');
            delete localStorage['token'];
            location.reload();
            return;
        }
        else
        {
            localStorage['token'] = token;
        }
    }
    else
    {
        token = localStorage['token'];
        if (!valid_token(token))
        {
            alert('invalid token');
            delete localStorage['token'];
            location.reload();
            return;
        }
    }

    console.time("map2graph time");
    console.log('starting pidiendo map2graph');
    console.log('estimated time:', ((window.geom_map.shops.length + window.geom_map.walls.length) / 5707) * (199780), 'ms');
    console.log(`map elements: ${window.geom_map.shops.length} + ${window.geom_map.walls.length} = ${window.geom_map.shops.length + window.geom_map.walls.length}`);

    $.ajax({
        type: 'POST',
        url: '/map2graph',
        data: JSON.stringify({
            map: window.geom_map,
            access_token: token,
        }),
        dataType: 'json',
        contentType: "application/json",
    }).done(response =>
    {
        console.timeEnd("map2graph time");

        console.log('%cShops: ' + JSON.stringify(response.shops), 'background: blue;');
        console.log('%cGraph: ' + JSON.stringify(response.graph), 'background: cyan; color: black;');

        // document.getElementById("output_java_code").textContent = JSON.stringify(response.graph);
        // document.getElementById("output_shops_code").textContent = JSON.stringify(response.shops);
        // window.response_graph = JSON.stringify(response.graph);
        window.response_shops = JSON.stringify(response.shops);
        download_json(response.shops, `${window.geom_map.map_name}_n2t.json`);
        // download_json(response.graph, `${window.geom_map.map_name}_map.json`);
    });
}

function pedir_path(graph, start, target, provide_geocoding, start_floor, target_floor, show_floor)
{
    console.log(`Request: path from ${start} to ${target}`);

    if (start === undefined)
    {
        start = prompt("enter start shop name");
    }
    if (target === undefined)
    {
        target = prompt("enter target shop name");
    }
    if (start_floor === undefined)
    {
        start_floor = prompt("enter start floor");
    }
    if (target_floor === undefined)
    {
        target_floor = prompt("enter target floor");
    }

    console.log('mname_start', (input_map_name.value ? input_map_name.value + ":" : "") + start_floor);

    $.ajax({
        type: 'POST',
        url: '/path_ab',
        data: JSON.stringify({
            start,
            target,
            provide_geocoding,
            // map_name: window.geom_map.map_name,
            mname_start: (input_map_name.value ? input_map_name.value + ":" : "") + start_floor,
            mname_target: (input_map_name.value ? input_map_name.value + ":" : "") + target_floor,
            access_token: CLIENT_TOKEN,
        }),
        dataType: 'json',
        contentType: "application/json",
    }).done(response =>
    {
        console.log('pedir_path done => response:', response);

        if (response.target_reachable === false)
        {
            console.log(`%cCannot get from ${start} to ${target}`, 'background: red');
            return;
        }

        let bp;
        // if (show_floor)
        //     bp = response.bp[show_floor - 1];
        // else
            bp = response.bp[target_floor - start_floor];

        console.log('response', response.bp, typeof show_floor, show_floor !== undefined, target_floor);
        console.log('the bp', bp);
        let path = bp.map(c => (c.split(',').map(x => parseFloat(x))));
        console.log('the path', path);

        console.log({response});
        console.log('bp', bp);

        draw_path(path);
    });
}
