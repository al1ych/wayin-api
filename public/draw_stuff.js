function draw_full_graph(graph)
{
    if (graph === undefined) // not specified
    {
        if (window.response_graph)
        {
            graph = JSON.parse(window.response_graph);
        }
        else
        {
            return;
        }
    }

    console.log('draw this graph:', graph);

    for (f in graph)
    {
        let es = graph[f];

        for (let i = 0; i < es.length; i++)
        {
            let p1 = f.split(',').map(x => parseFloat(x));
            let p2 = es[i].t.split(',').map(x => parseFloat(x));

            ctx.beginPath();
            ctx.moveTo(p1[0], p1[1]);
            ctx.lineTo(p2[0], p2[1]);
            ctx.stroke();
        }

    }
}


function draw_brief_graph(graph, shops) // only edges each v->u from shopset
{
    if (graph === undefined) // not specified
    {
        if (window.response_graph)
        {
            graph = JSON.parse(window.response_graph);
            shops = JSON.parse(window.response_shops);
        }
        else
        {
            return;
        }
    }

    console.log('draw this graph:', graph);
    console.log('using these shops:', shops);

    for (ind in shops)
    {
        let f = shops[ind][1];
        let es = graph[f];

        for (let i = 0; i < es.length; i++)
        {
            let p1 = f.split(',').map(x => parseFloat(x));
            let p2 = es[i].t.split(',').map(x => parseFloat(x));

            ctx.beginPath();
            ctx.moveTo(p1[0], p1[1]);
            ctx.lineTo(p2[0], p2[1]);
            ctx.stroke();
        }

    }
}


function draw_cada_ruta(map_name, shops, floor) // only edges each v->u from shopset
{
    if (shops === undefined)
    {
        shops = JSON.parse(window.response_shops);
    }

    console.log(`%cDraw cada ruta: ${shops}`, 'background-color: red');
    console.log('Routes in total:', shops.length ** 2);

    if (floor === undefined)
    {
        floor = prompt('floor #');
    }

    for (i in shops)
    {
        for (j in shops)
        {
            let s = shops[i][1];
            let t = shops[j][1];

            // console.log(`%sPath ${s} > ${t}`, 'background-color: yellow; color: black;')

            pedir_path(undefined, s, t, false, floor, floor);

            // for (let i = 0; i < es.length; i++)
            // {
            //     let p1 = f.split(',').map(x => parseFloat(x));
            //     let p2 = es[i].t.split(',').map(x => parseFloat(x));
            //
            //     ctx.beginPath();
            //     ctx.moveTo(p1[0], p1[1]);
            //     ctx.lineTo(p2[0], p2[1]);
            //     ctx.stroke();
            // }
        }
    }
}


function draw_path(p)
{
    console.log('draw path', p);
    ctx.beginPath();
    // stroke styling
    var gradient = ctx.createLinearGradient(0, 0, 170, 0);
    gradient.addColorStop("0", "magenta");
    gradient.addColorStop("0.5", "blue");
    gradient.addColorStop("1.0", "red");
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = gradient;
    //stroke styling
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++)
    {
        ctx.lineTo(p[i][0], p[i][1]);
    }
    ctx.stroke();

    if (window.geom_map) console.log(`map elements: ${window.geom_map.shops.length} + ${window.geom_map.walls.length} = ${window.geom_map.shops.length + window.geom_map.walls.length}`);
}



function geom2map(t)
{
    ctx.clearRect(0, 0, ca.width, ca.height);

    let total_walls = 0;
    const substitution = {
        ',': ' '
    };
    const accuracy = document.getElementById("accuracy_holder").value;
    window.geom_map = {
        shops: [],
        walls: [],
        map_name: document.getElementById("input_map_name").value,
    };

    // find shops
    // process circles
    let s = t;
    // let shops = [];
    window.max_elem_x = -Infinity;
    window.max_elem_y = -Infinity;
    while (s.includes("<circle "))
    {
        let c_ind = s.indexOf("<circle ");
        let sx = "", sy = "", sid = "";
        let sdname = ""; // data-name

        for (let i = c_ind + 8; i < s.length - 10; i++)
        {
            if (s.substr(i, 3) === 'cx=') // cx="..."
            {
                for (let j = i + 4; j < s.length && s[j] !== '\"'; j++)
                {
                    sx += s[j];
                }
            }
            else if (s.substr(i, 3) === 'cy=')
            {
                for (let j = i + 4; j < s.length && s[j] !== '\"'; j++)
                {
                    sy += s[j];
                }
                break;
            }
            else if (s.substr(i, 3) === 'id=')
            {
                for (let j = i + 4; j < s.length && s[j] !== '\"'; j++)
                {
                    sid += s[j];
                }
            }
            else if (s.substr(i, 10) === 'data-name=')
            {
                for (let j = i + 11; j < s.length && s[j] !== '\"'; j++)
                {
                    sdname += s[j];
                }
            }
        }

        let shop_name = (sdname === "" ? sid : sdname);
        if (shop_name !== "")
        {
            window.geom_map.shops.push({name: shop_name, tag: `${sx},${sy}`, x: sx, y: sy});
            max_elem_x = Math.max(max_elem_x, sx);
            max_elem_y = Math.max(max_elem_y, sy);

            const sz = 5;
            ctx.beginPath();
            ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
            ctx.fillText(shop_name, parseFloat(sx), parseFloat(sy));
            ctx.stroke();
        }

        s = s.substr(0, c_ind) + s.substr(c_ind + 1);
    }


    // find walls
    // process paths
    s = t;
    while (s.includes(" d="))
    {
        total_walls++;

        let d = s.indexOf(" d=");
        d += 4;
        let path = s[d];
        for (let i = d + 1; i < s.length && s[i] !== '\"'; i++)
        {
            path += (substitution[s[i]] === undefined ? s[i] : substitution[s[i]]);
        }

        console.log('starting drawing path', path, '...');
        srcPath.setAttribute("d", path);
        decompose_svg(srcPath, accuracy);

        s = s.substr(0, d - 4 + 1) + s.substr(d - 4 + 1 + 1);
        console.log('to remove:', s[d - 4]);
    }
    // process lines
    s = t;
    while (s.includes("<line "))
    {
        total_walls++;

        let l = s.indexOf("<line ");
        let x1 = "", y1 = "", x2 = "", y2 = "";
        for (let i = l + 6; i < s.length - 1; i++)
        {
            if (s.substr(i, 2) === 'x1') // x1="..."
            {
                for (let j = i + 4; j < s.length && s[j] !== '\"'; j++)
                {
                    x1 += s[j];
                }
            }
            else if (s.substr(i, 2) === 'y1')
            {
                for (let j = i + 4; j < s.length && s[j] !== '\"'; j++)
                {
                    y1 += s[j];
                }
            }
            else if (s.substr(i, 2) === 'x2')
            {
                for (let j = i + 4; j < s.length && s[j] !== '\"'; j++)
                {
                    x2 += s[j];
                }
            }
            else if (s.substr(i, 2) === 'y2')
            {
                for (let j = i + 4; j < s.length && s[j] !== '\"'; j++)
                {
                    y2 += s[j];
                }
                break;
            }
        }

        window.geom_map.walls.push({x1, y1, x2, y2});

        console.log('line', x1, y1, x2, y2);
        console.log('draw line');
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        s = s.substr(0, l) + s.substr(l + 1);
        console.log('line to remove:', s[l]);
    }


    // adding grid
    let GRID_ACCURACY = parseFloat(document.getElementById("grid_accuracy_holder").value); // dx, dy  grid step
    const GRID_DENSITY = 5;
    for (let y = 0; y <= max_elem_y + GRID_ACCURACY * 5; y += GRID_ACCURACY)
    {
        for (let x = 0; x <= max_elem_x + GRID_ACCURACY * 5; x += GRID_ACCURACY)
        {
            for (let t = 0; t < GRID_DENSITY; t++)
            {
                // ghost shop - grid node
                let sh_c = {
                    shop_name: "",
                    sx: x + Math.random() * GRID_ACCURACY,
                    sy: y + Math.random() * GRID_ACCURACY,
                };
                window.geom_map.shops.push({
                    name: sh_c.shop_name,
                    tag: `${sh_c.sx},${sh_c.sy}`,
                    x: sh_c.sx,
                    y: sh_c.sy
                });
                const sz = 1;
                ctx.beginPath();
                ctx.fillRect(sh_c.sx - sz / 2, sh_c.sy - sz / 2, sz, sz);
                ctx.fillText(sh_c.shop_name, parseFloat(sh_c.sx), parseFloat(sh_c.sy));
                ctx.stroke();
            }
        }
    }

    console.log('total walls:', total_walls);

    pedir_map2graph(window.geom_map);
}

function decompose_svg(path, num)
{
    var l = path.getTotalLength();
    var p = path.getPointAtLength(0);
    var d = `M${p.x} ${p.y}`;
    var pp;
    ctx.beginPath();
    // ctx.moveTo(p.x, p.y);
    for (var i = (l / num); i <= l; i += (l / num))
    {
        p = path.getPointAtLength(i);
        d += `L${p.x} ${p.y}`;
        ctx.lineTo(p.x, p.y);
        // window.java_code_output += (pp !== undefined ? `new Wall(${pp.x}*1., ${pp.y}*1., ${p.x}*1., ${p.y}*1.), ` : "");
        if (pp !== undefined)
        {
            window.geom_map.walls.push({x1: pp.x, y1: pp.y, x2: p.x, y2: p.y});
            window.max_elem_x = Math.max(max_elem_x, p.x);
            window.max_elem_y = Math.max(max_elem_y, p.y);
        }
        pp = p;
    }
    ctx.stroke();
    path.setAttribute("d", d + "z")
}