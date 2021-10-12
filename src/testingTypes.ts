const tempDefaultExport = "deault";
export default tempDefaultExport;

// import { XOR } from "./types";
// import { forEach } from "shutils/dist/loops";
//
// type NameOptionsBySpecies = {
//   dog: { poodle: true; chiwawa: true };
//   cat: { kitten: true; tabby: true };
//   pig: { pink: true; brown: true };
// };
//
// type Species = "dog" | "cat" | "pig";
// type Animal<T_Species extends keyof NameOptionsBySpecies> = {
//   [K in T_Species]: {
//     species: K;
//     givenName: keyof NameOptionsBySpecies[K];
//     age: number;
//   };
// }[T_Species];
//
// const animal: Animal<Species> = {
//   species: "cat",
//   age: 10,
//   givenName: "kitten",
// };
//
// type MakeAnimalOptions<K_Species extends Species> = {
//   species: K_Species;
//   givenName: keyof NameOptionsBySpecies[K_Species];
//   age: number;
// };
//
// function makeAnimal<K_Species extends Species>(
//   animal: MakeAnimalOptions<K_Species>
// ) {}
//
// makeAnimal({ species: "cat", age: 10, givenName: "kitten" });
//
// function makeAnimalInlineFunction<
//   K_Species extends Species,
//   T_Options extends any
// >(animalFunction: (options: T_Options) => MakeAnimalOptions<K_Species>) {
//   // return animalFunction as (options: T_Options) => MakeAnimalOptions<any>;
//
//   return animalFunction;
// }
//
// type AnimalFunction = {
//   [K_Species in Species]: MakeAnimalOptions<K_Species>;
// }[Species];
//
// function makeAnimals<
//   K_RuleName extends string,
//   T_ReturnAnimalFunction extends (...args: any) => AnimalFunction,
//   T_RulesToAdd = Record<K_RuleName, T_ReturnAnimalFunction>
// >(
//   rulesToAdd: (makeRuleTyped: typeof makeAnimalInlineFunction) => T_RulesToAdd
// ) {
//   const allRules = rulesToAdd(makeAnimalInlineFunction);
//
//   const ruleNames = Object.keys(allRules) as K_RuleName[];
//
//   type ParametersB<T extends (options: any) => any> = T extends (
//     options: infer P
//   ) => any
//     ? P
//     : never;
//
//   function start<K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(
//     ruleName: K_ChosenRuleName,
//     // @ts-ignore
//     options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]
//   ) {}
//
//   function stop<K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(
//     ruleName: K_ChosenRuleName,
//     // @ts-ignore
//     options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]
//   ) {}
//   // forEach(ruleNames, ruleName => {});
//
//   //  return rulesToAdd(makeAnimalInlineFunction);
//   return { start, stop };
// }
//
// const animalRules = makeAnimals((make) => ({
//   hello: make(({ theAge }: { theAge: number }) => ({
//     age: theAge,
//     species: "cat",
//     givenName: "kitten",
//   })),
//   helloB: make(({ halfOfAge }: { halfOfAge: number }) => ({
//     age: halfOfAge,
//     species: "dog",
//     givenName: "chiwawa",
//   })),
// }));
//
// // animalRules.hello({ theAge: 10 });
// // animalRules.helloB({ halfOfAge: 50 });
// animalRules.start("hello", { theAge: 10 });
// animalRules.start("helloB", { halfOfAge: 10 });
// animalRules.start("hello", { theAge: 10 });
//
// animalRules.stop("hello", { theAge: 9 });
//
// // --------------------------------------------
//
// type FruitTypeName = "apple" | "pear" | "mango";
//
// const fruitsWithProperties = {
//   apple: {
//     appleString: "hello",
//     appleNumber: 10,
//     appleBool: true,
//   },
//   pear: {
//     pearString: "hello",
//     pearNumber: 10,
//     pearBool: true,
//   },
//   mango: {
//     mangoString: "hello",
//     mangoNumber: 10,
//     mangoBool: true,
//   },
// };
//
// type FruitPropertyName<
//   T_FruitName extends FruitTypeName
// > = keyof typeof fruitsWithProperties[T_FruitName];
//
// type FruitPropertyType<
//   K_FruitProperty extends keyof typeof fruitsWithProperties[T_FruitName],
//   T_FruitName extends FruitTypeName
// > = typeof fruitsWithProperties[T_FruitName][K_FruitProperty];
//
// type CallbackForFruitProperty<
//   K_FruitProperty extends keyof typeof fruitsWithProperties[T_FruitName],
//   T_FruitName extends FruitTypeName
// > = (
//   propertyName: K_FruitProperty,
//   propertyType: FruitPropertyType<K_FruitProperty, T_FruitName>
// ) => void;
//
// const testFruitProperty: FruitPropertyName<"apple"> = "appleBool";
//
// function testUseFruitItemEffect<T_FruitTypeName extends FruitTypeName>(
//   options: {
//     type: T_FruitTypeName;
//   },
//   propertyFunctions: Partial<
//     {
//       [K in FruitPropertyName<T_FruitTypeName>]: CallbackForFruitProperty<
//         K,
//         T_FruitTypeName
//       >;
//     }
//   >
// ) {}
//
// testUseFruitItemEffect(
//   { type: "apple" },
//   {
//     appleBool: (theName, theType) => {
//       // theName;
//       // theType;
//     },
//     appleNumber: (theName, theType) => {
//       // theName;
//       // theType;
//     },
//   }
// );
//
// function makeFunctionWithString<T_Array extends Readonly<string[]>>(
//   theParam: T_Array
// ) {
//   type T_AString = T_Array[number] | "default";
//
//   function functionWithString(theString: T_AString) {}
//
//   return { functionWithString };
// }
//
// const { functionWithString } = makeFunctionWithString([
//   "hello",
//   "two",
// ] as const);
// functionWithString("default");
//
// // type TwoRecords =
// //   | Record<"propertyA", "valueA">
// //   | (Record<"propertyA", "valueA"> & Record<"propertyB", "valueB">);
// //
// // const twoRecorsTest: TwoRecords = {
// //   propertyA: "valueA",
// //   propertyB: "valueB",
// // };
// // K_Name_A, MakeAnimalOptions<K_Value_A>
// //
// // type RecordB<
// //   T_AllKeys extends keyof any,
// //   T_Object,
// //   K_KnownKey extends string
// // > = {
// //   [K_KnownKey in T_AllKeys]: T_Object;
// // };
// //
// // function testGenericObjectWithValues<
// //   T_AllKeys extends any,
// //   K_Name_A extends string,
// //   K_Value_A extends Species,
// //   T_Mapped_A =
// // >(options: RecordB<T_AllKeys, MakeAnimalOptions<K_Value_A>, K_Name_A>) {
// //   const allKeys = Object.keys(options) as (K_Name_A)[];
// //
// //   return {
// //     allKeys,
// //   };
// // }
// //
// // testGenericObjectWithValues({
// //   hello: { age: 10, species: "cat", givenName: "kitten" },
// // });
// //
// // function makeAnimalsNoHelper<
// //   K_RuleName_A extends string,
// //   K_Species_A extends Species
// // >(rulesToAdd: { [K_RuleName]: MakeAnimalOptions<Species> }) {}
// //
// // makeAnimalsNoHelper({
// //   hello: { age: 10, species: "cat", givenName: "kitten" },
// // });
