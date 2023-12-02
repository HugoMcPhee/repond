import { forEach } from "chootils/dist/loops";
import meta from "./meta";
const validItemNameByType = {};
export function getRepondStructureFromDefaults() {
    /*
    for meta
    Gets itemTypeNames and defaultStateByItemType
    itemTypeNames: ['pieces', 'slots']
    defaultStateByItemType:  {pieces : {piecePropertyA: null}}
    */
    meta.itemTypeNames = Object.keys(meta.defaultStateByItemType);
    forEach(meta.itemTypeNames, (itemType) => {
        if (!validItemNameByType[itemType]) {
            const nowItemNames = Object.keys(meta.currentState[itemType]);
            validItemNameByType[itemType] = nowItemNames[0];
        }
        let validName = validItemNameByType[itemType] ?? "testItemName";
        const propNames = Object.keys(meta.defaultStateByItemType[itemType](validName));
        meta.propNamesByItemType[itemType] = propNames;
    });
}
