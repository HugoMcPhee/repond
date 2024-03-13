# Repond

Respond fast to item states

### State:

- State is made of of itemTypes (stores) with items with properties

### Effects:

- React to state changes

### Hooks

- Update components with state changes

## Effects

### How to use

Effects can be made in three main ways

**1. Declarative**

- with makeEffects(EffectMap) + initEffectGroups - for static effects that can be started and stopped, thi sis the most common way
- with makeParamEffects + initParamEffectGroups - for making a group of effects that can differ based on parameters, for example effects that listen to changes from both a parent and a child item, where the parent and child ids can change
- Note the "id" prop is overwritten for the declarative ways of making effects, since the id is created from the groupName + effect name (+ params for paramEffects)

  **2. Imperative**

- with startNewEffect(Effect) - for runtime decided effects, these are good for temporary listeners, like a listener that listens to a child item, and is removed when the child is removed

  **3. React**

  - with useStoreEffect or useStoreItemEffect - for making effects that are tied to a component, and are removed when the component is removed
  - there are others hooks for getting state like useStore and useStoreItem, which make an effect that returns the state

## More

### Set state run order

Every setState is queued and runs when the frame runs,
Later setStates will overwrite earlier ones,
But running setState inside an effect will run it during that step, instead of the next frame
So set states can be in a specific order

### Step phases

#### 'Step' Effects

- Run in a loop, until no state changes are made
- Good for editing the state or updating derived state
- Runs here if `effect.atStepEnd` is false

#### 'StepEnd' Effects

- Run once after all the stepEffects
- Good for running effects that need to know the final state of that step
- Runs here if `effect.atStepEnd` is true
