/*
 * Nested Array Examiner Module
 *
 * PUBLIC METHODS
 *
 * - get all primitive values and their level of nesting in a nested array
 * - returns a single string with all of the array data
 *
 *       window.ArrayInfo.getValues(givenArray)
 *
 * - get the source used to declare the array (see warnings below)
 * - returns the source as a string
 *
 *       window.ArrayInfo.getSource(givenArray)
 *
 * - rebuild the original array after using the getSource() function
 * - returns a fully cloned copy of the original array
 *
 *       window.arrayInfo.rebuildOriginalArray()
 *
 * PUBLIC PROPERTIES
 *
 *       All properties are set by the getSource() function.
 *
 * - tell whether or not the source can be used to clone the array
 *
 *       window.ArrayInfo.canUseSourceToCloneArray
 *
 * - tell how many levels of nesting an array has
 *
 *       window.ArrayInfo.nestedArrayLevels
 *
 * WARNING: When getting the source for a nested array, the original array is 
 *          emptied. This can be addressed by rebuilding the original array 
 *          with the rebuildOriginalArray() function.
 *
 *          Objects and functions are not displayed and any array with a 
 *          function or object element cannot be cloned with the source.
 */
 
var ArrayInfo = ArrayInfo || {};

ArrayInfo = (function(arrayInfo)
{
    "use strict";
    
    // used to rebuild original array after getSource function 
    
    var arrayQueue;
    var levelQueue;
    
    // tight augmentation to keep code from being accidentally overwritten
    
    if (arrayInfo.getValues)
    {
        arrayInfo.oldGetValues = arrayInfo.getValues;
        window.console.warn("saved original ArrayInfo getValues() as oldGetValues()");
    }
    
    if (arrayInfo.getSource)
    {
        arrayInfo.oldGetSource = arrayInfo.getSource;
        window.console.warn("saved original ArrayInfo getSource() as oldGetSource()");
    }
    
    arrayInfo.canUseSourceToCloneArray = false;
        
    /*
     * Display each primitive value and its nesting level for an array.
     * Objects and arrays as elements are not displayed.
     *
     * This function returns a single string with all of the array data.
     *
     * This function is not recursive. It uses stacks and queues.
     */
     
    arrayInfo.getValues = function(givenArray)
    {
        var len = givenArray.length;
        var queue = [];
        var currentArray = [];
        var val;
        var arrayLevels = [1];
        var arrayLevel;
        var allValues = "";

        if (Array.isArray(givenArray) && len > 0)
        {
            queue.push(givenArray);
        }

        // use first in, first out (FIFO) queue to store
        // array elements that are themselves arrays

        while (queue.length > 0)
        {
            currentArray = queue.shift();
            len = currentArray.length;
            arrayLevel = arrayLevels.shift();
    
            for (var i = 0; i < len; i++)
            {
                val = currentArray[i];
    
                if (Array.isArray(val))
                {
                    queue.push(val);
                    arrayLevels.push(arrayLevel + 1);
                }
                else
                {
                    if (typeof val === "function")
                    {
                        val = "<function()>";
                    }
                    else if (typeof val === "object")
                    {
                        val = "{object}";
                    }
                    
                    allValues += "array element level, value: " + arrayLevel + "," + val + "\n";
                }
            }
        }
        
        return allValues;
    }
    
    /*
     * Rebuild an array after using the getSource() function.
     * 
     * This function can only be used after using getSource() but 
     * it can be used repeatedly to rebuild the original array.
     *
     * All original functions and objects are included.
     * 
     * arrayQueue and levelQueue are built by getSource() and 
     * they're rebuilt every time this function is used
     *
     * The arrayQueue data structure contains array fragments 
     * for a single level of nesting. The array fragment either 
     * ends with an empty array to hold a nested array element 
     * or it's a complete subarray with no nesting.
     * 
     * This function is not recursive. It uses stacks and queues.
     */
    
    arrayInfo.rebuildOriginalArray = function()
    {
        var original = [];
        var insertionLevel;
        
        var currentArray;
        var workingArrayStack = [];
        var workingLevelStack = [];
        var workingArray;
        var workingArray2;
        var workingLevel2;
        var val, isValArray;
        var level, len, i;
        var foundValArray;
        
        // save queues so the original array can be rebuilt any number of times
        
        var saveArrayQueue = [];
        var saveLevelQueue = [];
        var cleanArray;
      
        if (!arrayQueue || arrayQueue.length === 0 || !levelQueue || levelQueue.length === 0)
        {
            return [];
        }
        
        while (arrayQueue.length > 0)
        {        
            currentArray = arrayQueue.shift();
            level = levelQueue.shift();        

            len = currentArray.length;
            foundValArray = false;
            workingArray = [];
            cleanArray = [];
            
            for (i = 0; i < len; i++)
            {
                val = currentArray[i];
                isValArray = Array.isArray(val);
                
                workingArray.push(val);
                
                if (isValArray)
                {
                    cleanArray.push([]);
                }
                else
                {
                    cleanArray.push(val);
                }
                
                if (isValArray)
                {
                    foundValArray = true;
                }
            }
            
            saveArrayQueue.push(cleanArray);
            saveLevelQueue.push(level);
                
            // there should always be only one element that's an array
            // and initially, that array will always be an empty placeholder
            // the nested array will always be the last element for the 
            // current array
            
            if (foundValArray)
            {
                workingArrayStack.push(workingArray);
                workingLevelStack.push(level);
            }
            
            // when previous nested array was found but current
            // array is not nested, found a non-nested subarray 
            // to finish current working array
            
            if (!foundValArray)
            {
                if (workingArrayStack.length === 0)
                {
                    if (level === 1)
                    {
                        for (i = 0; i < workingArray.length; i++)
                        {
                            original.push(workingArray[i]);
                        }
                    }
                    else
                    {
                        // set up nested array for insertion at the proper level
                    
                        insertionLevel = original;
                    
                        for (i = 2; i <= level; i++)
                        {
                            len = insertionLevel.length;
                            insertionLevel = insertionLevel[len-1];
                        }
                    
                        for (i = 0; i < workingArray.length; i++)
                        {
                            insertionLevel.push(workingArray[i]);
                        }
                    }
                }
                else
                {
                    while (workingArrayStack.length > 0)
                    {                    
                        workingLevel2 = workingLevelStack.pop();
                        workingArray2 = workingArrayStack.pop();
                    
                        len = workingArray2.length;
                    
                        if (workingLevel2 === 1)
                        {
                            // get all except last element, which is a nested array
                            
                            for (i = 0; i < len; i++)
                            {
                                original.push(workingArray2[i]);
                            }
                            
                            len = original.length;
                        
                            // do the last element now -> nested array
                            
                            for (i = 0; i < workingArray.length; i++)
                            {
                                original[len-1].push(workingArray[i]);
                            }
                        }
                        else
                        {
                            for (i = 0; i < workingArray.length; i++)
                            {
                                workingArray2[len-1].push(workingArray[i]);
                            }
                            
                            workingArray = workingArray2;
                            
                            // need to append here if working array stack is empty
                            
                            if (workingArrayStack.length === 0)
                            {
                                len = original.length;
                                
                                for (i = 0; i < workingArray.length; i++)
                                {
                                    original[len-1].push(workingArray[i]);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        arrayQueue = saveArrayQueue;
        levelQueue = saveLevelQueue;
        
        return original;
    }

    /*
     * Get the source for an array.
     *
     * This function destroys the original array if it's nested but 
     * data structures are created so that the original array can 
     * be rebuilt using the rebuildOriginalArray() function.
     *
     * This function is not recursive. It uses stacks and queues.
     */
     
    arrayInfo.getSource = function(givenArray)
    {
        var len = givenArray.length;
        var currentArray;
        
        // keep track of source levels with stacks
        
        var stack = [];
        var originalLevelStack = [];
        var originalLevel = 1;
        var maxLevel = 0;
        
        // keep track of original array with queues
        
        var originalArrayQueue = [];
        var originalLevelQueue = [];
        var arrayElement = [];

        var nestEndCount = 0;
        var i, val;
        var allValues = "[";
        var foundObjectOrFunction = false;
        
        arrayInfo.rebuiltArray = [];

        if (Array.isArray(givenArray) && len > 0)
        {
            stack.push(givenArray);
            originalLevelStack.push(originalLevel);
            arrayInfo.canUseSourceToCloneArray = true;
            maxLevel = 1;
        }
        
        // use last in, first out (LIFO) stack to store partial arrays

        while (stack.length > 0)
        {
            currentArray = stack.pop();
            len = currentArray.length;
            originalLevel = originalLevelStack.pop();
            
            for (i = 0; i < len; i++)
            {
                val = currentArray[i];
                
                if (Array.isArray(val))
                {
                    arrayElement.push([]);            
                    currentArray.splice(0, (i + 1));
                    
                    // push remainder of current array onto stack first
                    // push current array element on stack next to process it next
                    
                    if (currentArray.length > 0)
                    {
                        stack.push(currentArray);
                        originalLevelStack.push(originalLevel);
                    }
                    
                    stack.push(val);
                    originalLevelStack.push(originalLevel + 1);
            
                    allValues += "[";
                    
                    // keep track of nesting levels for 
                    // case of last element being an array
                    // need to add closing "]" for each level
                    
                    if (i === (len - 1))
                    {
                        nestEndCount += 1;
                    }
                    
                    break;
                }
                else
                {                
                    arrayElement.push(val);
                    
                    allValues = processValueForSource(allValues, val, (i < (len - 1)), stack.length, nestEndCount);
                    
                    if (i === (len - 1))
                    {
                        nestEndCount = 0;
                    }
                }
            }
            
            if (originalLevel > maxLevel)
            {
                maxLevel = originalLevel;
            }
            
            originalLevelQueue.push(originalLevel);
            originalArrayQueue.push(arrayElement);
            arrayElement = [];
        }
        
        arrayQueue = originalArrayQueue;
        levelQueue = originalLevelQueue;
        
        arrayInfo.nestedArrayLevels = maxLevel;
        
        return allValues;
    }

    function processValueForSource(allValues, val, notLastElement, stackLength, nestEndCount)
    {
        if (typeof val === "function")
        {
            val = "\"<function()>\"";
            arrayInfo.canUseSourceToCloneArray = false;
        }
        else if (typeof val === "object")
        {
            val = "\"{object}\"";
            arrayInfo.canUseSourceToCloneArray = false;
        }
        else if (typeof val === "string")
        {
            val = "\"" + val + "\"";
        }

        allValues += val;
                    
        if (notLastElement)
        {
            allValues += ",";
        }
        else
        {
            // add closing "]" for each nesting level
            // when last element is an array
                    
            for (var j = 0; j < nestEndCount; j++)
            {
                allValues += "]";
            }
                    
            if (stackLength > 0)
            {
                allValues += "],";
            }
            else
            {
                allValues += "]";
            }
        }
    
        return allValues;
    }
    
    return arrayInfo;
    
})(ArrayInfo);


/* 
 * Test Cases for Nested Array Examiner Module
 */

//var givenArray = [window.ArrayInfo.getValues];

//var undef;
//var givenArray = [1, 2, "c", true, undef];

//var funny = function() { return; };
//var givenArray = [1, null, funny];

//var givenArray = [1, NaN, Infinity];
//var givenArray = [1, 2, 3, [4, 5]];
//var givenArray = [[4, 5], 1, 2, 3];
//var givenArray = [1, [3, 4], 2, [5, 6]];
//var givenArray = [[3, 4], 1, [5, 6], 2];
//var givenArray = [1, [3, [5, 6], 4], 2];
//var givenArray = [1, 2, [[6, 7, 8], 4, [9, 10]], 3, [5]];
//var givenArray = [[3], 1, [[6, 7, 8], 4, [9, 10]], 2, [5]];
//var givenArray = [1, [3, [7, 8], 4], [5, [9, 10], 6], 2];
//var givenArray = [1, [3, [4, 5, [6, 7]]], 2];
//var givenArray = [1, 2, [3, [4, [5, 6]]]];
//var givenArray = [1, 2, [[[11, 12], 5, 6, 7], 4, [8, 9, 10]], 3];
//var givenArray = [1, 2, [[[[13, 14], 11, 12], 5, 6, 7], 4, [8, 9, 10]], 3]; 
//var givenArray = [1, 2, [[[[[15, 16], 13, 14], 11, 12], 5, 6, 7], 4, [8, 9, 10]], 3];
var givenArray = [1, 2, [4, [5, [6, 7, [8, 9, 10, [11, 12, [13, 14]]]]]], 3];

var allValues = window.ArrayInfo.getValues(givenArray);

console.log(allValues);

var arraySource = window.ArrayInfo.getSource(givenArray);

console.log(" ");
console.log("The array source:");
console.log(arraySource);
console.log("Can use source to clone array: " + window.ArrayInfo.canUseSourceToCloneArray);
console.log("Number of levels in array: " + ArrayInfo.nestedArrayLevels);

console.log(" ");
console.log("The original array, which will be incomplete or empty except for non-nested arrays:");
console.log(givenArray);
console.log(" ");
console.log("The rebuilt cloned copy of the original array:");
console.log(ArrayInfo.rebuildOriginalArray());
