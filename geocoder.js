let LocalStorage = require('node-localstorage').LocalStorage;


let tag2name = (map_name, cs) =>
{
    let tag2name_storage = new LocalStorage(`./storage_tag2name/${map_name}/`);
    return cs.map(c => tag2name_storage.getItem(c));
};


let name2tag = (map_name, cs) =>
{
    let name2tag_storage = new LocalStorage(`./storage_name2tag/${map_name}/`);
    return cs.map(c => name2tag_storage.getItem(c));
};


module.exports = {
    tag2name,
    name2tag
};