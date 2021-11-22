import { forEach } from "chootils/dist/loops";
import meta from "./meta";
const validItemNameByType = {};
export function getConceptoStructureFromDefaults() {
    /*
    for meta
    Gets itemTypeNames and defaultStateByItemType
    itemTypeNames: ['pieces', 'slots']
    defaultStateByItemType:  {pieces : {piecePropertyA: null}}
    */
    meta.itemTypeNames = Object.keys(meta.defaultStateByItemType);
    forEach(meta.itemTypeNames, (itemType) => {
        var _a;
        if (!validItemNameByType[itemType]) {
            const nowItemNames = Object.keys(meta.currentState[itemType]);
            validItemNameByType[itemType] = nowItemNames[0];
        }
        let validName = (_a = validItemNameByType[itemType]) !== null && _a !== void 0 ? _a : "testItemName";
        const propNames = Object.keys(meta.defaultStateByItemType[itemType](validName));
        meta.propNamesByItemType[itemType] = propNames;
    });
}
