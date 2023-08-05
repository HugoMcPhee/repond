TODO

- support nullable types with strictNullchecks
- type "becomes" to the property value
- maybe a way to type rule objects without starting (like itemEffect() as an import?)

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
- some stability stuff resetting recorded-derive-changes and returning early running a flow

v0.4.9

- fixes makeRules stop rule :)

v0.4.8

- allows more think listeners to run in a row
- itemEffects only run once for multiple propties checked
- think and draw listener types renamed to derive and subscribe to make more sense :)
- added onNextTick to run something before the first flow runs in the next frame

v0.4.7

- changes since the last frame are checked in the first flows think listeners :)

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
added 'flows' so rules can run in a specific order

- now rules can be run in an order,
- it can be useful for making sure derived state's figured out that's needed for next rules

v0.21
gives itemName to defaultState if it's needed

v0.201
allows up to 11 derivers to run (maybe not needed ??)

v0.20
simplified making item types to { state, scraps, startStates (optional) }

v0.19
scraps get removed automatically after at the end of updateConcepto
based on the removed items diffInfo
So now scraps would get removed from external state changes (might need to do the same for added too)

v0.18
simplified option names for add and remove item

v.0.17
simplified a bunch of types (mostly in createStateland) and removed withStateland (HOC)

v.0.16
added basic version of useStatelandItem

v.0.15
changed paths to use libraries/shutils

v0.14
allowed any return type from useConcepto
added random number to ruleNames in useStatelandItemEffect

v0.13
removed import cycles from index and createStateland

v0.12
added way to react to multiple prop changes for an item with one hook
(useStatelandItemEffect ---- probably renaming)

v0.11
made movers simpler to set up

v0.1
first version
