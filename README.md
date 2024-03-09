Repond

Respond fast to item states

State:

- State is made of of itemTypes with items with properties
- ItemTypes are sometimes referred to as 'stores'

Effects:

- React to state changes

Hooks

- Update components with state changes

# More

### Set state run order

Every setState is queued and runs when the frame runs,
Later setStates will overwrite earlier ones,
But running setState inside an effect will run it during that step, instead of the next frame
So set states can be in a specific order

# Step phases

### 'Step' Effects

- Run in a loop, until no state changes are made
- Good for editing the state or updating derived state
- When effect.atStepEnd is false or undefined

### 'StepEnd' Effects

- Run once after all the stepEffects
- Good for running effects that need to know the final state of that step
- When effect.atStepEnd is true or undefined
