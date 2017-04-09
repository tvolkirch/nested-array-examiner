/*
 * Nested Array Examiner Module
 *
 * - get all primitive values and their level of nesting in a nested array
 *
 *       var valuesString = window.ArrayInfo.getValues(givenArray);
 *
 * - get the source used to declare the array (see warning below)
 *
 *       var sourceString = window.ArrayInfo.getSource(givenArray);
 *
 * - tell whether or not the source can be used to clone the array
 *
 *       var booleanFlag = window.ArrayInfo.canUseSourceToCloneArray;
 *
 * WARNING: Objects and functions are not displayed and any array with a 
 *          function or object element cannot be cloned with the source.
 *
 *          Object array elements are displayed as "{object}".
 *          Function array elements are displayed as "<function()>".
 */
 
var ArrayInfo = ArrayInfo || {};

ArrayInfo = (function(arrayInfo)
{
    "use strict";
    
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
    
    arrayInfo.setCanUseSourceToCloneArray = function(trueOrFalse)
    {
        arrayInfo.canUseSourceToCloneArray = trueOrFalse;
    }
    
    arrayInfo.setCanUseSourceToCloneArray(false);
        
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

    function processValueForSource(allValues, val, notLastElement, stackLength, nestEndCount)
    {
        if (typeof val === "function")
        {
            val = "\"<function()>\"";
            arrayInfo.setCanUseSourceToCloneArray(false);
        }
        else if (typeof val === "object")
        {
            val = "\"{object}\"";
            arrayInfo.setCanUseSourceToCloneArray(false)
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
    
    arrayInfo.getSource = function(givenArray)
    {
        var len = givenArray.length;
        var stack = [];
        var currentArray = [];
        var nestEndCount = 0;
        var val;
        var allValues = "[";
        var foundObjectOrFunction = false;

        if (Array.isArray(givenArray) && len > 0)
        {
            stack.push(givenArray);
            arrayInfo.setCanUseSourceToCloneArray(true);
        }
        
        // use last in, first out (LIFO) stack to store partial arrays

        while (stack.length > 0)
        {
            currentArray = stack.pop();
            len = currentArray.length;
    
            for (var i = 0; i < len; i++)
            {
                val = currentArray[i];
    
                if (Array.isArray(val))
                {
                    currentArray.splice(0, (i + 1));
                    
                    // push remainder of current array onto stack first
                    // push current array element on stack next to process it next
                    
                    if (currentArray.length > 0)
                    {
                        stack.push(currentArray);
                    }
                    
                    stack.push(val);
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
                    allValues = processValueForSource(allValues, val, (i < (len - 1)), stack.length, nestEndCount);
                    
                    if (i === (len - 1))
                    {
                        nestEndCount = 0;
                    }
                }
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
//var givenArray = [1, [3, [5, 6], 4], 2];
//var givenArray = [1, 2, [[6, 7, 8], 4, [9, 10]], 3, [5]];
//var givenArray = [[3], 1, [[6, 7, 8], 4, [9, 10]], 2, [5]];
//var givenArray = [1, [3, [7, 8], 4], [5, [9, 10], 6], 2];
//var givenArray = [1, [3, [4, 5, [6, 7]]], 2];
var givenArray = [1, 2, [3, [4, [5, 6]]]];

var allValues = window.ArrayInfo.getValues(givenArray);

console.log(allValues);

var arraySource = window.ArrayInfo.getSource(givenArray);

console.log(arraySource);
console.log("Can use source to clone array: " + window.ArrayInfo.canUseSourceToCloneArray);
