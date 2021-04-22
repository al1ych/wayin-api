let LocalStorage = require('node-localstorage').LocalStorage;
const MAX_FLOORS = 80;


let tag2name = (map_name, cs) =>
{
    let tag2name_storage = new LocalStorage(`./storage_tag2name/${map_name}/`, Number.MAX_VALUE);
    return cs.map(c => tag2name_storage.getItem(c));
};


let name2tag = (map_name, cs) =>
{
    // todo:
    // 1. search engine
    // 2. search for the correct floor
    floor_by_name(map_name);
    let name2tag_storage = new LocalStorage(`./storage_name2tag/${map_name}/`, Number.MAX_VALUE);
    return cs.map(c => name2tag_storage.getItem(c));
};


// search while not map null
let floor_by_name = (map_name) =>
{
    let i = 1;
    let name2tag_storage;
    while (true)
    {
        name2tag_storage = new LocalStorage(`./storage_name2tag/`, Number.MAX_VALUE);
        if (name2tag_storage.getItem(map_name + ":" + i) === null) {
            break;
        }
        console.log('exists floor: ', i);
        i++;
    }
};


module.exports = {
    tag2name,
    name2tag,
    floor_by_name
};