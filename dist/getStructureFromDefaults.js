import { forEach } from "chootils/dist/loops";
import { repondMeta as meta } from "./meta";
const validItemIdByType = {};
// sets itemTypeNames and propertyNamesByItemType
export function getRepondStructureFromDefaults() {
    /*
    itemTypeNames: ['pieces', 'slots']
    defaultStateByItemType:  {pieces : {piecePropertyA: null}}
    */
    meta.itemTypeNames = Object.keys(meta.defaultStateByItemType);
    forEach(meta.itemTypeNames, (itemType) => {
        if (!validItemIdByType[itemType]) {
            const nowItemIds = Object.keys(meta.nowState[itemType]);
            validItemIdByType[itemType] = nowItemIds[0];
        }
        let validName = validItemIdByType[itemType] ?? "testItemId";
        const propNames = Object.keys(meta.defaultStateByItemType[itemType](validName));
        meta.propNamesByItemType[itemType] = propNames;
    });
}
// sets currenRepondRefs based on itemIds from repond state
export function makeRefsStructureFromRepondState() {
    forEach(meta.itemTypeNames, (typeName) => {
        // if no initialRefs were provided add defaults here?
        // need to store initalRefs? worldStateMeta.customInitialRefs
        // {itemType : customInitialRefs}
        meta.nowRefs[typeName] = {};
        forEach(Object.keys(meta.nowState[typeName]), (id) => {
            meta.nowRefs[typeName][id] = meta.defaultRefsByItemType[typeName](id, meta.nowState[typeName][id]);
        });
    });
}
