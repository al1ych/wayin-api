let on_cmd = function ()
{
    let cmd = prompt("What say you master?");
    render_cmd(cmd);
}

let render_cmd = function (cmd)
{
    console.log('Interpreted command:', cmd);
    if (cmd !== null && cmd !== undefined)
    {
        if (cmd[0] === '!')
        {
            console.log('Eval command executing');
            eval(cmd.substring(1));
        }
        else
        {
            console.log('Non-eval command executing');

            cmd = cmd.trim(); // removes white-spaces

            // CMD TREE
            if (cmd.includes('route')) // route <route test Zara Laurel 1 3 3>
            {
                // cmd beg
                localStorage['last_cmd'] = cmd;

                cmd = cmd.substring('route'.length + 1);

                let t = cmd.split(' ');

                console.log(t);

                pedir_path(
                    undefined,
                    t[1],
                    t[2],
                    true,
                    t[0] + ":" + t[3],
                    t[0] + ":" + t[4],
                    parseInt(t[5]),
                );
                // cmd end
            }
            else if (cmd.includes('r')) // repeat last cmd
            {
                // cmd beg
                if (localStorage['last_cmd'] && localStorage['last_cmd'] !== 'r')
                {
                    render_cmd(localStorage['last_cmd']);
                }
                // cmd end
            }
        }
    }
    else
    {
        console.log('Command is not recognized :(');
    }
}