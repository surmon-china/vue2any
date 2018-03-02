/**
 * Created by zj-db0758 on 17/3/20.
 */
const MATCH_CHAR = {
    '(': ')',
    '[': ']',
    '{': '}',
};
const NUMBER_LIST = '-0123456789';
const OP = ['+', '-', '*', '/'];

function log(...arg) {
    console.log(...arg);
}

function extend(obj, extendObj) {
    for (let key of Object.keys(extendObj)) {
        obj.prototype[key] = extendObj[key];
    }
}

function isNumber(n) {
    return typeof n === 'number';
}

function isString(str) {
    return typeof str === 'string';
}

function each(obj, fn) {
    for (let key of Object.keys(obj)) {
        fn(key, obj[key]);
    }
}

function doFn(fn, n, ...args) {
    for (let i = 0; i < n; i += 1) {
        fn(...args);
    }
}

function isNumberStr(str) {
    return NUMBER_LIST.has(str);
}
function isVar(str) {
    return str.search(/$\w/);
}
function isArray(obj) {
    return Array.isArray(obj);
}

function isOp(char) {
    return OP.has(char);
}

extend(String, {
    first() {
        return this[0];
    },
    last() {
        return this[this.length - 1];
    },
    has(str) {
        let have = false;
        for (let i = 0; i < this.length; i++) {
            if (this[i] === str) {
                have = true;
            }
        }
        return have;
    },
    bool() {
        return (/^true$/i).test(this);
    },
    sliceAll(start, end) {
        // start to end 包括start end
        return this.slice(start, end + 1);
    },
    sliceMin(start, end) {
        // 不包括start end
        return this.slice(start + 1, end);
    },
    getOuter(matchChar = this.first()) {
        return matchChar + this.getInner(matchChar) + MATCH_CHAR[matchChar];
    },
    getInner(matchChar = this.first()) {
        return this.getAllContent(matchChar).last();
    },
    getAllContent(matchChar = this.first()) {
        function matchBracesToGetContentScope(braceIndex, rightBraces) {
            let matches = false;
            for (let v of rightBraces) {
                if (braceIndex < v) {
                    matches = [braceIndex, v];
                    rightBraces.remove(v);
                    break;
                }
            }
            return matches;
        }

        let input = this;
        let leftBraces = [];
        let rightBraces = [];
        let matchBraces = [];
        let bracesContent = [];
        let leftMatchChar = matchChar;
        let rightMatchChar = MATCH_CHAR[leftMatchChar];

        Array.from(input).forEach((v, i) => {
            if (v === leftMatchChar) {
                leftBraces.unshift(i)
            } else if (v === rightMatchChar) {
                rightBraces.push(i)
            }
        });
        for (let v of leftBraces) {
            matchBraces.push(matchBracesToGetContentScope(v, rightBraces));
        }

        matchBraces.forEach((item) => {
            bracesContent.push(input.sliceMin(item[0], item[1]));
        });
        return bracesContent;
    },
    arraySplit() {
        // 仅第一层分割
        let arrayStr = this;
        let commaIndexArr = [];
        let len = arrayStr.length;
        let splitArr = [];
        for (let i = 0; i < len; i += 1) {
            let char = arrayStr[i];
            if (char === ',') {
                // 向左跑
                let left = false;
                let right = false;
                for (let j = i; j >= 0; j -= 1) {
                    if (arrayStr[j] === '[') {
                        left = true;
                    } else if (arrayStr[j] === ']') {
                        break;
                    }
                }

                // 向右跑
                for (let j = i; j < len; j += 1) {
                    if (arrayStr[j] === ']') {
                        right = true;
                    } else if (arrayStr[j] === '[') {
                        break;
                    }
                }

                if (!left && !right) {
                    commaIndexArr.push(i);
                }
            }
        }

        let splitIndex = 0;
        commaIndexArr.forEach((i) => {
            splitArr.push(arrayStr.substring(splitIndex, i));
            splitIndex = i + 1;
        });

        if (commaIndexArr.length === 0) {
            splitArr.push(arrayStr);
        } else {
            let last = arrayStr.substring(splitIndex);
            if (last !== '') {
                splitArr.push(last);
            }
        }
        return splitArr;
    },
    splitIgnoreWrap(token) {
        let str = this;
        let isInWrap;
        for (let i = 0; i < str.length; i += 1) {
            let char = str[i];
            if (char) {

            }
        }
    },
    expressionSplit() {
        let contentArr = [];
        let opArr = [];
        let opIndex = 0;
        let content = "";
        for (let i = 0; i < this.length; i += 1) {
            let char = this[i];
            if (isOp(char)) {
                contentArr.push(content);
                content = "";
                opArr.push(char);
                opIndex = i;
            } else {
                content += char;
            }
        }
        if (opIndex === 0) {
            contentArr.push(this.slice(0));
        } else {
            contentArr.push(this.slice(opIndex + 1));
        }
        return {
            contentArr,
            opArr,
        }
    },
    getNameFromExp() {
        return this.slice(this.search(/\./) + 1);
    },
    isWrapToken() {
        for (let key of Object.keys(MATCH_CHAR)) {
            if (this[0] === key[0]) {
                return true;
            }
        }
    }
});

extend(Map, {
    addDataToKey(key, data) {
        const arr = this.get(key);
        console.log(arr);
        if (arr) {
            arr.push(data);
        } else {
            this.set(key, [data]);
        }
    },
    toObj() {
        let obj = {};
        for (let [k, v] of this) {
            obj[k] = v;
        }
        return obj;
    }
});

extend(Array, {
    has(otherItem) {
        for (let item of this) {
            if (item === otherItem) {
                return true;
            }
        }
        return false;
    },
    remove(val) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === val) {
                this.splice(i, 1);
                return this;
            }
        }
    },
    isEmpty() {
        return this.length <= 0;
    },
    contain(obj) {
        let i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    },
    prev(item) {
        return this[this.indexOf(item) - 1];
    },
    min(prop) {
        if (this.isEmpty()) {
            return false;
        }
        let minItem = this[0];
        for (let item of this) {
            if (item[prop] < minItem[prop]) {
                minItem = item;
            }
        }
        return minItem;
    },
    max(props) {
        if (this.isEmpty()) {
            return null;
        }
        let maxItem = this[0], maxItemV = 0;
        for (let prop of props) {
            maxItemV += maxItem[prop];
        }
        for (let item of this) {
            let v = 0;
            for (let prop of props) {
                v += item[prop];
            }
            if (v > maxItemV) {
                maxItemV = v;
                maxItem = item;
            }
        }
        return maxItemV;
    },
    pushArr(arr, ...otherArr) {
        for (let i = 0; i < arr.length; i += 1) {
            this.push(arr[i])
        }
        console.log(otherArr);
    },
    all() {

    },
    hasObj() {

    },
    last() {
        return this[this.length - 1];
    }

});

extend(Date, {
    getYMD() {
        return `${this.getFullYear()}/${this.getMonth() + 1}/${this.getDate()}`;
    }
});

function Obj(obj) {
    let propArr = [];
    for (let key of Object.keys(obj)) {
        propArr.push([key, obj[key]]);
    }
    return new Map(propArr);
}


