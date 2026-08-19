/* 
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -------------------------------------------------------
 * Coding Basics – Variables, Datatypes, Arrays & Comments 
 * -------------------------------------------------------
 * 
 * This file is an example of how to use variables, datatypes and arrays in javascript. 
 * It is not meant to be a complete sketch, but rather a starting point for you to experiment with these concepts.
 * 
 * A variable is a named storage for data that can be changed during program execution.
 * const are variables that cannot be changed after assigned to a value and its datatype is static and cannot be changed
 * let are variables that can be reassigned a value and its datatype is static and cannot be changed.
 * var are variables that can be reassigned a value and its datatype is flexible. outdated, avoid using var in modern javascript
 * 
 * A datatype is a classification of data that tells the computer how to interpret and use it. 
 * Common datatypes include numbers, strings, booleans, and arrays.
 * 
 * An array is a collection of data in an ordered list.
 * It can hold multiple values of the same or different datatypes.
 * Each entry can be accessed by an index.
 * 
 * What this file does:
 * - It declares variables of different datatypes (number, string, boolean, array).
 * - It outputs the values of these variables to the console.
 */




// Variables
// const = variables that cannot be changed after assigned to a value
// and its datatype is static and cannot be changed
const fixedValue = 0;

// let = variables that can be reassigned a value
// and its datatype is static and cannot be changed.
let dynamicValue = 0; 

// var = variables that can be reassigned a value
// and its datatype is flexible. outdated, avoid using var in modern javascript
var legacyVariable = 0;




// Datatypes: number, string, boolean, array
const numberValue = 42; 
const textValue = "hello";
const booleanValue = true; 
const arrayValue = [1, 2, 3];

const nullValue = null; // null is a special value that represents the absence of any value or object. It is often used to indicate that a variable has no value or that an object reference is empty. null is a primitive value in JavaScript and is considered falsy, meaning it evaluates to false in a boolean context. It is important to note that null is different from undefined, which represents a variable that has been declared but has not been assigned a value.
let undefinedValue; // undefined is a special value that represents the absence of a value or an uninitialized variable. It is the default value of variables that have been declared but not assigned a value. undefined is a primitive value in JavaScript and is considered falsy, meaning it evaluates to false in a boolean context. It is important to note that undefined is different from null, which represents the intentional absence of any object value.

// output the values to the console
console.log("This is a number:", numberValue);
console.log("This is a string:", textValue);
console.log("This is a boolean:", booleanValue);
console.log("This is an array:", arrayValue);
console.log("This is null:", nullValue);
console.log("This is undefined:", undefinedValue);




// Comments are notes in the code that are ignored by the computer and are used to explain the code to readers.

// Single-line comment example.

/*
 * Multi-line comment example.
 */

