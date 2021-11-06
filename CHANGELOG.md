TODO

- support nullable types with strictNullchecks

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
