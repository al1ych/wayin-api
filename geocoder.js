let LocalStorage = require('node-localstorage').LocalStorage;

let tag2name_storage = new LocalStorage('./storage_tag2name');
let name2tag_storage = new LocalStorage('./storage_name2tag');

let tag2name = (g, cs) =>
{
    return cs.map(c => tag2name_storage.getItem(c));
};


let name2tag = (g, cs) =>
{
    return cs.map(c => name2tag_storage.getItem(c));
};


module.exports = {
    tag2name,
    name2tag
};