let LocalStorage = require('node-localstorage').LocalStorage;


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
    // floor_by_shopname(map_name);
    let name2tag_storage = new LocalStorage(`./storage_name2tag/${map_name}/`, Number.MAX_VALUE);
    return cs.map(c => name2tag_storage.getItem(c));
};


// search while not map null
const MAX_FLOORS = 10;
let floor_by_shopname = (shop_name, map_name) =>
{
    for (let i = 1; i <= MAX_FLOORS; i++)
    {
        let name2tag_storage = new LocalStorage(`./storage_name2tag/${map_name + ":" + i}`, Number.MAX_VALUE);
        console.log('checking map_name', map_name + ":" + i);
        if (name2tag_storage.getItem(shop_name) !== null)
        {
            console.log('shop', shop_name, 'was found on floor', i);
            return i;
        }
    }
    console.log('shop', shop_name, 'was not found :<');
    return null;
};


module.exports = {
    tag2name,
    name2tag,
    floor_by_shopname,
};