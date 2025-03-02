TODO

- support nullable types with strictNullchecks
- type "becomes" to the property value
- maybe a way to type effect objects without starting (exporting makeEffect)
- add runOnNewItems option to effects, its like run at start, but only when an item is added
  - hopefully this means the effect will run when loading state from localstorage
- look into addItem doing a setState if the item was already added
- clean up the code a bit
- maybe support starting param effects with group.name instead of seperate params
- maybe remove "getUsefulParams" from prendy effect makers
- maybe use "group.name" to reference param effects, although it usually also stores group with params, so might be difficult

v1.2.4

- Don't add prevState in addItem, but fix issue with prevState not being set for added items (in copyChangedState)

v1.2.3

- Add prevState in addItem

v1.2.2

- fix getPartialState and avoid errors when getting a propId that doesn't exist

v1.2.1

- Fix types
- Only copy properties that were changed when copying to prevState
- use propIds "store.prop" for getPartialState

v1.2.0
Huge performance improvements!
it only loops changed items/things in most places now
for copying state to prevState, updating diffInfo, and clearing recordedChanges
This means that even with many items, it wont increase cpu usage! (battery was still draining after 1.1.0 )

v1.1.0

- Better battery life!
- WIP Check way less Effects per frame
  - it used to check all effects every frame, but now it stores which effects to run based on what props were set in setState

v1.0.0

- simpler everything version 1.0.0!
- setState is now like setState("type.prop", itemId, value)
  - probably faster since it doesn't need to loop through all types, ids and props for each setState
- getState is now like getState("type", itemId?) , no itemId returns the first item
- effects now use a "changes" option which is a list of ["type.prop"]
- itemEffects and effects are now the same thing, with an extra isPerItem option (defaults to true)
- the "run" function is the same for both, like run(itemId, diffInfo, frameDuration, ranWithoutChange)
- itemId is blank if it's not a per item effect
- defining items now takes two options newState and newRefs, startStates is replaced with adding items manually with addItem("type", itemId, newState, newRefs)
  - itemIds are typed as strings now, which aligns more with being able to add and remove items at runTime ( simplifying types code, maybe Id types could be added later without inferring from startStates
    )

v0.17.5

- removed log from getStatesDiff

v0.17.4

- renamed getStatePathState to getStateAtPath
- updated StatePath type to have one generic parameter

v0.17.3

- added getStatePathState to get a state from a path (array of [itemType, itemId, propName])
- added StatePath type (might be able to simplify to have one generic type param)

v0.17.2

- Handle reacting to deleted items
- remove warning when trying to stop a apram effect that doesn't exist

v0.17.1

- Fix item effects on react native hermes

v0.17.0

- add helpers getPartialState and applyState, for helping with saving and loading state
- add meta property didInit to know if the stores have been initialised

v0.16.0

- Rename state and refs to getDefaultState and getDefaultRefs
- Default frameRate option is full, since there may need to be more to make auto work well
- Supports naming stores with a "Store" suffix, and effects will properly only remove the "Effects"/"ParamEffects" suffix if its at the end of the name
- removed the need to have a factory to support copyStates, getStatesDiff and mergeStates
- fixed getStatesDiff to fix patch and diff functions
- exports ItemType as a helper type

v0.15.1

- Fix getItemWillBeAdded and getItemWillBeRemoved not clearing after item's are added/removed
- fix getItemWillBeRemoved not detecting already removed items

v0.15.0

- New added items now run effects if their props changes from the default props
- added new functions getItemWillBeAdded, getItemWillBeRemoved, getItemWillExist to know if an item will be added, removed or exist in the next state, to be able to setState instead of adding an item if it already exists
- fixed ParamEffects names not having "ParamEffects" removed from the name

v0.14.3

- Fix exporting Param effects stuff from index
- Fix returning void instead of undefined in makeAndStoreParamEffectsForGroup
- Fix importing repondMeta consistently (before it was sometimes coming form src instead of dist)

v0.14.0

- Update dynamic rules to paramEffects
- Update rule makers to effect makers
- Reorganise some files
- Rename GroupedEffects to EffectGroups

v0.13.0 Simpler ids and types

- Rename "name" to "id" for items
- and make simpler types
- and rename effects to be 3 things
  - effects, easy effects and item effects
- and simplify some effects logic

v0.12.0

- Rename Listeners/Effects/Rules to simplified effects and inner effects
  - And add new helpers for effects
- register grouped effects to meta, so they can be run with runEffect(”shared”, “ruleName”)
- rename the runAtStart parameter provided to effects to something like ranWithoutChange, to know the prev and current state are the same
- update repond to pass ranWithoutChange true if the effect is run with runEffect
- organise exported functions and types to new files
- Simplify all types to not need global types as generic parameters

v0.11.2

- fix issue with runAtStart when adding a new item (runAtStart runs at a predictable time now)

v0.11.0

- added runAtStart for some hooks and startEffect, to allow running the effect/listener callback when it's first added
- NOTE TODO may add the same option to rules too

v0.10.9

- useStoreItem properly returns new state if hookDeps or the item name changes

v0.10.0

- exports all helpers from index, no need to get heleprs from makePrendy helpers!
- renamed createStoreHelpers to initRepond
- exports useful types directly
- NOTE need to edit tsconfig in projects using repond to get the full types now

v0.9.2

- added helpers to make easier switch-like rules with makeRuleMaker, makeNestedRuleMaker, makeNestedLeaveRuleMaker NOTE if it's too much, they could be made with a seperate rules helper that takes setState and makeRule etc as parameters
- now state properties can be typed based on the item name (from startStates), like a model.animationWeights object can have the correct animation names as keys for that object, before it would combine all the animation names from all the models
- added "run" and "runAll" to rules objects to run a rule as a manual action, good as a start to being able to run all rules on initial state :)
- fixed rule names for rules objects not being typed
- supports returning early from setState functions

v0.9.1

- renamed to repond and updated names to match

v0.9

- updated chootils to 0.3.7
- big change to reduce garbage collection
- uses less arrow functions with forEach functions, and uses for loops
- recycles objects alot, and dosen't check Object.keys every time
- added ability to set to half framerate, to help games not stutter and use less power
- an "auto" framerate mode's included to half the framerate if it's skipping many frames
-

v0.8.4

- added patch functions back again types are still working

v0.8.3

- reverted callback functions in makeRules to be part of one object, so dynamic rules use the same options object (because dynamic rules return an object, so it can't return two parameters)
- before: effect(callback, {check:{prop: "propName"}}
- after: effect({run: callback, check:{prop: "propName"}}
- added support for new syntax for dynamic rules

v0.8.0

- added a simpler syntax for adding rules,
- phase changed to atStepEnd
- rule effect functions are their own parameter like useEffect
- e.g addEffect(callback, {check:{prop: "propName"}}
- addItemEffect and addEffect renamed to itemEffect and effect, + provided as named properties in an object instead of two parameters
- renamed some places from think/draw to derive/subscribe

v0.7.0

- - lots of name updates -
- updated rule property names
- updated names to use 'pietem'
- changed "becomes" prop to support checking new value directly
- renamed flows to steps, and whenToRun/listenerType to phase
- renamed createConcepts to createStoreHelpers

v0.6.3

- renamed pietem

v0.6.2

- fixes addItem not working from an undefiend object error
- removes "used random name" log for listenres

v0.6.1

- replaces shutils with renamed chootils
- publishing to npm

v0.6.0

- changed mergeStates and getStatesDiff to use loops instead of function strings , small perforamnce boost
- kept copyStates as a function string becuase it's faster
- changed callForwards to be combined with callbacks, so onNextTick runs the the end of the current frame, instead of the start of the next frame
- getStatesDiff now checks for more specific changes, like checking [itemType][name][propertyName] together instead of [propertyName]

v0.5.9

- type fixes
- adds already built package

v0.5.7

- renamed concep

v0.5.4

- temporarily removed patch and diff functions so typescript doesn't get the "the inferred type of this node exceed the maximum length" error for \_createConcepts

v0.5.0

- moving to package :)

v0.4.10

- organising
- some stability stuff resetting recorded-derive-changes and returning early running a step

v0.4.9

- fixes makeRules stop rule :)

v0.4.8

- allows more think listeners to run in a row
- itemEffects only run once for multiple propties checked
- think and draw listener types renamed to derive and subscribe to make more sense :)
- added onNextTick to run something before the first step runs in the next frame

v0.4.7

- changes since the last frame are checked in the first steps think listeners :)

v0.4.6

- simplifying code
- uses new names "effect" and "itemEffect" for added listeners/rules

v0.4.5

- simplifying code
- derivers and subscribers are now called "think listeners" and "draw listeners"
- removing maybe unused propertyPriorities

v0.4.4

- fixes initialState in refs

v0.4.3

- rulename uses random number for more hooks

v0.4.2

- removes some eslint warnings

v0.4.1

- uses safe item names when getting default properties (prevents breaking state/scraps that rely on specific itemNames)

v0.4.0

- renamed scraps to refs
- renamed library to 'concepto' for expressing concepts

v0.3.0

- added patches and (two way) diffs
- added type for itemName for rules
- added hookDeps to stateland hooks so they can update useEffect

v0.26

- removed diffObject (diffInfo's there)

v0.24 v0.2.5

- simplified more types and names

v0.23
supports typed itemNames!

- moved more types to createStateland
- simplified types and names

v0.22
added 'steps' so rules can run in a specific order

- now rules can be run in an order,
- it can be useful for making sure derived state's figured out that's needed for next rules

v0.21
gives itemName to defaultState if it's needed

v0.201
allows up to 11 derivers to run (maybe not needed ??)

v0.20
simplified making item types to { state, refs, startStates (optional) }

v0.19
refs get removed automatically after at the end of updateRepond
based on the removed items diffInfo
So now refs would get removed from external state changes (might need to do the same for added too)

v0.18
simplified option names for add and remove item

v.0.17
simplified a bunch of types (mostly in create) and removed withStateland (HOC)

v.0.16
added basic version of useStoreItem

v.0.15
changed paths to use libraries/shutils

v0.14
allowed any return type from useConcepto
added random number to ruleNames in useStoreItemEffect

v0.13
removed import cycles from index and create

v0.12
added way to react to multiple prop changes for an item with one hook
(useStoreItemEffect ---- probably renaming)

v0.11
made movers simpler to set up

v0.1
first version
