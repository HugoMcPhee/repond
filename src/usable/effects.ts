import { addItemToUniqueArray, removeItemFromArray } from "chootils/dist/arrays";
import { breakableForEach, forEach } from "chootils/dist/loops";
import meta, { UntypedInnerEffect, toSafeEffectName } from "../meta";
import {
  runWhenDoingInnerEffectsRunAtStart,
  runWhenStartingInnerEffects,
  runWhenStoppingInnerEffects,
} from "../settingInternal";
import {
  AllProps,
  AllRefs,
  AllState,
  DiffInfo,
  EffectPhase,
  Effect_Check,
  Effect_OneCheck,
  Effect_Options,
  Effect_Options_NameRequired,
  Effect_Options_NoMeta,
  InnerEffect,
  InnerEffect_Check,
  InnerEffect_Loose,
  InnerEffect_OneCheck,
  InnerEffect_OneCheck_MultiItemTypes,
  ItemEffect_Check_Becomes,
  ItemEffect_Options,
  ItemEffect_Options_NoMeta,
  ItemName,
  ItemType,
  MakeRule_Rule,
  PropName,
  RefinedGroupedEffects,
  StepName,
} from "../types";
import { asArray, toSafeArray } from "../utils";
import { getPrevState, getRefs, getState } from "../usable/getSet";

// --------------------------------------------------------------------
// Effects
// --------------------------------------------------------------------
// type MakeRule_Rule = FlexibleRuleOptions<
//   T_ItemType,
//   PropertyName<T_ItemType>
// >;

// NOTE could make options generic and return that
// type MakeEffect = <K_Type extends T_ItemType>(options: Effect_RuleOptions<K_Type>) => Effect_RuleOptions<K_Type>;
export type MakeEffect = <K_Type extends ItemType>(
  options: Effect_Options_NoMeta<K_Type>
  // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>;
) => any;

// type MakeItemEffect = <K_Type extends T_ItemType, K_PropName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropName>) => ItemEffect_RuleOptions<K_Type, K_PropName>;
export type MakeItemEffect = <K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  options: ItemEffect_Options_NoMeta<K_Type, K_PropName>
  // ) => ItemEffect_RuleOptions<
  //   K_Type,
  //   K_PropName,
  //   T_ItemType,
  //   T_State,
  //   T_Refs,
  //   T_StepName
  // >;
) => any;

export type MakeDynamicEffectInlineFunction = <K_Type extends ItemType, T_Options extends any>(
  theRule: (options: T_Options) => Effect_Options_NoMeta<K_Type>
) => (
  options: T_Options
  // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>;
) => any;

export type MakeDynamicItemEffectInlineFunction = <
  K_Type extends ItemType,
  K_PropName extends PropName<K_Type>,
  T_Options extends any
>(
  theRule: (options: T_Options) => ItemEffect_Options_NoMeta<K_Type, K_PropName>
) => (
  options: T_Options
  // ) => ItemEffect_RuleOptions<
  //   K_Type,
  //   K_PropName,
  //   T_ItemType,
  //   T_State,
  //   T_Refs,
  //   T_StepName
  // >;
) => any;

export function makeEffect<K_Type extends ItemType>(options: Effect_Options_NoMeta<K_Type>): Effect_Options<K_Type> {
  return { ...options, _isPerItem: false };
}

export function makeItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  options: ItemEffect_Options_NoMeta<K_Type, K_PropName>
): ItemEffect_Options<K_Type, K_PropName> {
  return { ...options, _isPerItem: true };
}
//
// // NOTE could make options generic and return that
// // type MakeEffect = <K_Type extends T_ItemType>(options: Effect_RuleOptions<K_Type>) => Effect_RuleOptions<K_Type>;
// type MakeEffect = <K_Type extends T_ItemType>(
//   options: Effect_RuleOptions<K_Type>
// ) => Effect_RuleOptions<K_Type>;
//
// // type MakeItemEffect = <K_Type extends T_ItemType, K_PropName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropName>) => ItemEffect_RuleOptions<K_Type, K_PropName>;
// type MakeItemEffect = <
//   K_Type extends T_ItemType,
//   K_PropName extends PropertyName<K_Type>
// >(
//   options: ItemEffect_RuleOptions<K_Type, K_PropName>
// ) => ItemEffect_RuleOptions<K_Type, K_PropName>;

// type MakeRule_Utils = {
//   itemEffect: MakeItemEffect;
//   effect: MakeEffect;
// };

// TODO
// -------------------------------------------------------
// utils
// -------------------------------------------------------

// Convert an itemEffect callback to a regular effect callback
// NOTE: not typed but only internal
function itemEffectRunToEffectRun<K_Type extends ItemType>({
  type,
  name,
  prop,
  run,
  becomes,
}: {
  type?: K_Type | K_Type[];
  name?: ItemName<K_Type>[];
  prop: AllProps[];
  run: (options: any) => any;
  becomes: ItemEffect_Check_Becomes;
}) {
  const editedItemTypes = asArray(type);
  let allowedNames: { [itemName: string]: boolean } | undefined = undefined;

  if (name) {
    allowedNames = {};
    forEach(name, (loopedItemName) => {
      if (allowedNames) allowedNames[loopedItemName as string] = true;
    });
  }

  return (diffInfo: DiffInfo, frameDuration: number, skipChangeCheck?: boolean) => {
    // if skipChangeCheck is true, it will run the run function regardless of the changes
    if (skipChangeCheck) {
      if (name) {
        forEach(editedItemTypes, (theItemType) => {
          const prevItemsState = getPrevState()[theItemType] as any;
          const itemsState = (getState() as AllState)[theItemType];
          const itemsRefs = getRefs()[theItemType];

          forEach(name, (loopedItemName) => {
            breakableForEach(prop, (thePropertyName) => {
              const newValue = itemsState[loopedItemName][thePropertyName];

              run({
                itemName: name,
                newValue,
                prevValue: prevItemsState[loopedItemName][thePropertyName],
                itemState: itemsState[loopedItemName],
                itemRefs: itemsRefs[loopedItemName],
                frameDuration,
                ranWithoutChange: true,
              });
              return true; // break out of the loop, so it only runs once
            });
          });
        });
      }
      return true; // return early if skipChangeCheck was true
    }

    forEach(editedItemTypes, (theItemType) => {
      const prevItemsState = getPrevState()[theItemType] as any;
      const itemsState = (getState() as AllState)[theItemType];
      const itemsRefs = getRefs()[theItemType];
      forEach(diffInfo.itemsChanged[theItemType], (itemNameThatChanged) => {
        if (!(!allowedNames || (allowedNames && allowedNames[itemNameThatChanged as string]))) return;

        breakableForEach(prop, (thePropertyName) => {
          if (!(diffInfo.propsChangedBool as any)[theItemType][itemNameThatChanged][thePropertyName]) return;

          const newValue = itemsState[itemNameThatChanged][thePropertyName];

          let canRunRun = false;

          if (becomes === undefined) canRunRun = true;
          else if (typeof becomes === "function") {
            canRunRun = becomes(newValue, prevItemsState[itemNameThatChanged][thePropertyName]);
          } else if (becomes === newValue) canRunRun = true;

          if (!canRunRun) return;

          run({
            itemName: itemNameThatChanged,
            newValue,
            prevValue: prevItemsState[itemNameThatChanged][thePropertyName],
            itemState: itemsState[itemNameThatChanged],
            itemRefs: itemsRefs[itemNameThatChanged],
            frameDuration,
            ranWithoutChange: false,
          });
          return true; // break out of the loop, so it only runs once
        });
      });
    });
  };
}

// converts a repond effect to a normalised 'inner effect', where the names are an array instead of one
function effectOneCheckToInnerEffectOneCheck<K_Type extends ItemType>(effectOneCheck: Effect_OneCheck<K_Type>) {
  return {
    names: toSafeArray(effectOneCheck.name),
    types: effectOneCheck.type as InnerEffect_OneCheck<K_Type>["types"],
    props: effectOneCheck.prop,
    addedOrRemoved: effectOneCheck.addedOrRemoved,
  };
}

// converts a effect check to a innerEffect check (where it's an array of checks)
function effectCheckToInnerEffectCheck<K_Type extends ItemType>(effectCheck: Effect_Check<K_Type>) {
  if (Array.isArray(effectCheck)) {
    return effectCheck.map((loopedCheckProperty) => effectOneCheckToInnerEffectOneCheck(loopedCheckProperty));
  }
  return effectOneCheckToInnerEffectOneCheck(effectCheck);
}

// converts a effect to an innerEffect
function convertEffectToInnerEffect<T_EffectOptions extends Effect_Options_NameRequired<any>>(
  effectOptions: T_EffectOptions
): InnerEffect_Loose<ItemType> {
  return {
    check: effectCheckToInnerEffectCheck(effectOptions.check),
    atStepEnd: !!effectOptions.atStepEnd,
    name: effectOptions.name,
    run: effectOptions.run,
    step: effectOptions.step,
  };
}

// --------------------------------------------------------------------
// more utils
// --------------------------------------------------------------------

function normaliseInnerEffectCheck<K_Type extends ItemType>(
  check: InnerEffect_Check<K_Type>
): InnerEffect_OneCheck_MultiItemTypes[] {
  const checksArray = asArray(check);

  return checksArray.map(
    (check) =>
      ({
        types: toSafeArray(check.types),
        names: check.names,
        props: check.props,
        addedOrRemoved: check.addedOrRemoved,
      } as any)
  );
}

function _startInnerEffect<K_Type extends ItemType>(newListener: InnerEffect_Loose<K_Type>) {
  const atStepEnd = !!newListener.atStepEnd;
  const phase: EffectPhase = atStepEnd ? "endOfStep" : "duringStep";

  const editedListener: InnerEffect<K_Type> = {
    name: newListener.name,
    check: normaliseInnerEffectCheck(newListener.check),
    run: newListener.run,
  };
  if (atStepEnd) editedListener.atStepEnd = atStepEnd;
  if (newListener.step) editedListener.step = newListener.step;

  runWhenStartingInnerEffects(() => {
    // add the new innerEffect to all innerEffects and update innerEffectNamesByPhaseByStep

    meta.allInnerEffects[editedListener.name] = editedListener as unknown as UntypedInnerEffect;

    meta.innerEffectNamesByPhaseByStep[phase][editedListener.step ?? "default"] = addItemToUniqueArray(
      meta.innerEffectNamesByPhaseByStep[phase][editedListener.step ?? "default"] ?? [],
      editedListener.name
    );
  });
}

function _stopInnerEffect(effectName: string) {
  runWhenStoppingInnerEffects(() => {
    const theListener = meta.allInnerEffects[effectName];
    if (!theListener) return;
    const atStepEnd = !!theListener.atStepEnd;
    const phase: EffectPhase = atStepEnd ? "endOfStep" : "duringStep";
    const step = theListener.step ?? "default";

    meta.innerEffectNamesByPhaseByStep[phase][step] = removeItemFromArray(
      meta.innerEffectNamesByPhaseByStep[phase][step] ?? [],
      theListener.name
    );

    delete meta.allInnerEffects[effectName];
  });
}

// --------------------------------------------------------------------
// other functions
// --------------------------------------------------------------------

export function startNewEffect<K_Type extends ItemType>(theEffect: Effect_Options_NoMeta<K_Type>) {
  let innerEffectName = theEffect.name || toSafeEffectName("effect");

  // add the required effectName
  const editedEffect = {
    check: theEffect.check,
    name: innerEffectName,
    run: theEffect.run,
    atStepEnd: theEffect.atStepEnd,
    step: theEffect.step,
    runAtStart: theEffect.runAtStart,
  };

  if (theEffect.runAtStart) {
    runWhenDoingInnerEffectsRunAtStart(() => {
      theEffect.run(meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
    });
  }

  _startInnerEffect(convertEffectToInnerEffect(editedEffect) as any);
}

export function startNewItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>({
  check,
  run,
  atStepEnd,
  name,
  step,
  runAtStart,
}: ItemEffect_Options_NoMeta<K_Type, K_PropName>) {
  let effectName = name || "unnamedEffect" + Math.random();

  const editedItemTypes = toSafeArray(check.type);
  const editedPropertyNames = toSafeArray(check.prop);
  const editedItemNames = toSafeArray(check.name);

  let editedCheck = {
    type: editedItemTypes,
    prop: editedPropertyNames,
    name: editedItemNames,
  };

  let runEffect = itemEffectRunToEffectRun({
    type: editedItemTypes,
    name: editedItemNames,
    prop: editedPropertyNames ?? ([] as AllProps[]),
    run: run,
    becomes: check.becomes,
  });

  startNewEffect({
    atStepEnd,
    name: effectName,
    check: editedCheck as any,
    run: runEffect,
    step,
    runAtStart,
  });

  return effectName;
}

export function stopNewEffect(effectName: string) {
  _stopInnerEffect(effectName);
}

// ---------------------------------------------------
// Make Effects
// ---------------------------------------------------

export function startEffect<
  K_EffectGroup extends keyof RefinedGroupedEffects,
  K_EffectName extends keyof RefinedGroupedEffects[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allGroupedEffects as any)[groupName][effectName];
  if (!theEffect) {
    console.warn("no effect found for ", groupName, effectName);
    return;
  }

  if (theEffect._isPerItem) {
    startNewItemEffect(theEffect);
  } else {
    startNewEffect(theEffect);
  }
}

export function stopEffect<
  K_EffectGroup extends keyof RefinedGroupedEffects,
  K_EffectName extends keyof RefinedGroupedEffects[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allGroupedEffects as any)[groupName][effectName];
  if (!theEffect) {
    console.warn("no effect found for ", groupName, effectName);
    return;
  }

  stopNewEffect(theEffect.name);
}

export function startGroupEffects<K_EffectGroup extends keyof RefinedGroupedEffects>(groupName: K_EffectGroup) {
  const theGroup = (meta.allGroupedEffects as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => {
    startEffect(groupName, effectName);
  });
}

export function stopGroupEffects<K_EffectGroup extends keyof RefinedGroupedEffects>(groupName: K_EffectGroup) {
  const theGroup = (meta.allGroupedEffects as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => {
    stopEffect(groupName, effectName);
  });
}

export function startAllGroupedEffects() {
  forEach(Object.keys(meta.allGroupedEffects), (groupName) => {
    startGroupEffects(groupName);
  });
}

export function stopAllGroupedEffects() {
  forEach(Object.keys(meta.allGroupedEffects), (groupName) => {
    stopGroupEffects(groupName);
  });
}

export function runEffect<
  K_EffectGroup extends keyof RefinedGroupedEffects,
  K_EffectName extends keyof RefinedGroupedEffects[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allGroupedEffects as any)[groupName][effectName];
  if (!theEffect) {
    console.warn("no effect found for ", groupName, effectName);
    return;
  }

  if (theEffect._isPerItem) {
    // Run the item rule for each item (and prop)
    const itemType = theEffect.check.type as ItemType;
    const itemNames = meta.itemNamesByItemType[itemType as string];
    const propNames = toSafeArray(theEffect.check.prop) ?? [];
    const itemsState = (getState() as AllState)[itemType];
    const prevItemsState = (getPrevState() as AllState)[itemType];
    const itemsRefs = (getRefs() as AllState)[itemType];
    forEach(itemNames, (itemName) => {
      forEach(propNames, (propName) => {
        const newValue = itemsState[itemName][propName];
        theEffect.run({
          itemName: itemName as any,
          newValue,
          prevValue: prevItemsState[itemName][propName],
          itemState: itemsState[itemName],
          itemRefs: itemsRefs[itemName],
          frameDuration: 16.66666,
          ranWithoutChange: true,
        });
      });
    });
  } else {
    // Run the rule once
    theEffect.run(meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
  }
}

export function runGroupEffects<K_EffectGroup extends keyof RefinedGroupedEffects>(groupName: K_EffectGroup) {
  const theGroup = (meta.allGroupedEffects as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => {
    runEffect(groupName, effectName);
  });
}

export function makeEffects<K_EffectName extends string, K_EffectGroupName extends string>(
  rulesToAdd: (arg0: { itemEffect: MakeItemEffect; effect: MakeEffect }) => // ) => Record<K_RuleName, MakeRule_Rule >
  Record<K_EffectName, MakeRule_Rule>
) {
  return rulesToAdd({ itemEffect: makeItemEffect, effect: makeEffect });
}

export function initGroupedEffects<T extends Record<string, ReturnType<typeof makeEffects>>>(groups: T): T {
  const transformedGroups: Record<string, ReturnType<typeof makeEffects>> = {};

  Object.entries(groups).forEach(([key, value]) => {
    // Remove "Effects" from the key, if present
    const newKey = key.replace("Effects", "");
    transformedGroups[newKey] = value;
  });

  const groupNames = Object.keys(transformedGroups);

  // loop through the groups and rename the effects
  forEach(groupNames, (groupName) => {
    const theGroup = transformedGroups[groupName];
    const effectNames = Object.keys(theGroup);
    forEach(effectNames, (effectName) => {
      const theEffect = theGroup[effectName];
      theEffect.name = `${groupName}_${effectName}`;
    });
  });

  // Store the transformed groups
  meta.allGroupedEffects = transformedGroups as any;

  return groups;
}
